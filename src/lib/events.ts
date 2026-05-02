/**
 * LOOMY Event System — central enum, typed payloads, and process-wide EventEmitter.
 * Agents subscribe for async handoffs (Customer → Store → Courier → Customer).
 */

import { EventEmitter } from "node:events";
import type { StoreOrderDetailsJson } from "@/server/events/orderPaidEvents";
import type { OrderManagerRow } from "@/server/orders/orderManagerTypes";

export const LoomyEvents = {
  ORDER_PAID: "ORDER_PAID",
  ORDER_READY_FOR_PICKUP: "ORDER_READY_FOR_PICKUP",
  COURIER_ASSIGNED: "COURIER_ASSIGNED",
  COURIER_LOCATION_UPDATE: "COURIER_LOCATION_UPDATE",
  ORDER_DELIVERED: "ORDER_DELIVERED",
  ORDER_DISPATCH_FAILED: "ORDER_DISPATCH_FAILED",
} as const;

export type LoomyEventName = (typeof LoomyEvents)[keyof typeof LoomyEvents];

export interface LoomyOrderSnapshot {
  orderId: string;
  storeId: string;
  courierId: string | null;
  status: string;
  orderDetails: StoreOrderDetailsJson;
  updatedAt: string;
}

export interface OrderPaidPayload {
  order: LoomyOrderSnapshot;
}

export interface OrderReadyForPickupPayload {
  orderId: string;
}

export interface CourierAssignedPayload {
  orderId: string;
  courierId: string;
  status: string;
}

export interface CourierLocationUpdatePayload {
  orderId: string;
  courierId: string;
  lat: number;
  lng: number;
  ts: string;
  etaPhrase?: string;
}

export interface OrderDeliveredPayload {
  orderId: string;
}

export interface OrderDispatchFailedPayload {
  orderId: string;
  reason: string;
  eligibleCourierCount: number;
}

export interface LoomyEventPayloadMap {
  [LoomyEvents.ORDER_PAID]: OrderPaidPayload;
  [LoomyEvents.ORDER_READY_FOR_PICKUP]: OrderReadyForPickupPayload;
  [LoomyEvents.COURIER_ASSIGNED]: CourierAssignedPayload;
  [LoomyEvents.COURIER_LOCATION_UPDATE]: CourierLocationUpdatePayload;
  [LoomyEvents.ORDER_DELIVERED]: OrderDeliveredPayload;
  [LoomyEvents.ORDER_DISPATCH_FAILED]: OrderDispatchFailedPayload;
}

const GLOBAL_KEY = "__loomyEventBus";

function getBus(): EventEmitter {
  const g = globalThis as unknown as Record<string, EventEmitter>;
  if (!g[GLOBAL_KEY]) {
    g[GLOBAL_KEY] = new EventEmitter();
    g[GLOBAL_KEY].setMaxListeners(50);
  }
  return g[GLOBAL_KEY];
}

export const loomyEvents = getBus();

export function logRelay(event: string, payload: unknown): void {
  const preview =
    typeof payload === "object" && payload !== null
      ? JSON.stringify(payload).slice(0, 280)
      : String(payload);
  console.info(
    `[LOOMY relay] ${event} → ${preview}${preview.length >= 280 ? "…" : ""}`
  );
}

export function emitLoomyEvent<K extends keyof LoomyEventPayloadMap>(
  event: K,
  payload: LoomyEventPayloadMap[K]
): void {
  logRelay(event as string, payload);
  loomyEvents.emit(event as string, payload);
}

export function orderRowToSnapshot(row: OrderManagerRow): LoomyOrderSnapshot {
  return {
    orderId: row.id,
    storeId: row.storeId,
    courierId: row.courierId,
    status: row.status,
    orderDetails: row.orderDetails,
    updatedAt: row.updatedAt,
  };
}

export function subscribeLoomyEvent<K extends keyof LoomyEventPayloadMap>(
  event: K,
  handler: (payload: LoomyEventPayloadMap[K]) => void | Promise<void>
): () => void {
  const fn = (payload: LoomyEventPayloadMap[K]) => {
    void Promise.resolve(handler(payload)).catch((err: unknown) => {
      console.error(`[LOOMY relay] listener error on ${String(event)}`, err);
    });
  };
  loomyEvents.on(event as string, fn);
  return () => {
    loomyEvents.off(event as string, fn);
  };
}
