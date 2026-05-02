import type { StoreOrderDetailsJson } from "@/server/events/orderPaidEvents";
import type { CourierRow } from "./courierTypes";

const EARTH_KM = 6371;

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/** Haversine distance in km. */
export function distanceKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return 2 * EARTH_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

function readCoord(
  details: StoreOrderDetailsJson,
  latKey: string,
  lngKey: string
): { lat: number; lng: number } | null {
  const latRaw = details[latKey];
  const lngRaw = details[lngKey];
  const lat = typeof latRaw === "number" ? latRaw : Number(latRaw);
  const lng = typeof lngRaw === "number" ? lngRaw : Number(lngRaw);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
}

/**
 * Active couriers: `isAvailable` and optionally within `maxRadiusKm` of dropoff
 * when `order_details` contains `dropoffLat` / `dropoffLng` (or `customerLat` / `customerLng`).
 */
export function filterCouriersForOrder(
  couriers: readonly CourierRow[],
  orderDetails: StoreOrderDetailsJson,
  maxRadiusKm: number = 15
): CourierRow[] {
  const dropoff =
    readCoord(orderDetails, "dropoffLat", "dropoffLng") ??
    readCoord(orderDetails, "customerLat", "customerLng");

  return couriers.filter((c) => {
    if (!c.isAvailable) return false;
    if (!dropoff || c.lat == null || c.lng == null) {
      return true;
    }
    return distanceKm({ lat: c.lat, lng: c.lng }, dropoff) <= maxRadiusKm;
  });
}
