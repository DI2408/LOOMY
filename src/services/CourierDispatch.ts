/**
 * LOOMY service facade — bud-markedplace: broadcast og accept (server-only).
 */

import { getCourierDispatchSystem } from "@/server/courier/courierDispatchSingleton";
import type { OrderManagerRow } from "@/server/orders/orderManagerTypes";

export async function broadcastOrderToCouriers(orderId: string) {
  return getCourierDispatchSystem().broadcastOrderToCouriers(orderId);
}

export async function acceptOrderForCourier(
  courierId: string,
  orderId: string
): Promise<OrderManagerRow> {
  return getCourierDispatchSystem().acceptOrder(courierId, orderId);
}
