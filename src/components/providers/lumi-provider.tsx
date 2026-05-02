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
import { loadCartFromStorage, saveCartToStorage } from "@/lib/loomy/cart-storage";
import {
  clearDemoCheckoutSnapshot,
  loadDemoCheckoutSnapshot,
  saveDemoCheckoutSnapshot,
} from "@/lib/loomy/demo-checkout-storage";

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

export type OrderLineSummary = {
  productId: string;
  productName: string;
  size: string;
  qty: number;
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
  /** Multiple lines when order came from cart / RPC */
  itemLines?: OrderLineSummary[];
  /** Payment row status when loaded from Supabase */
  paymentStatus?: string | null;
  totalMinor?: number | null;
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

export type CartLine = {
  id: string;
  storeId: string;
  storeName: string;
  productId: string;
  productName: string;
  size: SizeKey;
  qty: number;
  unitPriceKr: number;
  imageUrl: string;
};

export type PlaceCartOrderResult =
  | { ok: true; order: OrderData }
  | { ok: false; error: string };

type LumiContextValue = {
  stores: StoreData[];
  couriers: CourierData[];
  orders: OrderData[];
  /** True when catalog/orders sync from Supabase (requires env + DB). */
  supabaseDataMode: boolean;
  /** Current Supabase user id when logged in (null otherwise). */
  authUserId: string | null;
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
  /** Shopping bag (client-side; persisted in localStorage). */
  cartLines: CartLine[];
  cartOpen: boolean;
  setCartOpen: (open: boolean) => void;
  addToCart: (line: Omit<CartLine, "id"> & { id?: string }) => void;
  updateCartQty: (lineId: string, qty: number) => void;
  removeCartLine: (lineId: string) => void;
  clearCart: () => void;
  cartItemCount: number;
  cartSubtotalKr: number;
  placeCartOrder: () => Promise<PlaceCartOrderResult>;
  /** Demo/local orders only: set order status and persist demo checkout snapshot. */
  setDemoOrderStatus: (
    orderId: string,
    status: OrderStatus,
    options?: { simulatedPaymentMethod?: string },
  ) => void;
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
  const [cartLines, setCartLines] = useState<CartLine[]>(() => loadCartFromStorage());
  const [cartOpen, setCartOpen] = useState(false);
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

  useEffect(() => {
    saveCartToStorage(
      cartLines.map((l) => ({
        id: l.id,
        storeId: l.storeId,
        storeName: l.storeName,
        productId: l.productId,
        productName: l.productName,
        size: l.size,
        qty: l.qty,
        unitPriceKr: l.unitPriceKr,
        imageUrl: l.imageUrl,
      })),
    );
  }, [cartLines]);

  const cartItemCount = useMemo(
    () => cartLines.reduce((sum, line) => sum + line.qty, 0),
    [cartLines],
  );

  const cartSubtotalKr = useMemo(
    () => cartLines.reduce((sum, line) => sum + line.unitPriceKr * line.qty, 0),
    [cartLines],
  );

  const addToCart = useCallback((line: Omit<CartLine, "id"> & { id?: string }) => {
    const id = line.id ?? `cart-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    setCartLines((prev) => {
      const sameKey = (a: CartLine) =>
        a.storeId === line.storeId && a.productId === line.productId && a.size === line.size;
      const idx = prev.findIndex(sameKey);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], qty: next[idx].qty + line.qty };
        return next;
      }
      return [...prev, { ...line, id }];
    });
    setCartOpen(true);
  }, []);

  const updateCartQty = useCallback((lineId: string, qty: number) => {
    setCartLines((prev) =>
      prev
        .map((l) => (l.id === lineId ? { ...l, qty: Math.max(1, qty) } : l))
        .filter((l) => l.qty > 0),
    );
  }, []);

  const removeCartLine = useCallback((lineId: string) => {
    setCartLines((prev) => prev.filter((l) => l.id !== lineId));
  }, []);

  const clearCart = useCallback(() => {
    setCartLines([]);
  }, []);

  const setDemoOrderStatus = useCallback(
    (orderId: string, status: OrderStatus, options?: { simulatedPaymentMethod?: string }) => {
      const snap = loadDemoCheckoutSnapshot();
      if (!snap || snap.orderId !== orderId) return;
      saveDemoCheckoutSnapshot({
        ...snap,
        status,
        ...(options?.simulatedPaymentMethod
          ? { simulatedPaymentMethod: options.simulatedPaymentMethod }
          : {}),
      });
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status } : o)),
      );
    },
    [],
  );

  const placeCartOrder = useCallback(async (): Promise<PlaceCartOrderResult> => {
    if (cartLines.length === 0) {
      return { ok: false, error: "Kurven er tom." };
    }
    const storeIds = new Set(cartLines.map((l) => l.storeId));
    if (storeIds.size > 1) {
      return { ok: false, error: "Du kan kun have varer fra én butik ad gangen." };
    }

    const supabase = getSupabaseOrNull();
    if (supabase && authUserId) {
      const items = cartLines.map((l) => ({
        store_id: l.storeId,
        product_id: l.productId,
        size: l.size,
        qty: l.qty,
      }));
      clearDemoCheckoutSnapshot();
      const { data, error } = await supabase.rpc("place_loomy_cart_order", {
        p_items: items,
        p_delivery_address: customerProfile.address,
      });
      if (error) {
        const raw = error.message ?? "";
        const code = error.code ?? "";
        const msg =
          raw.includes("out_of_stock") || code === "22000" || raw.includes("22000")
            ? "En vare blev netop udsolgt. Opdater kurven og prøv igen."
            : raw.includes("multi_store_cart")
              ? "Kun én butik pr. ordre."
              : raw.includes("not_authenticated") || raw.includes("28000") || code === "28000"
                ? "Log ind for at gennemføre."
                : raw.includes("place_loomy_cart_order") ||
                    raw.includes("42883") ||
                    raw.toLowerCase().includes("function") ||
                    raw.toLowerCase().includes("does not exist")
                  ? "SQL-funktionen place_loomy_cart_order mangler i databasen. Kør supabase/loomy_cart_order.sql i Supabase."
                  : raw.includes("invalid_address") || raw.includes("22023")
                    ? "Udfyld en gyldig leveringsadresse under Mit LOOMY."
                    : raw;
        return { ok: false, error: msg };
      }
      const row = data as Record<string, unknown> | null;
      if (!row || typeof row.id !== "string") {
        return { ok: false, error: "Uventet svar fra serveren." };
      }
      const firstLine = cartLines[0];
      const order: OrderData = {
        id: String(row.id),
        storeId: String(row.storeId),
        storeName: String(row.storeName),
        storeAddress: String(row.storeAddress),
        productId: firstLine.productId,
        productName:
          cartLines.length > 1
            ? `${firstLine.productName} + ${cartLines.length - 1} mere`
            : firstLine.productName,
        size: firstLine.size,
        qty: cartLines.reduce((s, l) => s + l.qty, 0),
        customerName: String(row.customerName),
        customerAddress: String(row.customerAddress),
        nearbyEtaMinutes: Number(row.nearbyEtaMinutes),
        courierId: row.courierId ? String(row.courierId) : undefined,
        status: row.status as OrderStatus,
        createdAt: Number(row.createdAt),
      };
      clearCart();
      setCartOpen(false);
      void refreshCatalog();
      void refreshOrdersFromSupabase();
      return { ok: true, order };
    }

    const nextStores = stores.map((store) => ({
      ...store,
      products: store.products.map((p) => ({ ...p, sizes: { ...p.sizes } })),
    }));
    for (const line of cartLines) {
      const store = nextStores.find((s) => s.id === line.storeId);
      if (!store) return { ok: false, error: "Butik findes ikke." };
      const product = store.products.find((p) => p.id === line.productId);
      if (!product) return { ok: false, error: "Produkt findes ikke." };
      const stock = product.sizes[line.size];
      if (stock < line.qty) {
        return { ok: false, error: "Ikke nok på lager til en vare i kurven." };
      }
      product.sizes[line.size] = stock - line.qty;
    }
    const availableCourier = couriers.find((c) => c.status === "available");
    const nextCouriers = couriers.map((c) =>
      c.id === availableCourier?.id ? { ...c, status: "on_delivery" as const } : c,
    );
    const first = cartLines[0];
    const totalQty = cartLines.reduce((s, l) => s + l.qty, 0);
    const orderId = `LMI-${Math.floor(Math.random() * 9000) + 1000}`;
    const lastOrder: OrderData = {
      id: orderId,
      storeId: first.storeId,
      storeName: first.storeName,
      storeAddress: nextStores.find((s) => s.id === first.storeId)?.address ?? "",
      productId: first.productId,
      productName:
        cartLines.length > 1
          ? `${first.productName} + ${cartLines.length - 1} mere`
          : first.productName,
      size: first.size,
      qty: totalQty,
      customerName: customerProfile.name,
      customerAddress: customerProfile.address,
      nearbyEtaMinutes: 18 + Math.floor(Math.random() * 20),
      courierId: availableCourier?.id,
      status: "order_placed",
      createdAt: Date.now(),
    };
    setStores(nextStores);
    setCouriers(nextCouriers);
    setOrders((prev) => [lastOrder, ...prev]);
    saveDemoCheckoutSnapshot({
      orderId: lastOrder.id,
      storeId: lastOrder.storeId,
      storeName: lastOrder.storeName,
      deliveryAddress: customerProfile.address,
      status: "order_placed",
      lines: cartLines.map((l) => ({
        id: l.id,
        storeId: l.storeId,
        storeName: l.storeName,
        productId: l.productId,
        productName: l.productName,
        size: l.size,
        qty: l.qty,
        unitPriceKr: l.unitPriceKr,
        imageUrl: l.imageUrl,
      })),
      subtotalKr: cartLines.reduce((s, l) => s + l.unitPriceKr * l.qty, 0),
    });
    clearCart();
    setCartOpen(false);
    return { ok: true, order: lastOrder };
  }, [
    authUserId,
    cartLines,
    clearCart,
    customerProfile,
    couriers,
    refreshCatalog,
    refreshOrdersFromSupabase,
    stores,
  ]);

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
      authUserId,
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
      cartLines,
      cartOpen,
      setCartOpen,
      addToCart,
      updateCartQty,
      removeCartLine,
      clearCart,
      cartItemCount,
      cartSubtotalKr,
      placeCartOrder,
      setDemoOrderStatus,
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
      authUserId,
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
      cartLines,
      cartOpen,
      addToCart,
      updateCartQty,
      removeCartLine,
      clearCart,
      cartItemCount,
      cartSubtotalKr,
      placeCartOrder,
      setDemoOrderStatus,
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
