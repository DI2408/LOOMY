/**
 * Store agent — listens on LOOMY bus for paid orders and notifies the store channel.
 */

import { LoomyEvents, subscribeLoomyEvent } from "@/lib/events";
import { publishStoreChannel } from "@/server/store/storeChannelHub";
import { createServiceSupabase } from "@/lib/supabase/service";
import { createSupabaseOrderManagerRepository } from "@/server/orders/orderManagerRepository";
import { StoreNotificationService } from "@/server/store/StoreNotificationService";

let unsubs: Array<() => void> = [];

export function registerStoreNotificationAgent(): void {
  if (unsubs.length) return;
  const repo = createSupabaseOrderManagerRepository(createServiceSupabase());
  const svc = new StoreNotificationService({ repo });
  unsubs.push(
    subscribeLoomyEvent(LoomyEvents.ORDER_PAID, async (payload) => {
    console.info(
      `[LOOMY agent:store] ORDER_PAID received → notify store for order=${payload.order.orderId}`
    );
    await svc.notifyStorePaid(payload.order.orderId);
    })
  );

  unsubs.push(
    subscribeLoomyEvent(LoomyEvents.ORDER_DISPATCH_FAILED, async (payload) => {
    const row = await repo.getById(payload.orderId);
    if (!row) return;
    publishStoreChannel(row.storeId, LoomyEvents.ORDER_DISPATCH_FAILED, payload);
    console.warn(
      `[LOOMY agent:store] ORDER_DISPATCH_FAILED → store SSE ${row.storeId} order=${payload.orderId}`
    );
    })
  );

  console.info(
    "[LOOMY agent:store] listening on ORDER_PAID, ORDER_DISPATCH_FAILED"
  );
}
