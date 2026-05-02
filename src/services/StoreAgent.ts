/**
 * Butiks-agent — lytter på nervesystemet; kender kun til events + OrderManager.
 */

import {
  LoomyEvents,
  subscribeLoomyEvent,
  type LoomyOrderSnapshot,
} from "@/lib/events";
import { createServiceSupabase } from "@/lib/supabase/service";
import { createSupabaseOrderManagerRepository } from "@/server/orders/orderManagerRepository";
import { StoreNotificationService } from "@/server/store/StoreNotificationService";
import { publishStoreChannel } from "@/server/store/storeChannelHub";
import { getOrderManager } from "@/server/courier/courierDispatchSingleton";
import type { Order } from "./domain";

let started = false;

function snapshotToOrder(s: LoomyOrderSnapshot): Order {
  return {
    id: s.orderId,
    storeId: s.storeId,
    courierId: s.courierId,
    status: s.status,
    orderDetails: s.orderDetails,
    updatedAt: s.updatedAt,
  };
}

/**
 * Marker ordre klar i DB; OrderManager udsender `ORDER_READY` til bud-agenten.
 */
export async function markAsReady(orderId: string): Promise<void> {
  console.log(
    `[STORE AGENT]: markAsReady → order ${orderId} (OrderManager.transitionToReady)`
  );
  await getOrderManager().transitionToReady(orderId);
}

export function registerStoreAgent(): void {
  if (started) return;
  started = true;

  const repo = createSupabaseOrderManagerRepository(createServiceSupabase());
  const notifier = new StoreNotificationService({ repo });

  subscribeLoomyEvent(LoomyEvents.ORDER_PAID, async (payload) => {
    const o = snapshotToOrder(payload.order);
    console.log(
      `[STORE AGENT]: Modtaget ORDER_PAID — ordre ${o.id} butik ${o.storeId} (notifikation / SSE)`
    );
    await notifier.notifyStorePaid(o.id);
  });

  subscribeLoomyEvent(LoomyEvents.ORDER_DISPATCH_FAILED, async (payload) => {
    const row = await repo.getById(payload.orderId);
    if (!row) return;
    publishStoreChannel(row.storeId, LoomyEvents.ORDER_DISPATCH_FAILED, payload);
    console.warn(
      `[STORE AGENT]: ORDER_DISPATCH_FAILED → SSE til butik ${row.storeId} ordre=${payload.orderId}`
    );
  });

  console.log("[STORE AGENT]: Lytter på ORDER_PAID, ORDER_DISPATCH_FAILED");
}
