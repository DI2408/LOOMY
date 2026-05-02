/**
 * LOOMY service facade — GPS + ETA (server-only).
 */

import { getLocationTrackingService } from "@/server/tracking/trackingSingleton";
import { getETACalculator } from "@/server/tracking/etaCalculator";
import type { LatLng } from "@/server/tracking/etaCalculator";

export async function updateCourierLocation(
  courierId: string,
  lat: number,
  lng: number
) {
  return getLocationTrackingService().updateCourierLocation(courierId, lat, lng);
}

export async function getEtaPhrase(courier: LatLng, customer: LatLng) {
  return getETACalculator().getEtaPhrase(courier, customer);
}

export async function getEtaTotalMinutes(courier: LatLng, customer: LatLng) {
  return getETACalculator().getTotalMinutes(courier, customer);
}
