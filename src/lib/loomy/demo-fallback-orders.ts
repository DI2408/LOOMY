/** Demo order list when Supabase is not used (offline / missing env). */
type SizeKey = "XS" | "S" | "M" | "L";
type OrderStatus =
  | "order_placed"
  | "store_packing"
  | "courier_pickup"
  | "on_the_way"
  | "delivered";

export type DemoOrderRow = {
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

export const demoFallbackOrders: DemoOrderRow[] = [
  {
    id: "LMI-1201",
    storeId: "strom-boutique",
    storeName: "Strøm Boutique",
    storeAddress: "Kronprinsensgade 22, 1114 København K",
    productId: "strom-silk-shirt",
    productName: "Silk Shirt",
    size: "M",
    qty: 1,
    customerName: "Emma Larsen",
    customerAddress: "Store Kongensgade 45, 2. tv, 1264 København K",
    nearbyEtaMinutes: 24,
    courierId: "mikkel",
    status: "order_placed",
    createdAt: 1714064400000,
  },
  {
    id: "LMI-1202",
    storeId: "storm-cph",
    storeName: "STORM Copenhagen",
    storeAddress: "Store Regnegade 1, 1110 København K",
    productId: "storm-merino-knit",
    productName: "Merino Knit",
    size: "S",
    qty: 1,
    customerName: "Noah Petersen",
    customerAddress: "Larsbjornsstraede 9, 1. th, 1454 København K",
    nearbyEtaMinutes: 18,
    courierId: "mikkel",
    status: "store_packing",
    createdAt: 1714060800000,
  },
  {
    id: "LMI-1203",
    storeId: "naked-copenhagen-edit",
    storeName: "Naked Copenhagen Edit",
    storeAddress: "Pilestræde 46, 1112 København K",
    productId: "naked-runner",
    productName: "City Runner Sneaker",
    size: "M",
    qty: 1,
    customerName: "Sofie Madsen",
    customerAddress: "Nørre Voldgade 12, 3. sal, 1358 København K",
    nearbyEtaMinutes: 16,
    courierId: "mikkel",
    status: "courier_pickup",
    createdAt: 1714059000000,
  },
  {
    id: "LMI-1204",
    storeId: "wood-wood-city",
    storeName: "WOOD WOOD City",
    storeAddress: "Grønnegade 1, 1107 København K",
    productId: "ww-crossbody",
    productName: "Crossbody Bag",
    size: "L",
    qty: 1,
    customerName: "Maja Andersen",
    customerAddress: "Kronprinsessegade 30, 2. tv, 1306 København K",
    nearbyEtaMinutes: 14,
    courierId: "sara",
    status: "on_the_way",
    createdAt: 1714057200000,
  },
  {
    id: "LMI-1205",
    storeId: "birger-et-mikkelsen-house",
    storeName: "Birger et Mikkelsen House",
    storeAddress: "Amagertorv 33, 1160 København K",
    productId: "bemk-wrap-dress",
    productName: "Wrap Dress",
    size: "S",
    qty: 1,
    customerName: "Freja Nielsen",
    customerAddress: "Borgergade 18, 2. tv, 1300 København K",
    nearbyEtaMinutes: 22,
    courierId: "jonas",
    status: "delivered",
    createdAt: 1714051800000,
  },
];
