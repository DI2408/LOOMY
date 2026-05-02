/**
 * Bud-agent — lytter på ORDER_READY; broadcast; acceptOrder → COURIER_CLAIMED (via dispatch-lag).
 */

import { LoomyEvents, emitLoomyEvent, subscribeLoomyEvent } from "@/lib/events";
import { getCourierDispatchSystem } from "@/server/courier/courierDispatchSingleton";

let started = false;

export function registerCourierAgent(): void {
  if (started) return;
  started = true;

  subscribeLoomyEvent(LoomyEvents.ORDER_READY, async (payload) => {
    console.log(
      `[COURIER AGENT]: Modtaget ORDER_READY ordre ${payload.orderId} — broadcaster til ledige bude`
    );
    try {
      await getCourierDispatchSystem().broadcastOrderToCouriers(payload.orderId);
    } catch (e) {
      console.error("[COURIER AGENT]: broadcast fejlede", e);
      emitLoomyEvent(LoomyEvents.ORDER_DISPATCH_FAILED, {
        orderId: payload.orderId,
        reason: e instanceof Error ? e.message : "broadcast_error",
        eligibleCourierCount: -1,
      });
    }
  });

  console.log("[COURIER AGENT]: Lytter på ORDER_READY");
}

export async function acceptOrder(courierId: string, orderId: string) {
  console.log(
    `[COURIER AGENT]: acceptOrder bud=${courierId} ordre=${orderId}`
  );
  return getCourierDispatchSystem().acceptOrder(courierId, orderId);
}
