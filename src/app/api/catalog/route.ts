import { NextResponse } from "next/server";
import type { CatalogProductRow, CatalogStoreRow } from "@/lib/loomy-api-types";
import { getSupabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabase/server-admin";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({ error: "Supabase admin is not configured." }, { status: 503 });
  }

  try {
    const admin = getSupabaseAdmin();
    const { data: stores, error: storesError } = await admin
      .from("stores")
      .select("id, name, neighborhood, address, eta_minutes, rating")
      .order("id");

    if (storesError) {
      return NextResponse.json({ error: storesError.message }, { status: 500 });
    }

    const { data: products, error: productsError } = await admin
      .from("products")
      .select(
        "id, store_id, name, category, description, image_url, price_ore, inventory_levels ( size, quantity )",
      )
      .order("id");

    if (productsError) {
      return NextResponse.json({ error: productsError.message }, { status: 500 });
    }

    const byStore = new Map<string, CatalogStoreRow>();

    for (const s of stores ?? []) {
      byStore.set(s.id, {
        id: s.id,
        name: s.name,
        neighborhood: s.neighborhood,
        address: s.address,
        eta_minutes: s.eta_minutes,
        rating: Number(s.rating),
        products: [],
      });
    }

    for (const p of products ?? []) {
      const row = p as CatalogProductRow;
      const store = byStore.get(row.store_id);
      if (!store) continue;
      store.products.push({
        ...row,
        inventory_levels: row.inventory_levels ?? [],
      });
    }

    return NextResponse.json({ stores: [...byStore.values()] });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
