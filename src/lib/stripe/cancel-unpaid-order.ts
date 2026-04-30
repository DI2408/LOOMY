import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Restores inventory and marks order + payment cancelled when checkout never completes or fails.
 * Uses service role client (bypasses RLS).
 */
export async function cancelUnpaidOrderById(
  admin: SupabaseClient,
  orderId: string,
): Promise<{ ok: boolean; error?: string }> {
  const { data: order, error: orderErr } = await admin
    .from("orders")
    .select("id, status, courier_id")
    .eq("id", orderId)
    .maybeSingle();
  if (orderErr) return { ok: false, error: orderErr.message };
  if (!order) return { ok: false, error: "Order not found." };

  const ord = order as { id: string; status: string; courier_id: string | null };

  const { data: payment } = await admin
    .from("payments")
    .select("status")
    .eq("order_id", orderId)
    .maybeSingle();
  const payStatus = (payment as { status?: string } | null)?.status;
  if (payStatus === "succeeded") {
    return { ok: true };
  }

  if (ord.status === "order_placed" && ord.courier_id) {
    await admin
      .from("couriers")
      .update({ status: "available", updated_at: new Date().toISOString() })
      .eq("id", ord.courier_id);
  }

  const { data: items, error: itemsErr } = await admin
    .from("order_items")
    .select("product_id, size, qty")
    .eq("order_id", orderId);
  if (itemsErr) return { ok: false, error: itemsErr.message };

  for (const row of items ?? []) {
    const r = row as { product_id: string; size: string; qty: number };
    const { data: inv } = await admin
      .from("product_inventory")
      .select("qty")
      .eq("product_id", r.product_id)
      .eq("size", r.size)
      .maybeSingle();
    const current = (inv as { qty?: number } | null)?.qty ?? 0;
    await admin
      .from("product_inventory")
      .update({ qty: current + r.qty, updated_at: new Date().toISOString() })
      .eq("product_id", r.product_id)
      .eq("size", r.size);
  }

  await admin.from("payments").update({ status: "cancelled", updated_at: new Date().toISOString() }).eq("order_id", orderId);

  await admin
    .from("orders")
    .update({ status: "cancelled", updated_at: new Date().toISOString() })
    .eq("id", orderId);

  return { ok: true };
}
