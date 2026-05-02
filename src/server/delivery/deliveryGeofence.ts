import { distanceKm } from "@/server/tracking/locationEta";

/** Default ~75 m (midpoint of 50–100 m). */
export const DEFAULT_DELIVERY_GEOFENCE_RADIUS_M = 75;

export function distanceMeters(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
): number {
  return distanceKm(a, b) * 1000;
}

export function isWithinDeliveryGeofence(
  courier: { lat: number; lng: number },
  customer: { lat: number; lng: number },
  radiusMeters: number = DEFAULT_DELIVERY_GEOFENCE_RADIUS_M
): boolean {
  return distanceMeters(courier, customer) <= radiusMeters;
}
