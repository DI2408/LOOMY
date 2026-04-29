import type { SupabaseClient } from "@supabase/supabase-js";
import type { OrderData, OrderStatus, SizeKey } from "@/components/providers/lumi-provider";

type OrderRow = {
  id: string;
  customer_user_id: string;
  store_id: string;
  courier_id: string | null;
  status: OrderStatus | string;
  delivery_address: string;
  eta_minutes: number;
  created_at: string;
  customer_display_name: string | null;
  /** Supabase may return object or single-element array for FK embeds. */
  stores?: { name: string; address: string } | { name: string; address: string }[] | null;
  order_items?: Array<{
    product_id: string;
    product_name: string;
    size: string;
    qty: number;
  }> | null;
};

function firstItem(row: OrderRow) {
  const items = row.order_items;
  if (items && items.length > 0) return items[0];
  return {
    product_id: "",
    product_name: "Ordre",
    size: "M",
    qty: 1,
  };
}

export function mapOrderRowToOrderData(row: OrderRow): OrderData {
  const item = firstItem(row);
  const storeRel = row.stores;
  const store = Array.isArray(storeRel) ? storeRel[0] : storeRel ?? null;
  return {
    id: row.id,
    storeId: row.store_id,
    storeName: store?.name ?? row.store_id,
    storeAddress: store?.address ?? "",
    productId: item.product_id,
    productName: item.product_name,
    size: item.size as SizeKey,
    qty: item.qty,
    customerName: row.customer_display_name ?? "Kunde",
    customerAddress: row.delivery_address,
    nearbyEtaMinutes: row.eta_minutes,
    courierId: row.courier_id ?? undefined,
    status: row.status as OrderStatus,
    createdAt: new Date(row.created_at).getTime(),
  };
}

export async function fetchOrdersForContext(
  supabase: SupabaseClient,
  ctx: { role: "customer" | "store" | "courier"; userId: string; storeId?: string; courierId?: string },
): Promise<OrderData[]> {
  let q = supabase
    .from("orders")
    .select(
      `
      id,
      customer_user_id,
      store_id,
      courier_id,
      status,
      delivery_address,
      eta_minutes,
      created_at,
      customer_display_name,
      stores ( name, address ),
      order_items ( product_id, product_name, size, qty )
    `,
    )
    .order("created_at", { ascending: false });

  if (ctx.role === "customer") {
    q = q.eq("customer_user_id", ctx.userId);
  } else if (ctx.role === "store" && ctx.storeId) {
    q = q.eq("store_id", ctx.storeId);
  } else if (ctx.role === "courier" && ctx.courierId) {
    q = q.eq("courier_id", ctx.courierId);
  } else {
    return [];
  }

  const { data, error } = await q;
  if (error) throw new Error(error.message);
  const rows = (data ?? []) as unknown as OrderRow[];
  return rows.map(mapOrderRowToOrderData);
}
