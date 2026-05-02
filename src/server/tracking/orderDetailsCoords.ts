import type { StoreOrderDetailsJson } from "@/server/events/orderPaidEvents";
import type { LatLng } from "./etaCalculator";

export function readCustomerLocationFromOrderDetails(
  details: StoreOrderDetailsJson
): LatLng | null {
  const latRaw =
    details.customerLat ?? details.dropoffLat ?? details.destinationLat;
  const lngRaw =
    details.customerLng ?? details.dropoffLng ?? details.destinationLng;
  const lat = typeof latRaw === "number" ? latRaw : Number(latRaw);
  const lng = typeof lngRaw === "number" ? lngRaw : Number(lngRaw);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
}
