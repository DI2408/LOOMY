export type SizeKey = "XS" | "S" | "M" | "L";
export type OrderStatus =
  | "order_placed"
  | "store_packing"
  | "courier_pickup"
  | "on_the_way"
  | "delivered";

export type Product = {
  id: string;
  name: string;
  category: "New In" | "Emergency Outfits" | "Shoes" | "Accessories";
  description: string;
  imageUrl: string;
  price: number;
  sizes: Record<SizeKey, number>;
};

export type StoreData = {
  id: string;
  name: string;
  neighborhood: string;
  address: string;
  etaMinutes: number;
  rating: number;
  products: Product[];
};

export type CourierData = {
  id: string;
  name: string;
  zone: string;
  etaMinutes: number;
  status: "available" | "on_delivery";
};

export type OrderData = {
  /** Supabase `orders.id` when hydrated from the database */
  rowId?: string;
  id: string;
  storeId: string;
  storeName: string;
  storeAddress: string;
  productId: string;
  productName: string;
  size: SizeKey;
  qty: number;
  customerName: string;
  customerAddress: string;
  nearbyEtaMinutes: number;
  status: OrderStatus;
  courierId?: string;
  createdAt: number;
};

export type PartnerRole = "store" | "courier";

export type PartnerProfile = {
  role: PartnerRole;
  storeId?: string;
  courierId?: string;
  email: string;
};
