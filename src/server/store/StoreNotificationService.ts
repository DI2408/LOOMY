import { subscribeOrderPaid } from "@/server/events/orderPaidEvents";
import type { OrderManagerRepository } from "@/server/orders/orderManagerRepository";
import { prepareOfflinePushForPaidOrder } from "./storeOfflinePush";
import { storePresence } from "./storePresence";
import { publishStoreSseEvent } from "./storeOrderSseHub";

export type StoreNotificationServiceDeps = {
  repo: OrderManagerRepository;
};

/**
 * Lytter på `order.paid` og leverer `notifyStore` med realtime (SSE) eller offline push-stub.
 */
export class StoreNotificationService {
  private readonly repo: OrderManagerRepository;
  private unsubscribe: (() => void) | null = null;

  constructor(deps: StoreNotificationServiceDeps) {
    this.repo = deps.repo;
  }

  /**
   * Idempotent: sikrer én subscription pr. proces (Node server).
   */
  listen(): void {
    if (this.unsubscribe) return;
    this.unsubscribe = subscribeOrderPaid((payload) => {
      void this.notifyStore(
        payload.storeId,
        payload.orderDetails,
        payload.orderId
      );
    });
  }

  stop(): void {
    this.unsubscribe?.();
    this.unsubscribe = null;
  }

  /**
   * Hvis butikken har aktiv SSE-forbindelse → realtids-besked.
   * Ellers → marker push-kø i DB + `prepareOfflinePushForPaidOrder` stub.
   */
  async notifyStore(
    storeId: string,
    orderDetails: Record<string, unknown>,
    orderId: string
  ): Promise<void> {
    if (storePresence.isStoreOnline(storeId)) {
      publishStoreSseEvent(storeId, "order.paid", {
        orderId,
        storeId,
        orderDetails,
      });
      return;
    }

    await this.repo.setOfflinePushQueued(orderId, true);
    await prepareOfflinePushForPaidOrder(orderId, storeId, orderDetails);
  }
}
