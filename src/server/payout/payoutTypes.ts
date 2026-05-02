/**
 * All monetary amounts in minor units (øre for DKK) unless noted.
 */

export type PayoutBreakdown = {
  currency: string;
  totalMinorUnits: number;
  /** Platform / LOOMY commission (kept on platform balance or separate ledger). */
  loomyCommissionMinorUnits: number;
  /** Courier delivery fee (transfer to connected courier account). */
  courierHonorariumMinorUnits: number;
  /** Net to store after platform fee and courier line (Total − Loomy − Bud when using split model). */
  storeNetMinorUnits: number;
};

export type StripeConnectPayoutInput = {
  orderId: string;
  currency: string;
  breakdown: PayoutBreakdown;
  storeStripeAccountId: string | null;
  courierStripeAccountId: string | null;
};

export type StripeConnectPayoutResult = {
  storeTransferId: string | null;
  courierTransferId: string | null;
  skippedReason?: string;
};
