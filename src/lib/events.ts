/**
 * LOOMY Nervesystem — central EventEmitter + typed events.
 * Agenter abonnerer her; de importerer ikke hinanden direkte.
 */

import { EventEmitter } from "node:events";
import type { StoreOrderDetailsJson } from "@/server/events/orderPaidEvents";
import type { OrderManagerRow } from "@/server/orders/orderManagerTypes";

/** Domæne-events (streng konstant for logs og evt. Socket-paritet). */
export const LoomyEvents = {
  ORDER_PAID: "ORDER_PAID",
  ORDER_READY: "ORDER_READY",
  COURIER_CLAIMED: "COURIER_CLAIMED",
  COURIER_POSITION_UPDATE: "COURIER_POSITION_UPDATE",
  ORDER_DELIVERED: "ORDER_DELIVERED",
  /** Ingen bud kunne matches — butik/kunde kan reagere. */
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

export interface OrderReadyPayload {
  orderId: string;
}

export interface CourierClaimedPayload {
  orderId: string;
  courierId: string;
  status: string;
}

export interface CourierPositionUpdatePayload {
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
  [LoomyEvents.ORDER_READY]: OrderReadyPayload;
  [LoomyEvents.COURIER_CLAIMED]: CourierClaimedPayload;
  [LoomyEvents.COURIER_POSITION_UPDATE]: CourierPositionUpdatePayload;
  [LoomyEvents.ORDER_DELIVERED]: OrderDeliveredPayload;
  [LoomyEvents.ORDER_DISPATCH_FAILED]: OrderDispatchFailedPayload;
}

const GLOBAL_KEY = "__loomyNervousSystemEmitter";

export class LoomyEventEmitter extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(50);
  }
}

function getSingleton(): LoomyEventEmitter {
  const g = globalThis as unknown as Record<string, LoomyEventEmitter>;
  if (!g[GLOBAL_KEY]) {
    g[GLOBAL_KEY] = new LoomyEventEmitter();
  }
  return g[GLOBAL_KEY];
}

/** Process-bred singleton (hot reload: genbruger globalThis). */
export const loomyEventEmitter = getSingleton();

/** Alias bagudkompatibilitet. */
export const loomyEvents = loomyEventEmitter;

export function logRelay(event: string, payload: unknown): void {
  const preview =
    typeof payload === "object" && payload !== null
      ? JSON.stringify(payload).slice(0, 280)
      : String(payload);
  console.info(
    `[NERVESYSTEM] emit ${event} → ${preview}${preview.length >= 280 ? "…" : ""}`
  );
}

export function emitLoomyEvent<K extends keyof LoomyEventPayloadMap>(
  event: K,
  payload: LoomyEventPayloadMap[K]
): void {
  logRelay(event as string, payload);
  loomyEventEmitter.emit(event as string, payload);
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
      console.error(`[NERVESYSTEM] listener error on ${String(event)}`, err);
    });
  };
  loomyEventEmitter.on(event as string, fn);
  return () => {
    loomyEventEmitter.off(event as string, fn);
  };
}
