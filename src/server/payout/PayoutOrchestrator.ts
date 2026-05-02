import type { StoreOrderDetailsJson } from "@/server/events/orderPaidEvents";
import type { OrderManagerRow } from "@/server/orders/orderManagerTypes";
import { calculatePayoutBreakdown } from "./payoutCalculator";
import { applyDefaultSplitIfUnset } from "./defaultOrderSplit";
import type { PayoutBreakdown } from "./payoutTypes";
import type { StripeConnectPayoutGateway } from "./stripeConnectPayoutGateway";

function readStripeAccountId(
  details: StoreOrderDetailsJson,
  key: string
): string | null {
  const v = details[key];
  if (typeof v !== "string") return null;
  const s = v.trim();
  return s.length > 5 ? s : null;
}

export type PayoutOrchestratorDeps = {
  stripeGateway: StripeConnectPayoutGateway;
};

export type OrderDeliveredPayoutResult = {
  orderId: string;
  breakdown: PayoutBreakdown;
  stripe: {
    storeTransferId: string | null;
    courierTransferId: string | null;
    skippedReason?: string;
  };
};

/**
 * When an order is `delivered`, compute store / courier / LOOMY shares and
 * prepare Stripe Connect transfers to connected accounts.
 */
export class PayoutOrchestrator {
  constructor(private readonly deps: PayoutOrchestratorDeps) {}

  async onOrderDelivered(order: OrderManagerRow): Promise<OrderDeliveredPayoutResult> {
    const detailsBefore = order.orderDetails as StoreOrderDetailsJson;
    const details = applyDefaultSplitIfUnset(detailsBefore);
    if (details !== detailsBefore) {
      console.info(
        `[LOOMY payout] order ${order.id} applied default 80/15/5 split on total`
      );
    }
    const breakdown = calculatePayoutBreakdown(details);

    const storeStripeAccountId =
      readStripeAccountId(details, "storeStripeAccountId") ??
      readStripeAccountId(details, "stripeConnectAccountIdStore");

    const courierStripeAccountId =
      readStripeAccountId(details, "courierStripeAccountId") ??
      readStripeAccountId(details, "stripeConnectAccountIdCourier");

    const stripe = await this.deps.stripeGateway.preparePayouts({
      orderId: order.id,
      currency: breakdown.currency,
      breakdown,
      storeStripeAccountId,
      courierStripeAccountId,
    });

    return {
      orderId: order.id,
      breakdown,
      stripe: {
        storeTransferId: stripe.storeTransferId,
        courierTransferId: stripe.courierTransferId,
        skippedReason: stripe.skippedReason,
      },
    };
  }
}
