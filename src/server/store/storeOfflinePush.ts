import type { StoreOrderDetailsJson } from "@/server/events/orderPaidEvents";

/**
 * Stub: kobl til FCM / APNs / web push worker. Køen er markeret i DB (`offline_push_queued`).
 */
export async function prepareOfflinePushForPaidOrder(
  orderId: string,
  storeId: string,
  orderDetails: StoreOrderDetailsJson
): Promise<void> {
  void orderDetails;
  console.info(
    `[loomy] Store offline push prepared for order ${orderId} (store ${storeId})`
  );
}
