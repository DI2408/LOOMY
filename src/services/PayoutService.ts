/**
 * Finans-agent — lytter på ORDER_DELIVERED; beregner 80/15/5 split og klargør udbetaling (Stripe via orchestrator).
 */

import { LoomyEvents, subscribeLoomyEvent } from "@/lib/events";
import { createServiceSupabase } from "@/lib/supabase/service";
import {
  createSupabaseOrderManagerRepository,
} from "@/server/orders/orderManagerRepository";
import { computeDefaultPercentSplit } from "@/server/payout/defaultOrderSplit";
import type { StoreOrderDetailsJson } from "@/server/events/orderPaidEvents";

let started = false;

function readTotalMinor(details: StoreOrderDetailsJson): number | null {
  for (const key of ["totalMinorUnits", "orderTotalMinorUnits", "amountMinor"] as const) {
    const v = details[key];
    const n = typeof v === "number" ? v : Number(v);
    if (Number.isFinite(n) && n > 0) return Math.floor(n);
  }
  return null;
}

export function registerPayoutService(): void {
  if (started) return;
  started = true;

  subscribeLoomyEvent(LoomyEvents.ORDER_DELIVERED, async (payload) => {
    const repo = createSupabaseOrderManagerRepository(createServiceSupabase());
    const row = await repo.getById(payload.orderId);
    if (!row) {
      console.warn(`[PAYOUT SERVICE]: Ingen ordre ${payload.orderId} — springer payout over`);
      return;
    }

    const total = readTotalMinor(row.orderDetails as StoreOrderDetailsJson);
    const split =
      total != null ? computeDefaultPercentSplit(total) : null;

    if (split) {
      console.log(
        `[PAYOUT SERVICE]: ORDER_DELIVERED order=${payload.orderId} — split 80/15/5 (minor units) butik=${split.storeNetMinorUnits} bud=${split.courierHonorariumMinorUnits} LOOMY=${split.loomyCommissionMinorUnits} (total=${total})`
      );
    } else {
      console.log(
        `[PAYOUT SERVICE]: ORDER_DELIVERED order=${payload.orderId} — mangler totalMinorUnits til split-log`
      );
    }

    try {
      const { getPayoutOrchestrator } = await import("@/server/payout/payoutSingleton");
      const result = await getPayoutOrchestrator().onOrderDelivered(row);
      console.log(
        `[PAYOUT SERVICE]: Stripe/transfers store=${result.stripe.storeTransferId ?? "—"} bud=${result.stripe.courierTransferId ?? "—"} (${result.stripe.skippedReason ?? "ok"})`
      );
    } catch (e) {
      console.error("[PAYOUT SERVICE]: orchestration fejlede", e);
    }
  });

  console.log("[PAYOUT SERVICE]: Lytter på ORDER_DELIVERED");
}
