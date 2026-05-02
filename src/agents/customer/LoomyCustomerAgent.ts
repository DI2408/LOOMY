/**
 * LOOMY Customer Agent — Golden Path: store → cart (stock) → checkout → payment → handover.
 *
 * Deterministic flow with explicit state checks. Wire `CustomerAgentAdapters` to
 * Supabase (inventory, orders), Stripe (PaymentGateway), and Realtime for store/courier.
 */

import type { CustomerAgentAdapters } from "./customerAdapters";
import { CustomerCart } from "./customerCart";
import type {
  InventoryLine,
  OrderConfirmation,
  OrderDetails,
  PaymentResult,
} from "./types";

export type CustomerAgentPhase =
  | "idle"
  | "store_selected"
  | "cart_active"
  | "checkout"
  | "awaiting_payment"
  | "completed"
  | "error";

export type CustomerAgentSnapshot = {
  phase: CustomerAgentPhase;
  storeId: string | null;
  orderId: string | null;
  lastPayment: PaymentResult | null;
  lastError: string | null;
};

export type CheckoutPayInput = {
  customerEmail: string;
  currency: string;
  /**
   * If omitted, totals are summed from cart line `unitPriceMinorUnits` when present.
   * Prefer server-calculated totals in production.
   */
  totalMinorUnits?: number;
};

export class LoomyCustomerAgent {
  private readonly adapters: CustomerAgentAdapters;
  private readonly cart = new CustomerCart();
  private inventory: readonly InventoryLine[] = [];
  private phase: CustomerAgentPhase = "idle";
  private storeId: string | null = null;
  private orderId: string | null = null;
  private lastPayment: PaymentResult | null = null;
  private lastError: string | null = null;

  constructor(adapters: CustomerAgentAdapters) {
    this.adapters = adapters;
  }

  getSnapshot(): CustomerAgentSnapshot {
    return {
      phase: this.phase,
      storeId: this.storeId,
      orderId: this.orderId,
      lastPayment: this.lastPayment,
      lastError: this.lastError,
    };
  }

  getCart(): ReturnType<CustomerCart["getState"]> {
    return this.cart.getState();
  }

  getInventory(): readonly InventoryLine[] {
    return this.inventory;
  }

  /**
   * Store Selection — fetch inventory for `storeId`.
   */
  async selectStore(storeId: string): Promise<void> {
    this.lastError = null;
    this.storeId = storeId;
    this.cart.bindStore(storeId);
    this.inventory = await this.adapters.getStoreInventory(storeId);
    this.phase = "store_selected";
    if (this.cart.getState()?.lines.length) {
      this.phase = "cart_active";
    }
  }

  /**
   * Cart Management — verify stock on every add.
   */
  async addToCart(productId: string, quantity: number): Promise<void> {
    this.lastError = null;
    if (!this.storeId) {
      this.phase = "error";
      this.lastError = "Vælg en butik først.";
      return;
    }
    const added = this.cart.add(productId, quantity, this.inventory);
    if (!added.ok) {
      this.phase = "error";
      this.lastError = added.reason;
      return;
    }
    this.phase = "cart_active";
  }

  /**
   * Checkout + Payment — validate cart, charge gateway, then handover only on success.
   */
  async checkoutAndPay(input: CheckoutPayInput): Promise<OrderConfirmation | null> {
    this.lastError = null;
    this.lastPayment = null;

    if (this.phase === "error") {
      this.lastError = "Ret fejlen før du fortsætter.";
      return null;
    }
    if (!this.storeId) {
      this.phase = "error";
      this.lastError = "Ingen butik valgt.";
      return null;
    }

    this.phase = "checkout";
    this.inventory = await this.adapters.getStoreInventory(this.storeId);

    const stockCheck = this.cart.validateAgainstInventory(this.inventory);
    if (!stockCheck.ok) {
      this.phase = "error";
      this.lastError = stockCheck.reason;
      return null;
    }

    const cartState = this.cart.getState();
    if (!cartState || cartState.lines.length === 0) {
      this.phase = "error";
      this.lastError = "Kurven er tom.";
      return null;
    }

    const totalMinorUnits =
      input.totalMinorUnits ?? sumCartMinorUnits(cartState.lines);
    if (totalMinorUnits <= 0) {
      this.phase = "error";
      this.lastError = "Ugyldigt beløb — angiv totalMinorUnits eller priser på varer.";
      return null;
    }

    const orderId = createOrderId();
    this.orderId = orderId;
    this.phase = "awaiting_payment";

    const paymentResult = await this.adapters.paymentGateway.charge({
      orderId,
      storeId: this.storeId,
      customerEmail: input.customerEmail,
      totalMinorUnits,
      currency: input.currency,
    });

    this.lastPayment = paymentResult;

    if (paymentResult.status === "failed") {
      this.phase = "error";
      this.lastError = paymentResult.message;
      return null;
    }

    if (paymentResult.status === "pending") {
      this.phase = "error";
      this.lastError =
        paymentResult.message ?? "Betaling afventer — prøv igen senere.";
      return null;
    }

    if (paymentResult.status !== "success") {
      this.phase = "error";
      this.lastError = "Ukendt betalingsresultat.";
      return null;
    }

    const paidAt = new Date().toISOString();
    const orderDetails: OrderDetails = {
      orderId,
      storeId: this.storeId,
      customerEmail: input.customerEmail,
      lines: cartState.lines,
      totalMinorUnits,
      currency: input.currency,
    };

    const receipt = buildReceiptText(orderDetails, paidAt);
    const confirmation: OrderConfirmation = {
      ...orderDetails,
      paidAt,
      receipt,
    };

    await this.adapters.sendEmailNotification(
      input.customerEmail,
      { orderId, body: receipt }
    );

    await this.adapters.notifyStore(orderId);
    await this.adapters.broadcastToCouriers(orderDetails);

    this.phase = "completed";
    this.cart.clear();
    return confirmation;
  }
}

function createOrderId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `ord_${crypto.randomUUID()}`;
  }
  return `ord_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function sumCartMinorUnits(
  lines: ReadonlyArray<{ quantity: number; unitPriceMinorUnits?: number }>
): number {
  let sum = 0;
  for (const line of lines) {
    const unit = line.unitPriceMinorUnits;
    if (unit == null || !Number.isFinite(unit)) {
      return 0;
    }
    sum += unit * line.quantity;
  }
  return sum;
}

function buildReceiptText(details: OrderDetails, paidAt: string): string {
  const lines = details.lines
    .map((l) => `- ${l.name} × ${l.quantity}`)
    .join("\n");
  return [
    `LOOMY kvittering`,
    `Ordre: ${details.orderId}`,
    `Butik: ${details.storeId}`,
    `Betalt: ${paidAt}`,
    ``,
    lines,
    ``,
    `Total: ${details.totalMinorUnits} ${details.currency}`,
  ].join("\n");
}
