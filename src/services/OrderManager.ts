/**
 * LOOMY service facade — order lifecycle (server-only).
 * Emits on `@/lib/events` bus: ORDER_PAID, ORDER_READY_FOR_PICKUP, ORDER_DELIVERED (via OrderManager hooks).
 */

import { getOrderManager } from "@/server/courier/courierDispatchSingleton";
import type { OrderManagerRow } from "@/server/orders/orderManagerTypes";
import type { RegisterPendingOrderInput } from "@/server/orders/orderManagerTypes";

export async function registerPendingOrder(
  input: RegisterPendingOrderInput
): Promise<OrderManagerRow> {
  return getOrderManager().registerPendingOrder(input);
}

export async function transitionOrderToPaid(orderId: string): Promise<OrderManagerRow> {
  return getOrderManager().transitionToPaid(orderId);
}

/** Butiks-agent / orchestrator: paid → ready_for_pickup (+ courier broadcast hook). */
export async function transitionOrderToReady(orderId: string): Promise<OrderManagerRow> {
  return getOrderManager().transitionToReady(orderId);
}

export async function transitionOrderToOutForDelivery(
  orderId: string
): Promise<OrderManagerRow> {
  return getOrderManager().transitionToOutForDelivery(orderId);
}

export async function transitionOrderToDelivered(
  orderId: string
): Promise<OrderManagerRow> {
  return getOrderManager().transitionToDelivered(orderId);
}
