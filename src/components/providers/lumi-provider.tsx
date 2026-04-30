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
import { fetchCatalogFromSupabase } from "@/lib/loomy/catalog";
import { demoFallbackCouriers, demoFallbackStores } from "@/lib/loomy/demo-fallback-catalog";
import { demoFallbackOrders } from "@/lib/loomy/demo-fallback-orders";
import { fetchOrdersForContext } from "@/lib/loomy/orders";

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

export type CustomerProfile = {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  styleTags: string[];
};

export type PlaceOrderResult =
  | { ok: true; order: OrderData }
  | { ok: false; error: string };

type LumiContextValue = {
  stores: StoreData[];
  couriers: CourierData[];
  orders: OrderData[];
  /** True when catalog/orders sync from Supabase (requires env + DB). */
  supabaseDataMode: boolean;
  role: "customer" | "store" | "courier";
  customerProfile: CustomerProfile;
  loginAs: (role: "customer" | "store" | "courier") => void;
  loginAsCustomer: (provider: "google" | "apple" | "magic", email?: string) => void;
  updateCustomerProfile: (input: Partial<Omit<CustomerProfile, "id">>) => void;
  getCustomerOrders: () => OrderData[];
  getRecommendedProducts: () => Product[];
  loginAsPartner: (profile: PartnerProfile) => void;
  logout: () => void;
  partnerProfile: PartnerProfile | null;
  placeOrder: (params: { storeId: string; productId: string; size: SizeKey }) => Promise<PlaceOrderResult>;
  updateStock: (params: {
    storeId: string;
    productId: string;
    size: SizeKey;
    quantity: number;
  }) => Promise<void>;
  progressOrderByStore: (orderId: string) => Promise<{ ok: boolean; error?: string }>;
  progressOrderByCourier: (orderId: string) => Promise<{ ok: boolean; error?: string }>;
};

const customerSeedProfiles: CustomerProfile[] = [
  {
    id: "customer-emma",
    name: "Emma Larsen",
    email: "emma@loomy.dk",
    phone: "+45 31 25 80 90",
    address: "Store Kongensgade 45, 2. tv, 1264 København K",
    styleTags: ["minimal", "tailored", "neutral"],
  },
  {
    id: "customer-noah",
    name: "Noah Petersen",
    email: "noah@loomy.dk",
    phone: "+45 42 14 77 01",
    address: "Larsbjørnsstræde 9, 1. th, 1454 København K",
    styleTags: ["street", "monochrome", "utility"],
  },
  {
    id: "customer-sofie",
    name: "Sofie Madsen",
    email: "sofie@loomy.dk",
    phone: "+45 29 11 50 04",
    address: "Nørre Voldgade 12, 3. sal, 1358 København K",
    styleTags: ["occasion", "soft", "elegant"],
  },
];

const LumiContext = createContext<LumiContextValue | undefined>(undefined);

function getSupabaseOrNull() {
  try {
    return getSupabaseClient();
  } catch {
    return null;
  }
}

function demoPlaceOrderLocal(params: {
  storeId: string;
  productId: string;
  size: SizeKey;
  stores: StoreData[];
  couriers: CourierData[];
  customerProfile: CustomerProfile;
}): { nextStores: StoreData[]; nextCouriers: CourierData[]; order: OrderData } | null {
  const { storeId, productId, size, stores, couriers, customerProfile } = params;
  let canPlace = false;
  let selectedStoreName = "";
  let selectedStoreAddress = "";
  let selectedProductName = "";
  const nextStores = stores.map((store) => {
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
        return { ...product, sizes: { ...product.sizes, [size]: product.sizes[size] - 1 } };
      }),
    };
  });
  if (!canPlace) return null;
  const availableCourier = couriers.find((c) => c.status === "available");
  const orderId = `LMI-${Math.floor(Math.random() * 9000) + 1000}`;
  const eta = 18 + Math.floor(Math.random() * 20);
  const nextCouriers = couriers.map((c) =>
    c.id === availableCourier?.id ? { ...c, status: "on_delivery" as const } : c,
  );
  const order: OrderData = {
    id: orderId,
    storeId,
    storeName: selectedStoreName,
    storeAddress: selectedStoreAddress,
    productId,
    productName: selectedProductName,
    size,
    qty: 1,
    customerName: customerProfile.name,
    customerAddress: customerProfile.address,
    nearbyEtaMinutes: eta,
    courierId: availableCourier?.id,
    status: "order_placed",
    createdAt: Date.now(),
  };
  return { nextStores, nextCouriers, order };
}

export function LumiProvider({ children }: { children: ReactNode }) {
  const [stores, setStores] = useState<StoreData[]>(() => demoFallbackStores);
  const [couriers, setCouriers] = useState<CourierData[]>(() => demoFallbackCouriers);
  const [orders, setOrders] = useState<OrderData[]>(
    () => [...demoFallbackOrders] as OrderData[],
  );
  const [supabaseDataMode, setSupabaseDataMode] = useState(false);
  const [role, setRole] = useState<"customer" | "store" | "courier">("customer");
  const [customerProfile, setCustomerProfile] = useState<CustomerProfile>(customerSeedProfiles[0]);
  const [partnerProfile, setPartnerProfile] = useState<PartnerProfile | null>(null);
  const [authUserId, setAuthUserId] = useState<string | null>(null);

  const refreshCatalog = useCallback(async () => {
    const supabase = getSupabaseOrNull();
    if (!supabase) {
      setSupabaseDataMode(false);
      setStores(demoFallbackStores);
      setCouriers(demoFallbackCouriers);
      setOrders([...demoFallbackOrders] as OrderData[]);
      return;
    }
    try {
      const { stores: next, couriers: c } = await fetchCatalogFromSupabase(supabase);
      setStores(next);
      setCouriers(c);
      setSupabaseDataMode(true);
    } catch {
      setSupabaseDataMode(false);
      setStores(demoFallbackStores);
      setCouriers(demoFallbackCouriers);
      setOrders([...demoFallbackOrders] as OrderData[]);
    }
  }, []);

  const refreshOrdersFromSupabase = useCallback(async () => {
    const supabase = getSupabaseOrNull();
    if (!supabase || !authUserId) {
      setOrders([]);
      return;
    }
    if (role === "customer") {
      const list = await fetchOrdersForContext(supabase, {
        role: "customer",
        userId: authUserId,
      });
      setOrders(list);
      return;
    }
    if (role === "store" && partnerProfile?.storeId) {
      const list = await fetchOrdersForContext(supabase, {
        role: "store",
        userId: authUserId,
        storeId: partnerProfile.storeId,
      });
      setOrders(list);
      return;
    }
    if (role === "courier" && partnerProfile?.courierId) {
      const list = await fetchOrdersForContext(supabase, {
        role: "courier",
        userId: authUserId,
        courierId: partnerProfile.courierId,
      });
      setOrders(list);
      return;
    }
    setOrders([]);
  }, [authUserId, role, partnerProfile]);

  const loadCustomerProfileFromDb = useCallback(async (userId: string) => {
    const supabase = getSupabaseOrNull();
    if (!supabase) return;
    const { data, error } = await supabase
      .from("customer_profiles")
      .select("id, email, full_name, phone, address, style_tags")
      .eq("user_id", userId)
      .maybeSingle();
    if (error || !data) return;
    const row = data as {
      id: string;
      email: string;
      full_name: string;
      phone: string | null;
      address: string;
      style_tags: string[] | null;
    };
    setCustomerProfile({
      id: row.id,
      name: row.full_name,
      email: row.email,
      phone: row.phone ?? "",
      address: row.address,
      styleTags: row.style_tags ?? [],
    });
  }, []);

  useEffect(() => {
    const supabase = getSupabaseOrNull();
    if (!supabase) return;

    queueMicrotask(() => {
      void refreshCatalog();
    });

    const { data: sub } = supabase.auth.onAuthStateChange(async (event, session) => {
      const user = session?.user ?? null;
      setAuthUserId(user?.id ?? null);

      if (!user?.email) {
        setPartnerProfile(null);
        setRole("customer");
        setOrders([]);
        return;
      }

      try {
        const profile = await fetchPartnerProfileByEmail(user.email);
        if (profile) {
          setPartnerProfile(profile);
          setRole(profile.role);
        } else {
          setPartnerProfile(null);
          setRole("customer");
          await loadCustomerProfileFromDb(user.id);
        }
      } catch {
        setPartnerProfile(null);
        setRole("customer");
      }

      if (event === "SIGNED_OUT") {
        setCustomerProfile(customerSeedProfiles[0]);
        void refreshCatalog();
      }
    });

    void supabase.auth.getUser().then(({ data }) => {
      setAuthUserId(data.user?.id ?? null);
    });

    return () => {
      sub.subscription.unsubscribe();
    };
  }, [loadCustomerProfileFromDb, refreshCatalog]);

  useEffect(() => {
    const supabase = getSupabaseOrNull();
    if (!supabase || !supabaseDataMode) return;

    const channel = supabase
      .channel("loomy-orders")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        () => {
          void refreshOrdersFromSupabase();
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "product_inventory" },
        () => {
          void refreshCatalog();
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [supabaseDataMode, refreshOrdersFromSupabase, refreshCatalog]);

  useEffect(() => {
    if (!supabaseDataMode) return;
    queueMicrotask(() => {
      void refreshOrdersFromSupabase();
    });
  }, [supabaseDataMode, refreshOrdersFromSupabase, role, partnerProfile]);

  const loginAs = useCallback((nextRole: "customer" | "store" | "courier") => {
    setRole(nextRole);
    if (nextRole === "customer") {
      setPartnerProfile(null);
    }
  }, []);

  const loginAsCustomer = useCallback(
    (provider: "google" | "apple" | "magic", email?: string) => {
      setRole("customer");
      setPartnerProfile(null);
      const normalizedEmail = email?.trim().toLowerCase() ?? "";
      const knownByEmail = customerSeedProfiles.find((p) => p.email === normalizedEmail);
      if (knownByEmail) {
        setCustomerProfile(knownByEmail);
        return;
      }
      if (provider === "apple") {
        setCustomerProfile(customerSeedProfiles[1]);
        return;
      }
      if (provider === "magic") {
        setCustomerProfile(customerSeedProfiles[2]);
        return;
      }
      setCustomerProfile(customerSeedProfiles[0]);
    },
    [],
  );

  const updateCustomerProfile = useCallback(
    async (input: Partial<Omit<CustomerProfile, "id">>) => {
      const supabase = getSupabaseOrNull();
      setCustomerProfile((prev) => {
        const next = { ...prev, ...input };
        if (supabase && authUserId) {
          void supabase
            .from("customer_profiles")
            .update({
              full_name: next.name,
              email: next.email.trim().toLowerCase(),
              phone: next.phone || null,
              address: next.address,
              style_tags: next.styleTags,
            })
            .eq("user_id", authUserId);
        }
        return next;
      });
    },
    [authUserId],
  );

  const loginAsPartner = useCallback((profile: PartnerProfile) => {
    setPartnerProfile(profile);
    setRole(profile.role);
  }, []);

  const logout = useCallback(() => {
    setRole("customer");
    setPartnerProfile(null);
    try {
      const supabase = getSupabaseOrNull();
      void supabase?.auth.signOut();
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
    }): Promise<PlaceOrderResult> => {
      const supabase = getSupabaseOrNull();
      if (supabase && authUserId) {
        const { data, error } = await supabase.rpc("place_loomy_order", {
          p_store_id: storeId,
          p_product_id: productId,
          p_size: size,
          p_delivery_address: customerProfile.address,
        });
        if (error) {
          const msg =
            error.message.includes("out_of_stock") || error.message.includes("22000")
              ? "Størrelsen er netop blevet udsolgt. Opdater og prøv igen."
              : error.message.includes("not_authenticated") || error.message.includes("28000")
                ? "Log ind som kunde for at bestille."
                : error.message;
          return { ok: false, error: msg };
        }
        const row = data as Record<string, unknown> | null;
        if (!row || typeof row.id !== "string") {
          return { ok: false, error: "Uventet svar fra serveren." };
        }
        const order: OrderData = {
          id: String(row.id),
          storeId: String(row.storeId),
          storeName: String(row.storeName),
          storeAddress: String(row.storeAddress),
          productId: String(row.productId),
          productName: String(row.productName),
          size: row.size as SizeKey,
          qty: Number(row.qty),
          customerName: String(row.customerName),
          customerAddress: String(row.customerAddress),
          nearbyEtaMinutes: Number(row.nearbyEtaMinutes),
          courierId: row.courierId ? String(row.courierId) : undefined,
          status: row.status as OrderStatus,
          createdAt: Number(row.createdAt),
        };
        void refreshCatalog();
        void refreshOrdersFromSupabase();
        return { ok: true, order };
      }

      const demo = demoPlaceOrderLocal({
        storeId,
        productId,
        size,
        stores,
        couriers,
        customerProfile,
      });
      if (!demo) return { ok: false, error: "Udsolgt i den valgte størrelse." };
      setStores(demo.nextStores);
      setCouriers(demo.nextCouriers);
      setOrders((prev) => [demo.order, ...prev]);
      return { ok: true, order: demo.order };
    },
    [authUserId, customerProfile, couriers, refreshCatalog, refreshOrdersFromSupabase, stores],
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
      const supabase = getSupabaseOrNull();
      if (supabase && authUserId && partnerProfile?.role === "store") {
        const { error } = await supabase
          .from("product_inventory")
          .update({ qty: Math.max(0, quantity) })
          .eq("product_id", productId)
          .eq("size", size);
        if (error) throw new Error(error.message);
        void refreshCatalog();
        return;
      }
      setStores((prev) =>
        prev.map((store) =>
          store.id === storeId
            ? {
                ...store,
                products: store.products.map((product) =>
                  product.id === productId
                    ? { ...product, sizes: { ...product.sizes, [size]: Math.max(0, quantity) } }
                    : product,
                ),
              }
            : store,
        ),
      );
    },
    [authUserId, partnerProfile?.role, refreshCatalog],
  );

  const progressOrderByStore = useCallback(
    async (orderId: string): Promise<{ ok: boolean; error?: string }> => {
      const supabase = getSupabaseOrNull();
      if (supabase && authUserId) {
        const { error } = await supabase.rpc("progress_order_store", { p_order_id: orderId });
        if (error) {
          const msg =
            error.message.includes("payment_required") || error.message.includes("28000")
              ? "Ordren skal betales før butikken kan starte pakning."
              : error.message;
          return { ok: false, error: msg };
        }
        void refreshOrdersFromSupabase();
        void refreshCatalog();
        return { ok: true };
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
      return { ok: true };
    },
    [authUserId, refreshOrdersFromSupabase, refreshCatalog],
  );

  const progressOrderByCourier = useCallback(
    async (orderId: string): Promise<{ ok: boolean; error?: string }> => {
      const supabase = getSupabaseOrNull();
      if (supabase && authUserId) {
        const { error } = await supabase.rpc("progress_order_courier", { p_order_id: orderId });
        if (error) return { ok: false, error: error.message };
        void refreshOrdersFromSupabase();
        void refreshCatalog();
        return { ok: true };
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
      return { ok: true };
    },
    [authUserId, refreshOrdersFromSupabase, refreshCatalog],
  );

  const getCustomerOrders = useCallback(() => {
    if (supabaseDataMode && role === "customer" && authUserId) {
      return [...orders].sort((a, b) => b.createdAt - a.createdAt);
    }
    const normalizedName = customerProfile.name.trim().toLowerCase();
    return orders
      .filter((order) => order.customerName.trim().toLowerCase() === normalizedName)
      .sort((a, b) => b.createdAt - a.createdAt);
  }, [authUserId, customerProfile.name, orders, role, supabaseDataMode]);

  const getRecommendedProducts = useCallback(() => {
    const pastOrders = getCustomerOrders();
    const orderedCategories = new Set<string>();
    const orderedProductIds = new Set<string>();
    for (const order of pastOrders) {
      orderedProductIds.add(order.productId);
      const store = stores.find((s) => s.id === order.storeId);
      const product = store?.products.find((p) => p.id === order.productId);
      if (product?.category) orderedCategories.add(product.category);
    }
    const weighted = stores
      .flatMap((store) => store.products)
      .filter((product) => !orderedProductIds.has(product.id))
      .map((product) => ({
        product,
        score:
          (orderedCategories.has(product.category) ? 2 : 0) +
          (customerProfile.styleTags.some(
            (tag) =>
              product.description.toLowerCase().includes(tag) ||
              product.name.toLowerCase().includes(tag),
          )
            ? 1
            : 0),
      }))
      .sort((a, b) => b.score - a.score || a.product.price - b.product.price)
      .slice(0, 6)
      .map((entry) => entry.product);
    if (weighted.length > 0) return weighted;
    return stores.flatMap((store) => store.products).slice(0, 6);
  }, [customerProfile.styleTags, getCustomerOrders, stores]);

  const value = useMemo(
    () => ({
      stores,
      couriers,
      orders,
      supabaseDataMode,
      role,
      customerProfile,
      loginAs,
      loginAsCustomer,
      updateCustomerProfile,
      getCustomerOrders,
      getRecommendedProducts,
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
      supabaseDataMode,
      role,
      customerProfile,
      loginAs,
      loginAsCustomer,
      updateCustomerProfile,
      getCustomerOrders,
      getRecommendedProducts,
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
