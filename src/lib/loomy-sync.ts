import type { ApiOrderStatus, ApiSizeKey, CatalogStoreRow, OrderRowForUi } from "@/lib/loomy-api-types";
import type { OrderData, OrderStatus, Product, SizeKey, StoreData } from "@/types/lumi";

function mapSize(s: string): SizeKey {
  if (s === "XS" || s === "S" || s === "M" || s === "L") return s;
  return "M";
}

function mapStatus(s: ApiOrderStatus): OrderStatus {
  return s;
}

export function catalogRowsToStores(rows: CatalogStoreRow[]): StoreData[] {
  return rows.map((s) => ({
    id: s.id,
    name: s.name,
    neighborhood: s.neighborhood,
    address: s.address,
    etaMinutes: s.eta_minutes,
    rating: s.rating,
    products: s.products.map(
      (p): Product => ({
        id: p.id,
        name: p.name,
        category: p.category as Product["category"],
        description: p.description,
        imageUrl: p.image_url,
        price: Math.round(p.price_ore / 100),
        sizes: {
          XS: p.inventory_levels.find((l) => l.size === "XS")?.quantity ?? 0,
          S: p.inventory_levels.find((l) => l.size === "S")?.quantity ?? 0,
          M: p.inventory_levels.find((l) => l.size === "M")?.quantity ?? 0,
          L: p.inventory_levels.find((l) => l.size === "L")?.quantity ?? 0,
        },
      }),
    ),
  }));
}

export function orderRowsToOrderData(rows: OrderRowForUi[]): OrderData[] {
  return rows.map((o) => ({
    rowId: o.id,
    id: o.human_ref,
    storeId: o.store_id,
    storeName: o.store_name,
    storeAddress: o.store_address,
    productId: o.product_id,
    productName: o.product_name,
    size: mapSize(o.size),
    qty: o.qty,
    customerName: o.customer_name,
    customerAddress: o.customer_address,
    nearbyEtaMinutes: o.nearby_eta_minutes,
    status: mapStatus(o.status),
    courierId: o.courier_slug ?? undefined,
    createdAt: new Date(o.created_at).getTime(),
  }));
}

export type PlaceOrderApiBody = {
  store_id: string;
  product_id: string;
  size: ApiSizeKey;
  customer_name: string;
  customer_address: string;
};

export async function fetchCatalogFromApi(): Promise<StoreData[] | null> {
  const res = await fetch("/api/catalog", { cache: "no-store" });
  if (!res.ok) return null;
  const json = (await res.json()) as { stores?: CatalogStoreRow[] };
  if (!json.stores) return null;
  return catalogRowsToStores(json.stores);
}

export async function fetchOrdersFromApi(): Promise<OrderData[] | null> {
  const res = await fetch("/api/orders", { cache: "no-store" });
  if (!res.ok) return null;
  const json = (await res.json()) as { orders?: OrderRowForUi[] };
  if (!json.orders) return null;
  return orderRowsToOrderData(json.orders);
}

export async function placeOrderGuestApi(body: PlaceOrderApiBody): Promise<{
  rowId: string;
  humanRef: string;
  courierSlug: string | null;
  eta: number;
} | null> {
  const res = await fetch("/api/orders/place", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) return null;
  const json = (await res.json()) as {
    result?: { order_id: string; human_ref: string; courier_slug: string | null; nearby_eta_minutes: number };
  };
  if (!json.result) return null;
  return {
    rowId: json.result.order_id,
    humanRef: json.result.human_ref,
    courierSlug: json.result.courier_slug,
    eta: json.result.nearby_eta_minutes,
  };
}

export async function patchInventoryApi(
  accessToken: string,
  body: { product_id: string; size: SizeKey; quantity: number },
): Promise<boolean> {
  const res = await fetch("/api/inventory", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(body),
  });
  return res.ok;
}

export async function storeAdvanceOrderApi(
  accessToken: string,
  orderRowId: string,
): Promise<OrderStatus | null> {
  const res = await fetch(`/api/orders/${orderRowId}/store-advance`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) return null;
  const json = (await res.json()) as { result?: { status?: OrderStatus } };
  return json.result?.status ?? null;
}

export async function courierAdvanceOrderApi(
  accessToken: string,
  orderRowId: string,
): Promise<OrderStatus | null> {
  const res = await fetch(`/api/orders/${orderRowId}/courier-advance`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) return null;
  const json = (await res.json()) as { result?: { status?: OrderStatus } };
  return json.result?.status ?? null;
}
