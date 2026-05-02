const EARTH_KM = 6371;

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

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

/** Rough ETA in minutes (urban courier avg ~22 km/h). */
export function estimateEtaMinutes(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number },
  avgSpeedKmh: number = 22
): number {
  const km = distanceKm(from, to);
  const hours = km / Math.max(5, avgSpeedKmh);
  return Math.max(1, Math.round(hours * 60));
}
