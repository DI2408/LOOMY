import { LoomyEvents, emitLoomyEvent } from "@/lib/events";
import type { OrderManagerRepository } from "@/server/orders/orderManagerRepository";
import type { StoreOrderDetailsJson } from "@/server/events/orderPaidEvents";
import { getETACalculator } from "./etaCalculator";
import {
  getCachedEtaPhrase,
  setCachedEtaPhrase,
  shouldRefreshEta,
} from "./etaRefreshPolicy";
import { readCustomerLocationFromOrderDetails } from "./orderDetailsCoords";
import { distanceKm } from "./locationEta";
import { setCourierLocationMemory, type CourierLocationPoint } from "./locationCache";

const SEND_INTERVAL_MS = 10_000;
/** Skip network push if bud hasn't moved this many meters since last push. */
const MIN_MOVE_METERS = 35;

type ThrottleState = {
  lastPushAt: number;
  lastPushLat: number;
  lastPushLng: number;
};

const throttleByCourier = new Map<string, ThrottleState>();

export type LocationTrackingServiceDeps = {
  orders: OrderManagerRepository;
};

/**
 * In-memory position cache + Socket.io `location_update` to order rooms.
 * Only accepts updates when the courier has at least one `out_for_delivery` order.
 * Throttles to ~10s and skips pushes when stationary (saves battery / server).
 */
export class LocationTrackingService {
  constructor(private readonly deps: LocationTrackingServiceDeps) {}

  /**
   * @returns whether a `location_update` was emitted (throttle may skip).
   */
  async updateCourierLocation(
    courierId: string,
    lat: number,
    lng: number
  ): Promise<{ accepted: boolean; pushed: boolean; reason?: string }> {
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return { accepted: false, pushed: false, reason: "invalid_coordinates" };
    }

    const active = await this.deps.orders.listOutForDeliveryByCourier(courierId);
    if (active.length === 0) {
      return {
        accepted: false,
        pushed: false,
        reason: "not_out_for_delivery",
      };
    }

    const now = Date.now();
    const point: CourierLocationPoint = { lat, lng, updatedAt: now };
    setCourierLocationMemory(courierId, point);

    const prev = throttleByCourier.get(courierId);
    let shouldPush: boolean;

    if (!prev) {
      shouldPush = true;
    } else {
      const elapsed = now - prev.lastPushAt;
      const movedM = distanceKm(
        { lat: prev.lastPushLat, lng: prev.lastPushLng },
        { lat, lng }
      ) * 1000;
      if (elapsed < SEND_INTERVAL_MS && movedM < MIN_MOVE_METERS) {
        shouldPush = false;
      } else {
        shouldPush = true;
      }
    }

    if (shouldPush) {
      throttleByCourier.set(courierId, {
        lastPushAt: now,
        lastPushLat: lat,
        lastPushLng: lng,
      });
      const ts = new Date().toISOString();
      const etaCalc = getETACalculator();
      for (const order of active) {
        const customer = readCustomerLocationFromOrderDetails(
          order.orderDetails as StoreOrderDetailsJson
        );
        let etaPhrase: string | undefined;
        if (customer && shouldRefreshEta(order.id, { lat, lng })) {
          etaPhrase = await etaCalc.getEtaPhrase({ lat, lng }, customer);
          setCachedEtaPhrase(order.id, etaPhrase);
        } else {
          etaPhrase = getCachedEtaPhrase(order.id);
        }
        emitLoomyEvent(LoomyEvents.COURIER_POSITION_UPDATE, {
          orderId: order.id,
          courierId,
          lat,
          lng,
          ts,
          etaPhrase,
        });
      }
    }

    return { accepted: true, pushed: shouldPush };
  }
}
