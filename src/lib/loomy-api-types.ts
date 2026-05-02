export type ApiSizeKey = "XS" | "S" | "M" | "L";

export type ApiOrderStatus =
  | "order_placed"
  | "store_packing"
  | "courier_pickup"
  | "on_the_way"
  | "delivered";

export type CatalogProductRow = {
  id: string;
  store_id: string;
  name: string;
  category: string;
  description: string;
  image_url: string;
  price_ore: number;
  inventory_levels: { size: string; quantity: number }[];
};

export type CatalogStoreRow = {
  id: string;
  name: string;
  neighborhood: string;
  address: string;
  eta_minutes: number;
  rating: number;
  products: CatalogProductRow[];
};

export type PlaceOrderGuestResult = {
  order_id: string;
  human_ref: string;
  courier_slug: string | null;
  nearby_eta_minutes: number;
  unit_price_ore: number;
};

export type OrderRowForUi = {
  id: string;
  human_ref: string;
  store_id: string;
  store_name: string;
  store_address: string;
  product_id: string;
  product_name: string;
  size: ApiSizeKey;
  qty: number;
  customer_name: string;
  customer_address: string;
  nearby_eta_minutes: number;
  status: ApiOrderStatus;
  courier_slug: string | null;
  created_at: string;
};
