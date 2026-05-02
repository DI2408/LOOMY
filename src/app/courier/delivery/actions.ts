"use server";

import { getDeliveryCompletionFlow } from "@/server/delivery/deliveryCompletionSingleton";
import type { DeliveryCompletionMode } from "@/server/delivery/deliveryCompletionTypes";
import { DeliveryCompletionError } from "@/server/delivery/deliveryCompletionTypes";

export type DeliveryActionState = {
  error?: string;
  ok?: boolean;
  canDeliver?: boolean;
  distanceMeters?: number | null;
  radiusMeters?: number;
};

export async function checkCanCompleteDelivery(
  _prev: DeliveryActionState,
  formData: FormData
): Promise<DeliveryActionState> {
  try {
    const secret = process.env.COURIER_DISPATCH_SECRET;
    if (!secret || String(formData.get("secret")) !== secret) {
      return { error: "Ugyldig adgang." };
    }
    const orderId = String(formData.get("orderId") ?? "").trim();
    const courierId = String(formData.get("courierId") ?? "").trim();
    const lat = Number(formData.get("courierLat"));
    const lng = Number(formData.get("courierLng"));
    const r = await getDeliveryCompletionFlow().canConfirmDelivery(
      orderId,
      courierId,
      lat,
      lng
    );
    return {
      canDeliver: r.allowed,
      distanceMeters: r.distanceMeters,
      radiusMeters: r.radiusMeters,
      error: r.reason === "outside_geofence" ? "For langt fra kunden." : undefined,
    };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Fejl" };
  }
}

export async function completeDelivery(
  _prev: DeliveryActionState,
  formData: FormData
): Promise<DeliveryActionState> {
  try {
    const secret = process.env.COURIER_DISPATCH_SECRET;
    if (!secret || String(formData.get("secret")) !== secret) {
      return { error: "Ugyldig adgang." };
    }
    const orderId = String(formData.get("orderId") ?? "").trim();
    const courierId = String(formData.get("courierId") ?? "").trim();
    const lat = Number(formData.get("courierLat"));
    const lng = Number(formData.get("courierLng"));
    const mode = String(formData.get("mode") ?? "").trim() as DeliveryCompletionMode;
    if (mode !== "handed_to_customer" && mode !== "left_at_door") {
      return { error: "Vælg leveringstype." };
    }
    await getDeliveryCompletionFlow().completeDelivery({
      orderId,
      courierId,
      courierLat: lat,
      courierLng: lng,
      mode,
      customerHandoffCode: String(formData.get("customerHandoffCode") ?? "").trim() || undefined,
      proofImageBase64: String(formData.get("proofImageBase64") ?? "").trim() || undefined,
    });
    return { ok: true };
  } catch (e) {
    if (e instanceof DeliveryCompletionError) {
      return { error: e.message };
    }
    return { error: e instanceof Error ? e.message : "Fejl" };
  }
}
