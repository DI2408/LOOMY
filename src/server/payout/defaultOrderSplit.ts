import type { StoreOrderDetailsJson } from "@/server/events/orderPaidEvents";

function readTotalMinor(details: StoreOrderDetailsJson): number | null {
  for (const key of ["totalMinorUnits", "orderTotalMinorUnits", "amountMinor"] as const) {
    const v = details[key];
    const n = typeof v === "number" ? v : Number(v);
    if (Number.isFinite(n) && n > 0) return Math.floor(n);
  }
  return null;
}

export type PercentSplit = {
  storeNetMinorUnits: number;
  courierHonorariumMinorUnits: number;
  loomyCommissionMinorUnits: number;
};

/**
 * Standard LOOMY split at delivery: **80%** butik, **15%** bud, **5%** platform (af total, minor units).
 * Afrunding: platform og bud først, butik får resten så summen matcher `total`.
 */
export function computeDefaultPercentSplit(
  totalMinorUnits: number
): PercentSplit {
  if (totalMinorUnits <= 0) {
    return {
      storeNetMinorUnits: 0,
      courierHonorariumMinorUnits: 0,
      loomyCommissionMinorUnits: 0,
    };
  }
  const loomyCommissionMinorUnits = Math.round(totalMinorUnits * 0.05);
  const courierHonorariumMinorUnits = Math.round(totalMinorUnits * 0.15);
  const storeNetMinorUnits = Math.max(
    0,
    totalMinorUnits - loomyCommissionMinorUnits - courierHonorariumMinorUnits
  );
  return {
    storeNetMinorUnits,
    courierHonorariumMinorUnits,
    loomyCommissionMinorUnits,
  };
}

/** Merge explicit split into order_details for PayoutOrchestrator. */
export function mergeSplitIntoOrderDetails(
  details: StoreOrderDetailsJson,
  split: PercentSplit
): StoreOrderDetailsJson {
  return {
    ...details,
    loomyCommissionMinorUnits: split.loomyCommissionMinorUnits,
    courierHonorariumMinorUnits: split.courierHonorariumMinorUnits,
    /** Not used directly by Stripe transfer (store net is derived), kept for audit. */
    storeNetMinorUnits: split.storeNetMinorUnits,
  };
}

/** When order has no explicit payout lines, apply 80/15/5 before `calculatePayoutBreakdown`. */
export function applyDefaultSplitIfUnset(
  details: StoreOrderDetailsJson
): StoreOrderDetailsJson {
  const hasExplicit =
    details.loomyCommissionMinorUnits != null &&
    details.courierHonorariumMinorUnits != null;
  if (hasExplicit) return details;
  const total = readTotalMinor(details);
  if (total == null) return details;
  return mergeSplitIntoOrderDetails(details, computeDefaultPercentSplit(total));
}
