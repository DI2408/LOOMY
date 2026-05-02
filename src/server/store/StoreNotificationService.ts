import { LoomyEvents } from "@/lib/events";
import type { OrderManagerRepository } from "@/server/orders/orderManagerRepository";
import { publishStoreChannel } from "./storeChannelHub";
import { storePresence } from "./storePresence";

export type StoreNotificationServiceDeps = {
  repo: OrderManagerRepository;
};

/**
 * Store agent: push paid orders to the store channel (SSE) or mark offline queue.
 */
export class StoreNotificationService {
  constructor(private readonly deps: StoreNotificationServiceDeps) {}

  async notifyStorePaid(orderId: string): Promise<void> {
    const row = await this.deps.repo.getById(orderId);
    if (!row) return;

    const payload = {
      orderId: row.id,
      storeId: row.storeId,
      status: row.status,
      orderDetails: row.orderDetails,
      updatedAt: row.updatedAt,
    };

    if (storePresence.isStoreOnline(row.storeId)) {
      publishStoreChannel(row.storeId, LoomyEvents.ORDER_PAID, payload);
      console.info(
        `[LOOMY store] SSE → store ${row.storeId} ORDER_PAID order=${orderId}`
      );
      return;
    }

    await this.deps.repo.setOfflinePushQueued(orderId, true);
    console.info(
      `[LOOMY store] offline queue ORDER_PAID order=${orderId} store=${row.storeId}`
    );
  }
}
