import { distanceKm } from "./locationEta";
import type { LatLng } from "./etaCalculator";

const MINUTE_MS = 60_000;
/** Recompute ETA at most once per minute unless courier moved significantly. */
export const ETA_REFRESH_INTERVAL_MS = MINUTE_MS;
/** If courier moved at least this far (km), refresh ETA immediately. */
export const ETA_SIGNIFICANT_MOVE_KM = 0.25;

export type EtaThrottleState = {
  lastEtaAt: number;
  lastEtaCourierLat: number;
  lastEtaCourierLng: number;
};

const stateByOrderId = new Map<string, EtaThrottleState>();
const lastPhraseByOrderId = new Map<string, string>();

export function getCachedEtaPhrase(orderId: string): string | undefined {
  return lastPhraseByOrderId.get(orderId);
}

export function setCachedEtaPhrase(orderId: string, phrase: string): void {
  lastPhraseByOrderId.set(orderId, phrase);
}

export function shouldRefreshEta(
  orderId: string,
  courierNow: LatLng
): boolean {
  const prev = stateByOrderId.get(orderId);
  const now = Date.now();

  if (!prev) {
    stateByOrderId.set(orderId, {
      lastEtaAt: now,
      lastEtaCourierLat: courierNow.lat,
      lastEtaCourierLng: courierNow.lng,
    });
    return true;
  }

  const elapsed = now - prev.lastEtaAt;
  const movedKm = distanceKm(
    { lat: prev.lastEtaCourierLat, lng: prev.lastEtaCourierLng },
    courierNow
  );

  if (elapsed >= ETA_REFRESH_INTERVAL_MS || movedKm >= ETA_SIGNIFICANT_MOVE_KM) {
    stateByOrderId.set(orderId, {
      lastEtaAt: now,
      lastEtaCourierLat: courierNow.lat,
      lastEtaCourierLng: courierNow.lng,
    });
    return true;
  }

  return false;
}

export function resetEtaThrottle(orderId: string): void {
  stateByOrderId.delete(orderId);
  lastPhraseByOrderId.delete(orderId);
}
