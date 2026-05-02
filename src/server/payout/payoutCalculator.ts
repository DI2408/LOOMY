import type { StoreOrderDetailsJson } from "@/server/events/orderPaidEvents";
import type { PayoutBreakdown } from "./payoutTypes";

function readInt(details: StoreOrderDetailsJson, key: string): number | null {
  const v = details[key];
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : null;
}

/**
 * Payout math (minor units, same currency as order):
 *
 * 1) If `loomyCommissionMinorUnits` + `courierHonorariumMinorUnits` are set on the order,
 *    `storeNet = total - loomy - courier` (must be ≥ 0).
 * 2) Else if `loomyFeeMinorUnits` (absolute platform fee): store gross share is
 *    `total - loomyFee`; courier is explicit `courierHonorariumMinorUnits` or bps of total;
 *    `storeNet = total - loomy - courier`.
 * 3) Else: bps on total for platform + courier; store = remainder.
 */
export function calculatePayoutBreakdown(
  details: StoreOrderDetailsJson,
  env: NodeJS.ProcessEnv = process.env
): PayoutBreakdown {
  const currency = String(details.currency ?? "dkk").toLowerCase();

  const total =
    readInt(details, "totalMinorUnits") ??
    readInt(details, "orderTotalMinorUnits") ??
    readInt(details, "amountMinor");

  if (total == null || total <= 0) {
    throw new PayoutCalculationError(
      "Ordren mangler totalMinorUnits (eller orderTotalMinorUnits) i order_details."
    );
  }

  const explicitLoomy = readInt(details, "loomyCommissionMinorUnits");
  const explicitCourier = readInt(details, "courierHonorariumMinorUnits");

  if (explicitLoomy != null && explicitCourier != null) {
    if (explicitLoomy + explicitCourier > total) {
      throw new PayoutCalculationError(
        "loomyCommissionMinorUnits + courierHonorariumMinorUnits overstiger total."
      );
    }
    return {
      currency,
      totalMinorUnits: total,
      loomyCommissionMinorUnits: explicitLoomy,
      courierHonorariumMinorUnits: explicitCourier,
      storeNetMinorUnits: total - explicitLoomy - explicitCourier,
    };
  }

  const loomyFeeAbsolute =
    readInt(details, "loomyFeeMinorUnits") ??
    readInt(details, "platformFeeMinorUnits");

  const platformBps =
    readInt(details, "loomyCommissionBps") ??
    readInt(details, "platformFeeBps") ??
    parseBps(env.LOOMY_PLATFORM_FEE_BPS, 1200);

  const courierBps =
    readInt(details, "courierFeeBps") ??
    parseBps(env.LOOMY_COURIER_FEE_BPS, 800);

  const loomyCommissionMinorUnits =
    explicitLoomy ??
    loomyFeeAbsolute ??
    Math.min(total, Math.round((total * platformBps) / 10000));

  const courierHonorariumMinorUnits =
    explicitCourier ??
    Math.min(
      total - loomyCommissionMinorUnits,
      Math.round((total * courierBps) / 10000)
    );

  const storeNetMinorUnits = Math.max(
    0,
    total - loomyCommissionMinorUnits - courierHonorariumMinorUnits
  );

  if (
    loomyCommissionMinorUnits +
      courierHonorariumMinorUnits +
      storeNetMinorUnits >
    total
  ) {
    throw new PayoutCalculationError("Udbetalingsfordeling overstiger ordretotal.");
  }

  return {
    currency,
    totalMinorUnits: total,
    loomyCommissionMinorUnits,
    courierHonorariumMinorUnits,
    storeNetMinorUnits,
  };
}

function parseBps(raw: string | undefined, fallback: number): number {
  if (!raw) return fallback;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 && n <= 5000 ? Math.floor(n) : fallback;
}

export class PayoutCalculationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PayoutCalculationError";
  }
}
