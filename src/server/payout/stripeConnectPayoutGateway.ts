import type {
  StripeConnectPayoutInput,
  StripeConnectPayoutResult,
} from "./payoutTypes";

export type StripeConnectPayoutGateway = {
  preparePayouts(input: StripeConnectPayoutInput): Promise<StripeConnectPayoutResult>;
};

/**
 * Creates Stripe Transfers from the **platform balance** to connected accounts.
 * Ensure the customer's charge was captured to the platform (or use separate
 * transfer_data on PaymentIntent) so funds exist before calling this.
 */
export function createStripeConnectPayoutGateway(): StripeConnectPayoutGateway {
  return {
    async preparePayouts(
      input: StripeConnectPayoutInput
    ): Promise<StripeConnectPayoutResult> {
      const secret = process.env.STRIPE_SECRET_KEY;
      if (!secret) {
        return {
          storeTransferId: null,
          courierTransferId: null,
          skippedReason: "missing_STRIPE_SECRET_KEY",
        };
      }

      const { default: Stripe } = await import("stripe");
      const stripe = new Stripe(secret, {
        typescript: true,
      });

      const { orderId, currency, breakdown } = input;
      const transferGroup = `loomy_order_${orderId}`;

      let storeTransferId: string | null = null;
      let courierTransferId: string | null = null;

      if (
        input.storeStripeAccountId &&
        breakdown.storeNetMinorUnits > 0
      ) {
        const t = await stripe.transfers.create({
          amount: breakdown.storeNetMinorUnits,
          currency,
          destination: input.storeStripeAccountId,
          transfer_group: transferGroup,
          metadata: {
            loomy_order_id: orderId,
            recipient: "store",
          },
        });
        storeTransferId = t.id;
      }

      if (
        input.courierStripeAccountId &&
        breakdown.courierHonorariumMinorUnits > 0
      ) {
        const t = await stripe.transfers.create({
          amount: breakdown.courierHonorariumMinorUnits,
          currency,
          destination: input.courierStripeAccountId,
          transfer_group: transferGroup,
          metadata: {
            loomy_order_id: orderId,
            recipient: "courier",
          },
        });
        courierTransferId = t.id;
      }

      return { storeTransferId, courierTransferId };
    },
  };
}

export function createNoopStripeConnectPayoutGateway(): StripeConnectPayoutGateway {
  return {
    async preparePayouts(): Promise<StripeConnectPayoutResult> {
      return {
        storeTransferId: null,
        courierTransferId: null,
        skippedReason: "noop_gateway",
      };
    },
  };
}
