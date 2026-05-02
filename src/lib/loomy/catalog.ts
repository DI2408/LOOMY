import type { SupabaseClient } from "@supabase/supabase-js";
import type { CourierData, Product, SizeKey, StoreData } from "@/components/providers/lumi-provider";

type StoreRow = {
  id: string;
  name: string;
  neighborhood: string;
  address: string;
  eta_minutes: number;
  rating: number;
};

type ProductRow = {
  id: string;
  store_id: string;
  name: string;
  category: Product["category"];
  description: string;
  image_url: string;
  price_minor: number;
};

type InvRow = {
  product_id: string;
  size: SizeKey;
  qty: number;
};

type CourierRow = {
  id: string;
  display_name: string;
  zone: string;
  eta_minutes: number;
  status: CourierData["status"];
};

export async function fetchCatalogFromSupabase(
  supabase: SupabaseClient,
): Promise<{ stores: StoreData[]; couriers: CourierData[] }> {
  const [{ data: storeRows, error: storeErr }, { data: productRows, error: prodErr }, { data: invRows, error: invErr }, { data: courierRows, error: courErr }] =
    await Promise.all([
      supabase
        .from("stores")
        .select("id,name,neighborhood,address,eta_minutes,rating")
        .eq("is_active", true),
      supabase
        .from("products")
        .select("id,store_id,name,category,description,image_url,price_minor")
        .eq("is_active", true),
      supabase.from("product_inventory").select("product_id,size,qty"),
      supabase.from("couriers").select("id,display_name,zone,eta_minutes,status"),
    ]);

  if (storeErr) throw new Error(storeErr.message);
  if (prodErr) throw new Error(prodErr.message);
  if (invErr) throw new Error(invErr.message);
  if (courErr) throw new Error(courErr.message);

  const invByProduct = new Map<string, Record<SizeKey, number>>();
  for (const row of (invRows ?? []) as InvRow[]) {
    const cur = invByProduct.get(row.product_id) ?? { XS: 0, S: 0, M: 0, L: 0 };
    cur[row.size] = row.qty;
    invByProduct.set(row.product_id, cur);
  }

  const productsByStore = new Map<string, Product[]>();
  for (const p of (productRows ?? []) as ProductRow[]) {
    const sizes = invByProduct.get(p.id) ?? { XS: 0, S: 0, M: 0, L: 0 };
    const product: Product = {
      id: p.id,
      name: p.name,
      category: p.category,
      description: p.description,
      imageUrl: p.image_url,
      price: Math.round(p.price_minor / 100),
      sizes,
    };
    const list = productsByStore.get(p.store_id) ?? [];
    list.push(product);
    productsByStore.set(p.store_id, list);
  }

  const stores: StoreData[] = (storeRows ?? []).map((s: StoreRow) => ({
    id: s.id,
    name: s.name,
    neighborhood: s.neighborhood,
    address: s.address,
    etaMinutes: s.eta_minutes,
    rating: Number(s.rating),
    products: productsByStore.get(s.id) ?? [],
  }));

  const couriers: CourierData[] = ((courierRows ?? []) as CourierRow[]).map((c) => ({
    id: c.id,
    name: c.display_name,
    zone: c.zone,
    etaMinutes: c.eta_minutes,
    status: c.status,
  }));

  return { stores, couriers };
}
