/**
 * LOOMY — Customer agent shared types (Golden Path: store → cart → pay → handover).
 */

export type InventoryLine = {
  productId: string;
  sku: string;
  name: string;
  /** Units available to sell right now. */
  quantityAvailable: number;
  /** Optional minor-unit price (øre) for checkout totals. */
  priceMinorUnits?: number;
};

export type CartLine = {
  productId: string;
  sku: string;
  name: string;
  quantity: number;
  /** Snapshot minor unit price per line item (optional for receipts). */
  unitPriceMinorUnits?: number;
};

export type CartState = {
  storeId: string;
  lines: CartLine[];
};

export type PaymentStatus = "success" | "failed" | "pending";

export type PaymentResult =
  | { status: "success"; paymentIntentId: string }
  | { status: "failed"; message: string }
  | { status: "pending"; message?: string };

export type OrderDetails = {
  orderId: string;
  storeId: string;
  customerEmail: string;
  lines: ReadonlyArray<CartLine>;
  totalMinorUnits: number;
  currency: string;
};

export type OrderConfirmation = OrderDetails & {
  paidAt: string;
  /** Human-readable or template-filled receipt body for email / UI. */
  receipt: string;
};

export type ReceiptPayload = {
  orderId: string;
  body: string;
};
