/**
 * Store agent — listens on LOOMY bus for paid orders and notifies the store channel.
 */

import { LoomyEvents, subscribeLoomyEvent } from "@/lib/events";
import { createServiceSupabase } from "@/lib/supabase/service";
import { createSupabaseOrderManagerRepository } from "@/server/orders/orderManagerRepository";
import { StoreNotificationService } from "@/server/store/StoreNotificationService";

let unsub: (() => void) | null = null;

export function registerStoreNotificationAgent(): void {
  if (unsub) return;
  const repo = createSupabaseOrderManagerRepository(createServiceSupabase());
  const svc = new StoreNotificationService({ repo });
  unsub = subscribeLoomyEvent(LoomyEvents.ORDER_PAID, async (payload) => {
    console.info(
      `[LOOMY agent:store] ORDER_PAID received → notify store for order=${payload.order.orderId}`
    );
    await svc.notifyStorePaid(payload.order.orderId);
  });
  console.info("[LOOMY agent:store] listening on ORDER_PAID");
}
