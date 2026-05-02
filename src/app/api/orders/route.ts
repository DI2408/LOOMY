import { NextResponse } from "next/server";
import type { ApiOrderStatus, ApiSizeKey, OrderRowForUi } from "@/lib/loomy-api-types";
import { getSupabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabase/server-admin";

export const dynamic = "force-dynamic";

type OrderJoinRow = {
  id: string;
  human_ref: string;
  store_id: string;
  customer_name: string;
  customer_address: string;
  status: ApiOrderStatus;
  courier_slug: string | null;
  nearby_eta_minutes: number;
  created_at: string;
  stores: { name: string; address: string } | { name: string; address: string }[] | null;
  order_items: {
    product_id: string;
    product_name: string;
    size: ApiSizeKey;
    qty: number;
  }[];
};

function normalizeStoreEmbed(
  embed: OrderJoinRow["stores"],
): { name: string; address: string } | null {
  if (!embed) return null;
  return Array.isArray(embed) ? (embed[0] ?? null) : embed;
}

export async function GET() {
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({ error: "Supabase admin is not configured." }, { status: 503 });
  }

  try {
    const admin = getSupabaseAdmin();
    const { data, error } = await admin
      .from("orders")
      .select(
        `
        id,
        human_ref,
        store_id,
        customer_name,
        customer_address,
        status,
        courier_slug,
        nearby_eta_minutes,
        created_at,
        stores ( name, address ),
        order_items ( product_id, product_name, size, qty )
      `,
      )
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const orders: OrderRowForUi[] = (data ?? []).map((raw) => {
      const row = raw as unknown as OrderJoinRow;
      const firstItem = row.order_items?.[0];
      const store = normalizeStoreEmbed(row.stores);
      return {
        id: row.id,
        human_ref: row.human_ref,
        store_id: row.store_id,
        store_name: store?.name ?? "",
        store_address: store?.address ?? "",
        product_id: firstItem?.product_id ?? "",
        product_name: firstItem?.product_name ?? "",
        size: (firstItem?.size ?? "M") as ApiSizeKey,
        qty: firstItem?.qty ?? 1,
        customer_name: row.customer_name,
        customer_address: row.customer_address,
        nearby_eta_minutes: row.nearby_eta_minutes,
        status: row.status,
        courier_slug: row.courier_slug,
        created_at: row.created_at,
      };
    });

    return NextResponse.json({ orders });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
