import { getSocketIoServer } from "@/server/socket/ioBridge";
import type { OrderManagerRepository } from "@/server/orders/orderManagerRepository";
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
      const io = getSocketIoServer();
      if (io) {
        const payload = {
          courierId,
          lat,
          lng,
          ts: new Date().toISOString(),
        };
        for (const order of active) {
          io.to(`order:${order.id}`).emit("location_update", payload);
        }
      }
    }

    return { accepted: true, pushed: shouldPush };
  }
}
