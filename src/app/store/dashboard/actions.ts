"use server";

import { getOrderManager } from "@/server/courier/courierDispatchSingleton";
import { createServiceSupabase } from "@/lib/supabase/service";
import { createSupabaseOrderManagerRepository } from "@/server/orders/orderManagerRepository";

export type StoreDashboardActionState = {
  error?: string;
  ok?: boolean;
};

async function assertStoreOwnsOrder(
  storeId: string,
  orderId: string
): Promise<void> {
  const repo = createSupabaseOrderManagerRepository(createServiceSupabase());
  const row = await repo.getById(orderId);
  if (!row) throw new Error("Ordren findes ikke.");
  if (row.storeId !== storeId) throw new Error("Butik matcher ikke ordren.");
}

export async function markOrderReadyForPickup(
  _prev: StoreDashboardActionState,
  formData: FormData
): Promise<StoreDashboardActionState> {
  try {
    const secret = process.env.STORE_DASHBOARD_SECRET;
    const submitted = String(formData.get("secret") ?? "");
    if (!secret || submitted !== secret) {
      return { error: "Ugyldig adgang." };
    }
    const storeId = String(formData.get("storeId") ?? "").trim();
    const orderId = String(formData.get("orderId") ?? "").trim();
    if (!storeId || !orderId) {
      return { error: "Manglende butik eller ordre." };
    }
    await assertStoreOwnsOrder(storeId, orderId);
    await getOrderManager().transitionToReady(orderId);
    return { ok: true };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Fejl";
    return { error: message };
  }
}
