"use client";

/**
 * LOOMY checkout: Supabase order summary + Stripe, or demo snapshot + simulated pay.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { Loader2, Lock, Package, Sparkles } from "lucide-react";
import { DemoFullJourney } from "@/components/checkout/demo-full-journey";
import { OrderPricingSummary } from "@/components/checkout/order-pricing-summary";
import { LumiHeader } from "@/components/lumi-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useLumi } from "@/components/providers/lumi-provider";
import { getSupabaseClient } from "@/lib/supabase/client";
import { springSoft } from "@/components/motion-config";
import type { DemoCheckoutSnapshot } from "@/lib/loomy/demo-checkout-storage";
import { loadDemoCheckoutSnapshot } from "@/lib/loomy/demo-checkout-storage";

type OrderItemRow = {
  product_id: string;
  product_name: string;
  size: string;
  qty: number;
  unit_price_minor: number;
};

type OrderRow = {
  id: string;
  store_id: string;
  status: string;
  total_minor: number | null;
  subtotal_minor?: number | null;
  delivery_fee_minor?: number | null;
  vat_included_minor?: number | null;
  currency: string;
  delivery_address: string;
  stores?: { name: string } | { name: string }[] | null;
  order_items?: OrderItemRow[] | null;
  payments?: { status: string } | { status: string }[] | null;
};

export default function CheckoutPage() {
  const reduceMotion = useReducedMotion();
  const searchParams = useSearchParams();
  const orderIdParam = searchParams.get("order_id") ?? "";
  const checkoutFlag = searchParams.get("checkout") ?? "";

  const { stores, supabaseDataMode, authUserId, setDemoOrderStatus } = useLumi();
  const [order, setOrder] = useState<OrderRow | null>(null);
  const [loadError, setLoadError] = useState("");
  const [payBusy, setPayBusy] = useState(false);
  const [payError, setPayError] = useState("");
  const [paymentPollBusy, setPaymentPollBusy] = useState(false);
  const [demoSnap, setDemoSnap] = useState<DemoCheckoutSnapshot | null>(null);
  /** Avoid SSR/localStorage mismatch: read snapshot only after mount. */
  const [checkoutMounted, setCheckoutMounted] = useState(false);

  const reloadDemoSnapshot = useCallback(() => {
    setDemoSnap(loadDemoCheckoutSnapshot());
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      setCheckoutMounted(true);
      reloadDemoSnapshot();
    });
  }, [orderIdParam, reloadDemoSnapshot]);

  const isDemoOrderView = Boolean(
    !supabaseDataMode && orderIdParam && demoSnap?.orderId === orderIdParam,
  );

  const productImage = useCallback(
    (productId: string) => {
      for (const store of stores) {
        const p = store.products.find((x) => x.id === productId);
        if (p) return p.imageUrl;
      }
      return "/products/new-in.svg";
    },
    [stores],
  );

  const loadOrder = useCallback(async () => {
    if (!orderIdParam) {
      setLoadError("Manglende ordre-id.");
      return;
    }
    if (!supabaseDataMode || !authUserId) {
      setLoadError("");
      return;
    }
    setLoadError("");
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from("orders")
        .select(
          `
          id,
          store_id,
          status,
          total_minor,
          subtotal_minor,
          delivery_fee_minor,
          vat_included_minor,
          currency,
          delivery_address,
          stores ( name ),
          order_items ( product_id, product_name, size, qty, unit_price_minor ),
          payments ( status )
        `,
        )
        .eq("id", orderIdParam)
        .maybeSingle();
      if (error) {
        setLoadError(error.message);
        return;
      }
      if (!data) {
        setLoadError("Ordren findes ikke.");
        return;
      }
      setOrder(data as unknown as OrderRow);
    } catch {
      setLoadError("Supabase er ikke tilgængelig.");
    }
  }, [authUserId, orderIdParam, supabaseDataMode]);

  useEffect(() => {
    if (isDemoOrderView) return;
    queueMicrotask(() => {
      void loadOrder();
    });
  }, [isDemoOrderView, loadOrder]);

  useEffect(() => {
    if (checkoutFlag !== "cancel" || !orderIdParam || isDemoOrderView) return;
    void (async () => {
      try {
        const supabase = getSupabaseClient();
        const { data: sess } = await supabase.auth.getSession();
        const token = sess.session?.access_token;
        if (token) {
          await fetch("/api/checkout/cancel-order", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ orderId: orderIdParam }),
          });
        }
      } catch {
        // ignore
      } finally {
        const u = new URL(window.location.href);
        u.searchParams.delete("checkout");
        window.history.replaceState({}, "", `${u.pathname}${u.search}`);
        void loadOrder();
      }
    })();
  }, [checkoutFlag, orderIdParam, isDemoOrderView, loadOrder]);

  useEffect(() => {
    if (checkoutFlag === "success" && supabaseDataMode && authUserId) {
      queueMicrotask(() => {
        void loadOrder();
      });
    }
  }, [checkoutFlag, authUserId, supabaseDataMode, loadOrder]);

  const paymentStatus = useMemo(() => {
    const p = order?.payments;
    if (!p) return null;
    const row = Array.isArray(p) ? p[0] : p;
    return row?.status ?? null;
  }, [order?.payments]);

  useEffect(() => {
    if (!supabaseDataMode || !authUserId || checkoutFlag !== "success" || !orderIdParam) return;
    if (paymentStatus === "succeeded" || paymentStatus === "cancelled") return;
    const shouldPoll = paymentStatus === "processing" || paymentStatus === null;
    if (!shouldPoll) return;

    let ticks = 0;
    const maxTicks = paymentStatus === "processing" ? 30 : 8;
    queueMicrotask(() => {
      setPaymentPollBusy(true);
    });
    const id = window.setInterval(() => {
      ticks += 1;
      void loadOrder();
      if (ticks >= maxTicks) {
        clearInterval(id);
        setPaymentPollBusy(false);
      }
    }, 2000);

    return () => {
      clearInterval(id);
      setPaymentPollBusy(false);
    };
  }, [authUserId, checkoutFlag, loadOrder, orderIdParam, paymentStatus, supabaseDataMode]);

  const items = order?.order_items ?? [];
  const storeName = useMemo(() => {
    const s = order?.stores;
    if (!s) return "";
    return Array.isArray(s) ? (s[0]?.name ?? "") : (s.name ?? "");
  }, [order?.stores]);

  const itemsSubtotalMinor = useMemo(() => {
    if (!order?.order_items?.length) return 0;
    return order.order_items.reduce((sum, line) => sum + line.unit_price_minor * line.qty, 0);
  }, [order]);

  const totalKr = order?.total_minor != null ? Math.round(order.total_minor / 100) : 0;

  const loginNextHref = `/login/customer?next=${encodeURIComponent(`/checkout?order_id=${orderIdParam}`)}`;

  if (!checkoutMounted && orderIdParam) {
    return (
      <div className="flex min-h-screen flex-col overflow-x-hidden text-stone-900">
        <LumiHeader />
        <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center gap-3 px-4 py-16">
          <Loader2 className="animate-spin text-[#8b6914]" size={28} />
          <p className="text-sm text-stone-500">Åbner checkout…</p>
        </main>
      </div>
    );
  }

  if (!orderIdParam) {
    return (
      <div className="flex min-h-screen flex-col overflow-x-hidden text-stone-900">
        <LumiHeader />
        <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-10 md:px-6 md:py-12">
          <Card className="border-[0.5px] border-stone-200/90 bg-white/95 p-8 text-center shadow-sm">
            <p className="text-sm text-stone-600">Der mangler et ordre-id i linket.</p>
            <Button className="mt-4" href="/shopping">
              Tilbage til shop
            </Button>
          </Card>
        </main>
      </div>
    );
  }

  // --- Demo: full simulated purchase (payment choice → wait → status steps to delivered) ---
  if (isDemoOrderView && demoSnap) {
    return (
      <div className="flex min-h-screen flex-col overflow-x-hidden text-stone-900">
        <LumiHeader />
        <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-10 md:px-6 md:py-12">
          <DemoFullJourney
            key={demoSnap.orderId}
            initialSnapshot={demoSnap}
            setDemoOrderStatus={setDemoOrderStatus}
            reloadSnapshot={reloadDemoSnapshot}
          />
        </main>
      </div>
    );
  }

  // --- Supabase + Stripe ---
  if (!supabaseDataMode || !authUserId) {
    return (
      <div className="flex min-h-screen flex-col overflow-x-hidden text-stone-900">
        <LumiHeader />
        <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-10 md:px-6 md:py-12">
          <motion.section
            initial={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={springSoft}
            className="mb-8"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8b6914]">Checkout</p>
            <h1 className="mt-2 font-serif text-3xl font-medium tracking-tight text-stone-900">Log ind for at betale</h1>
            <p className="mt-3 max-w-lg text-sm leading-relaxed text-stone-600">
              Din ordre kræver en aktiv kundesession. Log ind med en demo-profil for at åbne Stripe Checkout.
            </p>
          </motion.section>
          <Card className="border-[0.5px] border-stone-200/90 bg-white/95 p-8 text-center shadow-sm">
            <p className="text-sm text-stone-600">
              {!supabaseDataMode
                ? "Supabase er ikke konfigureret — brug demo-checkout ved at handle uden backend, eller sæt miljøvariabler."
                : "Du er ikke logget ind."}
            </p>
            <Button className="mt-4" href={loginNextHref}>
              Kundelogin
            </Button>
            <Button variant="secondary" className="mt-3 w-full sm:inline-flex sm:w-auto" href="/shopping">
              Tilbage til shop
            </Button>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden text-stone-900">
      <LumiHeader />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-10 md:px-6 md:py-12">
        <motion.section
          initial={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={springSoft}
          className="mb-8"
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8b6914]">Checkout</p>
          <h1 className="mt-2 font-serif text-3xl font-medium tracking-tight text-stone-900">Betal sikkert</h1>
          <p className="mt-3 max-w-lg text-sm leading-relaxed text-stone-600">
            Gennemse din ordre og fuldfør med Stripe. Butikken kan først pakke, når betalingen er gennemført.
          </p>
          {checkoutFlag === "success" && paymentStatus === "processing" ? (
            <p className="mt-3 flex flex-wrap items-center gap-2 rounded-xl border-[0.5px] border-amber-200/90 bg-amber-50/90 px-3 py-2 text-xs text-amber-950">
              {paymentPollBusy ? <Loader2 size={14} className="animate-spin text-[#8b6914]" /> : null}
              Afventer bekræftelse fra Stripe — siden opdateres automatisk (asynk betaling kan tage lidt).
            </p>
          ) : null}
          {paymentStatus === "succeeded" ? (
            <p className="mt-3 rounded-xl border-[0.5px] border-emerald-200/90 bg-emerald-50/90 px-3 py-2 text-xs text-emerald-900">
              Betaling gennemført. Butikken kan nu pakke din ordre.
            </p>
          ) : checkoutFlag === "success" && paymentStatus && paymentStatus !== "succeeded" ? (
            <p className="mt-3 rounded-xl border-[0.5px] border-stone-200/90 bg-stone-50 px-3 py-2 text-xs text-stone-700">
              Betalingsstatus: {paymentStatus.replaceAll("_", " ")}
            </p>
          ) : null}
        </motion.section>

        {loadError ? (
          <Card className="border-[0.5px] border-rose-200/80 bg-rose-50/90 p-6 text-sm text-rose-900">{loadError}</Card>
        ) : !order ? (
          <div className="flex flex-col items-center gap-4 py-16">
            <Loader2 className="animate-spin text-[#8b6914]" size={28} />
            <p className="text-sm text-stone-500">Henter ordre…</p>
          </div>
        ) : order.status !== "order_placed" ? (
          <Card className="border-[0.5px] border-stone-200/90 bg-white/95 p-6">
            <p className="text-sm text-stone-700">
              Denne ordre kan ikke betales i status <span className="font-mono">{order.status}</span>.
              {order.status === "store_packing" || order.status === "courier_pickup" || order.status === "on_the_way" ? (
                <span className="mt-2 block text-emerald-800">Betaling er sandsynligvis gennemført.</span>
              ) : null}
            </p>
            <Button variant="secondary" className="mt-4" href="/shopping">
              Tilbage til shop
            </Button>
          </Card>
        ) : paymentStatus === "succeeded" ? (
          <div className="space-y-6">
            <Card className="border-[0.5px] border-emerald-200/90 bg-emerald-50/90 p-6 text-center shadow-sm">
              <p className="font-medium text-emerald-950">Tak — din betaling er registreret</p>
              <p className="mt-2 text-sm text-emerald-900/90">
                Ordre <span className="font-mono">{order.id}</span> er klar til næste trin hos butikken.
              </p>
              <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-center">
                <Button href="/customer">Mit LOOMY</Button>
                <Button variant="secondary" href="/shopping">
                  Shop videre
                </Button>
              </div>
            </Card>
            <Card className="border-[0.5px] border-stone-200/90 bg-white/95 p-5 shadow-sm">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-500">Ordre</p>
              <p className="font-mono text-sm font-medium text-stone-900">{order.id}</p>
              <p className="mt-2 text-sm text-stone-600">
                Total {totalKr} kr · {storeName || "Butik"}
              </p>
            </Card>
          </div>
        ) : (
          <div className="space-y-6">
            <Card className="border-[0.5px] border-stone-200/90 bg-white/95 p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between gap-2">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-500">Ordre</p>
                  <p className="font-mono text-sm font-medium text-stone-900">{order.id}</p>
                </div>
                <span className="rounded-full border-[0.5px] border-[#7c5a10]/30 bg-[#7c5a10]/10 px-3 py-1 text-[11px] font-medium text-[#6b4f0a]">
                  {storeName || "Butik"}
                </span>
              </div>
              <ul className="space-y-3">
                {items.map((line) => (
                  <li
                    key={`${line.product_id}-${line.size}`}
                    className="flex gap-3 rounded-xl border-[0.5px] border-stone-100 bg-stone-50/80 p-3"
                  >
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border-[0.5px] border-stone-200/80 bg-white">
                      <Image
                        src={productImage(line.product_id)}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="64px"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-stone-900">{line.product_name}</p>
                      <p className="text-xs text-stone-500">
                        Str. {line.size} · {line.qty} stk.
                      </p>
                      <p className="mt-1 text-sm tabular-nums text-stone-800">
                        {Math.round((line.unit_price_minor * line.qty) / 100)} kr
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
              <OrderPricingSummary
                subtotalMinor={order.subtotal_minor != null ? order.subtotal_minor : itemsSubtotalMinor}
                deliveryMinor={order.delivery_fee_minor}
                vatIncludedMinor={order.vat_included_minor}
                totalMinor={order.total_minor}
              />
            </Card>

            <Card className="border-[0.5px] border-stone-200/90 bg-gradient-to-br from-white to-stone-50/90 p-5 shadow-sm">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-[0.5px] border-stone-200 bg-white">
                  <Lock size={18} className="text-[#7c5a10]" aria-hidden />
                </span>
                <div>
                  <p className="text-sm font-medium text-stone-900">Krypteret betaling</p>
                  <p className="mt-1 text-xs leading-relaxed text-stone-600">
                    Du sendes til Stripe Checkout med kort, MobilePay og Link. Apple Pay og Google Pay vises som
                    wallet på Stripe-siden, når din enhed understøtter det. LOOMY gemmer aldrig kortdata.
                  </p>
                </div>
              </div>
            </Card>

            {payError ? (
              <p className="rounded-xl border-[0.5px] border-rose-200/80 bg-rose-50 px-3 py-2 text-xs text-rose-800">
                {payError}
              </p>
            ) : null}

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                fullWidth
                disabled={payBusy}
                onClick={async () => {
                  setPayError("");
                  setPayBusy(true);
                  try {
                    const supabase = getSupabaseClient();
                    const { data: sess } = await supabase.auth.getSession();
                    const token = sess.session?.access_token;
                    if (!token) {
                      setPayError("Session udløb — log ind igen.");
                      setPayBusy(false);
                      return;
                    }
                    const res = await fetch("/api/checkout/create-session", {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                      },
                      body: JSON.stringify({ orderId: order.id }),
                    });
                    const data = (await res.json()) as { url?: string; error?: string };
                    if (!res.ok || !data.url) {
                      setPayError(
                        data.error ??
                          "Kunne ikke starte betaling. Tjek LOOMY_STORE_STRIPE_ACCOUNTS og Stripe-nøgler.",
                      );
                      setPayBusy(false);
                      return;
                    }
                    window.location.href = data.url;
                  } catch {
                    setPayError("Netværksfejl.");
                    setPayBusy(false);
                  }
                }}
              >
                {payBusy ? (
                  <>
                    <Loader2 size={15} className="mr-2 animate-spin" />
                    Åbner Stripe…
                  </>
                ) : (
                  <>
                    <Sparkles size={15} className="mr-2 text-[#faf8f5]" />
                    Betal med Stripe
                  </>
                )}
              </Button>
              <Button variant="secondary" fullWidth href="/shopping">
                <Package size={15} className="mr-2" />
                Tilbage til shop
              </Button>
            </div>

            <p className="text-center text-[11px] text-stone-500">
              Leveringsadresse: <span className="text-stone-700">{order.delivery_address}</span> —{" "}
              <Link href="/customer" className="font-medium text-[#6b4f0a] underline-offset-2 hover:underline">
                Redigér i Mit LOOMY
              </Link>
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
