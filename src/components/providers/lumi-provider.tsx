"use client";

import {
  createContext,
  useEffect,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { getSupabaseClient } from "@/lib/supabase/client";
import { fetchPartnerProfileByEmail } from "@/lib/partner-profiles";
import {
  courierAdvanceOrderApi,
  fetchCatalogFromApi,
  fetchOrdersFromApi,
  patchInventoryApi,
  placeOrderGuestApi,
  storeAdvanceOrderApi,
} from "@/lib/loomy-sync";
import type { CourierData, OrderData, PartnerProfile, SizeKey, StoreData } from "@/types/lumi";

export type {
  CourierData,
  OrderData,
  OrderStatus,
  PartnerProfile,
  PartnerRole,
  Product,
  SizeKey,
  StoreData,
} from "@/types/lumi";

type LumiContextValue = {
  stores: StoreData[];
  couriers: CourierData[];
  orders: OrderData[];
  role: "customer" | "store" | "courier";
  loginAs: (role: "customer" | "store" | "courier") => void;
  loginAsPartner: (profile: PartnerProfile) => void;
  logout: () => void;
  partnerProfile: PartnerProfile | null;
  placeOrder: (params: { storeId: string; productId: string; size: SizeKey }) => void | Promise<void>;
  updateStock: (params: {
    storeId: string;
    productId: string;
    size: SizeKey;
    quantity: number;
  }) => void | Promise<void>;
  progressOrderByStore: (orderId: string) => void | Promise<void>;
  progressOrderByCourier: (orderId: string) => void | Promise<void>;
};

const initialStores: StoreData[] = [
  {
    id: "strom-boutique",
    name: "Strøm Boutique",
    neighborhood: "Indre By",
    address: "Kronprinsensgade 22, 1114 København K",
    etaMinutes: 28,
    rating: 4.9,
    products: [
      {
        id: "strom-silk-shirt",
        name: "Silk Shirt",
        category: "New In",
        description: "Premium silk shirt for office and dinner.",
        imageUrl: "/products/new-in.svg",
        price: 899,
        sizes: { XS: 2, S: 4, M: 3, L: 2 },
      },
      {
        id: "strom-midnight-blazer",
        name: "Midnight Blazer",
        category: "Emergency Outfits",
        description: "Tailored blazer for last-minute events.",
        imageUrl: "/products/emergency.svg",
        price: 1499,
        sizes: { XS: 1, S: 2, M: 3, L: 2 },
      },
      {
        id: "strom-oxford-loafer",
        name: "Oxford Loafer",
        category: "Shoes",
        description: "Classic loafers with all-day comfort.",
        imageUrl: "/products/shoes.svg",
        price: 1299,
        sizes: { XS: 1, S: 2, M: 2, L: 1 },
      },
      {
        id: "strom-gold-chain",
        name: "Gold Chain",
        category: "Accessories",
        description: "Minimal gold-plated statement chain.",
        imageUrl: "/products/accessories.svg",
        price: 699,
        sizes: { XS: 3, S: 3, M: 3, L: 3 },
      },
    ],
  },
  {
    id: "naked-copenhagen-edit",
    name: "Naked Copenhagen Edit",
    neighborhood: "Indre By",
    address: "Pilestræde 46, 1112 København K",
    etaMinutes: 32,
    rating: 4.8,
    products: [
      {
        id: "naked-bomber-jacket",
        name: "Oversized Bomber",
        category: "New In",
        description: "Streetwear bomber with premium finish.",
        imageUrl: "/products/new-in.svg",
        price: 1199,
        sizes: { XS: 1, S: 2, M: 2, L: 1 },
      },
      {
        id: "naked-utility-set",
        name: "Utility Set",
        category: "Emergency Outfits",
        description: "Complete matching set ready to wear.",
        imageUrl: "/products/emergency.svg",
        price: 999,
        sizes: { XS: 2, S: 3, M: 2, L: 1 },
      },
      {
        id: "naked-runner",
        name: "City Runner Sneaker",
        category: "Shoes",
        description: "Urban running sneaker in neutral tones.",
        imageUrl: "/products/shoes.svg",
        price: 1099,
        sizes: { XS: 1, S: 2, M: 2, L: 2 },
      },
      {
        id: "naked-cap",
        name: "Signature Cap",
        category: "Accessories",
        description: "Low-profile cap with subtle branding.",
        imageUrl: "/products/accessories.svg",
        price: 399,
        sizes: { XS: 4, S: 4, M: 4, L: 4 },
      },
    ],
  },
  {
    id: "birger-et-mikkelsen-house",
    name: "Birger et Mikkelsen House",
    neighborhood: "Indre By",
    address: "Amagertorv 33, 1160 København K",
    etaMinutes: 35,
    rating: 4.7,
    products: [
      {
        id: "bemk-wrap-dress",
        name: "Wrap Dress",
        category: "New In",
        description: "Elegant wrap dress in soft satin.",
        imageUrl: "/products/new-in.svg",
        price: 1599,
        sizes: { XS: 1, S: 2, M: 2, L: 1 },
      },
      {
        id: "bemk-event-trouser",
        name: "Event Trouser",
        category: "Emergency Outfits",
        description: "Tailored trouser for evening and business.",
        imageUrl: "/products/emergency.svg",
        price: 1099,
        sizes: { XS: 2, S: 2, M: 3, L: 2 },
      },
      {
        id: "bemk-heel",
        name: "Leather Heel",
        category: "Shoes",
        description: "Soft leather heel with stable fit.",
        imageUrl: "/products/shoes.svg",
        price: 1399,
        sizes: { XS: 1, S: 1, M: 2, L: 1 },
      },
      {
        id: "bemk-clutch",
        name: "Evening Clutch",
        category: "Accessories",
        description: "Compact clutch for occasion wear.",
        imageUrl: "/products/accessories.svg",
        price: 799,
        sizes: { XS: 2, S: 2, M: 2, L: 2 },
      },
    ],
  },
  {
    id: "wood-wood-city",
    name: "WOOD WOOD City",
    neighborhood: "Indre By",
    address: "Grønnegade 1, 1107 København K",
    etaMinutes: 30,
    rating: 4.8,
    products: [
      {
        id: "ww-city-hoodie",
        name: "City Hoodie",
        category: "New In",
        description: "Relaxed premium hoodie for city wear.",
        imageUrl: "/products/new-in.svg",
        price: 899,
        sizes: { XS: 3, S: 4, M: 4, L: 3 },
      },
      {
        id: "ww-date-night-fit",
        name: "Date Night Fit",
        category: "Emergency Outfits",
        description: "Complete outfit ready for tonight.",
        imageUrl: "/products/emergency.svg",
        price: 1399,
        sizes: { XS: 1, S: 2, M: 2, L: 2 },
      },
      {
        id: "ww-street-runner",
        name: "Street Runner",
        category: "Shoes",
        description: "Hybrid sneaker with lightweight sole.",
        imageUrl: "/products/shoes.svg",
        price: 1199,
        sizes: { XS: 2, S: 2, M: 3, L: 2 },
      },
      {
        id: "ww-crossbody",
        name: "Crossbody Bag",
        category: "Accessories",
        description: "Compact crossbody for essentials.",
        imageUrl: "/products/accessories.svg",
        price: 649,
        sizes: { XS: 3, S: 3, M: 3, L: 3 },
      },
    ],
  },
  {
    id: "storm-cph",
    name: "STORM Copenhagen",
    neighborhood: "Indre By",
    address: "Store Regnegade 1, 1110 København K",
    etaMinutes: 26,
    rating: 4.9,
    products: [
      {
        id: "storm-merino-knit",
        name: "Merino Knit",
        category: "New In",
        description: "Fine merino knit in modern silhouette.",
        imageUrl: "/products/new-in.svg",
        price: 999,
        sizes: { XS: 2, S: 3, M: 3, L: 2 },
      },
      {
        id: "storm-black-set",
        name: "Black Tailored Set",
        category: "Emergency Outfits",
        description: "Polished set for same-day events.",
        imageUrl: "/products/emergency.svg",
        price: 1699,
        sizes: { XS: 1, S: 2, M: 2, L: 1 },
      },
      {
        id: "storm-derby",
        name: "Leather Derby",
        category: "Shoes",
        description: "Hand-finished derby with sleek profile.",
        imageUrl: "/products/shoes.svg",
        price: 1499,
        sizes: { XS: 1, S: 2, M: 2, L: 1 },
      },
      {
        id: "storm-scarf",
        name: "Cashmere Scarf",
        category: "Accessories",
        description: "Soft cashmere scarf in neutral tones.",
        imageUrl: "/products/accessories.svg",
        price: 549,
        sizes: { XS: 5, S: 5, M: 5, L: 5 },
      },
    ],
  },
];

const initialCouriers: CourierData[] = [
  { id: "mikkel", name: "Mikkel (Bike)", zone: "Inner City", etaMinutes: 12, status: "available" },
  { id: "sara", name: "Sara (Car)", zone: "Norrebro", etaMinutes: 18, status: "on_delivery" },
  { id: "jonas", name: "Jonas (Bike)", zone: "Vesterbro", etaMinutes: 15, status: "available" },
];

const customerProfiles = [
  {
    name: "Emma Larsen",
    address: "Store Kongensgade 45, 2. tv, 1264 København K",
  },
  {
    name: "Noah Petersen",
    address: "Larsbjornsstraede 9, 1. th, 1454 København K",
  },
  {
    name: "Sofie Madsen",
    address: "Nørre Voldgade 12, 3. sal, 1358 København K",
  },
  {
    name: "Maja Andersen",
    address: "Kronprinsessegade 30, 2. tv, 1306 København K",
  },
];

const initialOrders: OrderData[] = [
  {
    rowId: "a1000001-0001-4001-8001-000000000001",
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
    rowId: "a1000001-0001-4001-8001-000000000002",
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
    rowId: "a1000001-0001-4001-8001-000000000003",
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
    rowId: "a1000001-0001-4001-8001-000000000004",
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
    rowId: "a1000001-0001-4001-8001-000000000005",
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

const LumiContext = createContext<LumiContextValue | undefined>(undefined);

function courierAvailabilityFromOrders(orderList: OrderData[]): CourierData[] {
  const busy = new Set<string>();
  for (const o of orderList) {
    if (
      (o.status === "courier_pickup" || o.status === "on_the_way") &&
      o.courierId
    ) {
      busy.add(o.courierId);
    }
  }
  return initialCouriers.map((c) => ({
    ...c,
    status: busy.has(c.id) ? "on_delivery" : "available",
  }));
}

export function LumiProvider({ children }: { children: ReactNode }) {
  const [stores, setStores] = useState<StoreData[]>(initialStores);
  const [couriers, setCouriers] = useState<CourierData[]>(initialCouriers);
  const [orders, setOrders] = useState<OrderData[]>(initialOrders);
  const [role, setRole] = useState<"customer" | "store" | "courier">("customer");
  const [partnerProfile, setPartnerProfile] = useState<PartnerProfile | null>(null);
  const [useBackend, setUseBackend] = useState(false);

  useEffect(() => {
    let mounted = true;
    void (async () => {
      const [catalog, remoteOrders] = await Promise.all([
        fetchCatalogFromApi(),
        fetchOrdersFromApi(),
      ]);
      if (!mounted) return;
      if (catalog && remoteOrders) {
        setStores(catalog);
        setOrders(remoteOrders);
        setCouriers(courierAvailabilityFromOrders(remoteOrders));
        setUseBackend(true);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    try {
      const supabase = getSupabaseClient();
      supabase.auth.getUser().then(({ data }) => {
        if (!mounted) return;
        const email = data.user?.email;
        if (!email) return;
        fetchPartnerProfileByEmail(email)
          .then((profile) => {
            if (!mounted) return;
            if (profile) {
              setPartnerProfile(profile);
              setRole(profile.role);
            } else {
              setRole("customer");
              setPartnerProfile(null);
            }
          })
          .catch(() => {
            if (!mounted) return;
            setRole("customer");
            setPartnerProfile(null);
          });
      });
    } catch {
      // Supabase env vars are optional in local dev until configured.
    }
    return () => {
      mounted = false;
    };
  }, []);

  const loginAs = useCallback((nextRole: "customer" | "store" | "courier") => {
    setRole(nextRole);
    if (nextRole === "customer") {
      setPartnerProfile(null);
    }
  }, []);

  const loginAsPartner = useCallback((profile: PartnerProfile) => {
    setPartnerProfile(profile);
    setRole(profile.role);
  }, []);

  const logout = useCallback(() => {
    setRole("customer");
    setPartnerProfile(null);
    try {
      const supabase = getSupabaseClient();
      void supabase.auth.signOut();
    } catch {
      // Ignore when Supabase is not configured.
    }
  }, []);

  const placeOrder = useCallback(
    async ({
      storeId,
      productId,
      size,
    }: {
      storeId: string;
      productId: string;
      size: SizeKey;
    }) => {
      if (useBackend) {
        const customer =
          customerProfiles[Math.floor(Math.random() * customerProfiles.length)];
        const placed = await placeOrderGuestApi({
          store_id: storeId,
          product_id: productId,
          size,
          customer_name: customer.name,
          customer_address: customer.address,
        });
        if (!placed) return;
        const [nextCatalog, nextOrders] = await Promise.all([
          fetchCatalogFromApi(),
          fetchOrdersFromApi(),
        ]);
        if (nextCatalog) setStores(nextCatalog);
        if (nextOrders) {
          setOrders(nextOrders);
          setCouriers(courierAvailabilityFromOrders(nextOrders));
        }
        return;
      }

      let canPlace = false;
      let selectedStoreName = "";
      let selectedStoreAddress = "";
      let selectedProductName = "";
      setStores((prev) =>
        prev.map((store) => {
          if (store.id !== storeId) return store;
          selectedStoreName = store.name;
          selectedStoreAddress = store.address;
          return {
            ...store,
            products: store.products.map((product) => {
              if (product.id !== productId) return product;
              if (product.sizes[size] <= 0) return product;
              canPlace = true;
              selectedProductName = product.name;
              return {
                ...product,
                sizes: { ...product.sizes, [size]: product.sizes[size] - 1 },
              };
            }),
          };
        }),
      );

      if (!canPlace) return;

      const availableCourier = couriers.find((courier) => courier.status === "available");
      const orderId = `LMI-${Math.floor(Math.random() * 9000) + 1000}`;
      const customer =
        customerProfiles[Math.floor(Math.random() * customerProfiles.length)];
      const eta = 18 + Math.floor(Math.random() * 20);
      setOrders((prev) => [
        {
          id: orderId,
          storeId,
          storeName: selectedStoreName,
          storeAddress: selectedStoreAddress,
          productId,
          productName: selectedProductName,
          size,
          qty: 1,
          customerName: customer.name,
          customerAddress: customer.address,
          nearbyEtaMinutes: eta,
          courierId: availableCourier?.id,
          status: "order_placed",
          createdAt: Date.now(),
        },
        ...prev,
      ]);
    },
    [couriers, useBackend],
  );

  const updateStock = useCallback(
    async ({
      storeId,
      productId,
      size,
      quantity,
    }: {
      storeId: string;
      productId: string;
      size: SizeKey;
      quantity: number;
    }) => {
      if (useBackend) {
        try {
          const supabase = getSupabaseClient();
          const { data } = await supabase.auth.getSession();
          const token = data.session?.access_token;
          if (!token) {
            setStores((prev) =>
              prev.map((store) =>
                store.id === storeId
                  ? {
                      ...store,
                      products: store.products.map((product) =>
                        product.id === productId
                          ? {
                              ...product,
                              sizes: { ...product.sizes, [size]: Math.max(0, quantity) },
                            }
                          : product,
                      ),
                    }
                  : store,
              ),
            );
            return;
          }
          const ok = await patchInventoryApi(token, {
            product_id: productId,
            size,
            quantity,
          });
          if (ok) {
            const next = await fetchCatalogFromApi();
            if (next) setStores(next);
          }
        } catch {
          setStores((prev) =>
            prev.map((store) =>
              store.id === storeId
                ? {
                    ...store,
                    products: store.products.map((product) =>
                      product.id === productId
                        ? {
                            ...product,
                            sizes: { ...product.sizes, [size]: Math.max(0, quantity) },
                          }
                        : product,
                    ),
                  }
                : store,
            ),
          );
        }
        return;
      }

      setStores((prev) =>
        prev.map((store) =>
          store.id === storeId
            ? {
                ...store,
                products: store.products.map((product) =>
                  product.id === productId
                    ? {
                        ...product,
                        sizes: { ...product.sizes, [size]: Math.max(0, quantity) },
                      }
                    : product,
                ),
              }
            : store,
        ),
      );
    },
    [useBackend],
  );

  const progressOrderByStore = useCallback(
    async (orderId: string) => {
      if (useBackend) {
        try {
          const supabase = getSupabaseClient();
          const { data } = await supabase.auth.getSession();
          const token = data.session?.access_token;
          if (!token) return;
          const row = orders.find((o) => o.id === orderId);
          if (!row?.rowId) return;
          const next = await storeAdvanceOrderApi(token, row.rowId);
          if (!next) return;
          const nextOrders = await fetchOrdersFromApi();
          if (nextOrders) {
            setOrders(nextOrders);
            setCouriers(courierAvailabilityFromOrders(nextOrders));
          }
        } catch {
          /* keep local state */
        }
        return;
      }

      setOrders((prev) =>
        prev.map((order) => {
          if (order.id !== orderId) return order;
          if (order.status === "order_placed") return { ...order, status: "store_packing" };
          if (order.status === "store_packing") {
            if (order.courierId) {
              setCouriers((courierPrev) =>
                courierPrev.map((courier) =>
                  courier.id === order.courierId
                    ? { ...courier, status: "on_delivery" }
                    : courier,
                ),
              );
            }
            return { ...order, status: "courier_pickup" };
          }
          return order;
        }),
      );
    },
    [orders, useBackend],
  );

  const progressOrderByCourier = useCallback(
    async (orderId: string) => {
      if (useBackend) {
        try {
          const supabase = getSupabaseClient();
          const { data } = await supabase.auth.getSession();
          const token = data.session?.access_token;
          if (!token) return;
          const row = orders.find((o) => o.id === orderId);
          if (!row?.rowId) return;
          const next = await courierAdvanceOrderApi(token, row.rowId);
          if (!next) return;
          const nextOrders = await fetchOrdersFromApi();
          if (nextOrders) {
            setOrders(nextOrders);
            setCouriers(courierAvailabilityFromOrders(nextOrders));
          }
        } catch {
          /* keep local state */
        }
        return;
      }

      setOrders((prev) =>
        prev.map((order) => {
          if (order.id !== orderId) return order;
          if (order.status === "courier_pickup") return { ...order, status: "on_the_way" };
          if (order.status === "on_the_way") {
            if (order.courierId) {
              setCouriers((courierPrev) =>
                courierPrev.map((courier) =>
                  courier.id === order.courierId
                    ? { ...courier, status: "available" }
                    : courier,
                ),
              );
            }
            return { ...order, status: "delivered" };
          }
          return order;
        }),
      );
    },
    [orders, useBackend],
  );

  const value = useMemo(
    () => ({
      stores,
      couriers,
      orders,
      role,
      loginAs,
      loginAsPartner,
      logout,
      partnerProfile,
      placeOrder,
      updateStock,
      progressOrderByStore,
      progressOrderByCourier,
    }),
    [
      stores,
      couriers,
      orders,
      role,
      loginAs,
      loginAsPartner,
      logout,
      partnerProfile,
      placeOrder,
      updateStock,
      progressOrderByStore,
      progressOrderByCourier,
    ],
  );

  return <LumiContext.Provider value={value}>{children}</LumiContext.Provider>;
}

export function useLumi() {
  const context = useContext(LumiContext);
  if (!context) {
    throw new Error("useLumi must be used inside LumiProvider");
  }
  return context;
}
