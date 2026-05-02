/**
 * Courier agent — on ORDER_READY_FOR_PICKUP, broadcast to marketplace (eligible couriers).
 */

import { LoomyEvents, emitLoomyEvent, subscribeLoomyEvent } from "@/lib/events";
import { getCourierDispatchSystem } from "@/server/courier/courierDispatchSingleton";

let unsub: (() => void) | null = null;

export function registerCourierDispatchAgent(): void {
  if (unsub) return;
  unsub = subscribeLoomyEvent(LoomyEvents.ORDER_READY_FOR_PICKUP, async (payload) => {
    console.info(
      `[LOOMY agent:courier] ORDER_READY_FOR_PICKUP → broadcast order=${payload.orderId}`
    );
    try {
      await getCourierDispatchSystem().broadcastOrderToCouriers(payload.orderId);
    } catch (e) {
      console.error("[LOOMY agent:courier] broadcast failed", payload.orderId, e);
      emitLoomyEvent(LoomyEvents.ORDER_DISPATCH_FAILED, {
        orderId: payload.orderId,
        reason: e instanceof Error ? e.message : "broadcast_error",
        eligibleCourierCount: -1,
      });
    }
  });
  console.info("[LOOMY agent:courier] listening on ORDER_READY_FOR_PICKUP");
}
