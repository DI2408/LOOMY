"use client";

/**
 * LOOMY checkout: editorial summary + secure Stripe handoff.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { Loader2, Lock, Package, Sparkles } from "lucide-react";
import { LumiHeader } from "@/components/lumi-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useLumi } from "@/components/providers/lumi-provider";
import { getSupabaseClient } from "@/lib/supabase/client";
import { springSoft } from "@/components/motion-config";

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
  currency: string;
  delivery_address: string;
  stores?: { name: string } | { name: string }[] | null;
  order_items?: OrderItemRow[] | null;
};

export default function CheckoutPage() {
  const reduceMotion = useReducedMotion();
  const searchParams = useSearchParams();
  const orderIdParam = searchParams.get("order_id") ?? "";
  const checkoutFlag = searchParams.get("checkout") ?? "";

  const { stores, supabaseDataMode, authUserId } = useLumi();
  const [order, setOrder] = useState<OrderRow | null>(null);
  const [loadError, setLoadError] = useState("");
  const [payBusy, setPayBusy] = useState(false);
  const [payError, setPayError] = useState("");

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
      setLoadError("Log ind for at se checkout.");
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
          currency,
          delivery_address,
          stores ( name ),
          order_items ( product_id, product_name, size, qty, unit_price_minor )
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
    queueMicrotask(() => {
      void loadOrder();
    });
  }, [loadOrder]);

  useEffect(() => {
    if (checkoutFlag !== "cancel" || !orderIdParam) return;
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
  }, [checkoutFlag, orderIdParam, loadOrder]);

  const items = order?.order_items ?? [];
  const storeName = useMemo(() => {
    const s = order?.stores;
    if (!s) return "";
    return Array.isArray(s) ? s[0]?.name ?? "" : s.name ?? "";
  }, [order?.stores]);

  const subtotalKr = order?.total_minor != null ? Math.round(order.total_minor / 100) : 0;

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
            Gennemse din kurv som ordre, og fuldfør med Stripe. Butikken kan først pakke, når betalingen er gennemført.
          </p>
        </motion.section>

        {!supabaseDataMode || !authUserId ? (
          <Card className="border-[0.5px] border-stone-200/90 bg-white/95 p-8 text-center shadow-sm">
            <p className="text-sm text-stone-600">Log ind som kunde for at betale.</p>
            <Button className="mt-4" href="/login/customer">
              Kundelogin
            </Button>
          </Card>
        ) : loadError ? (
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
            </p>
            <Button variant="secondary" className="mt-4" href="/shopping">
              Tilbage til shop
            </Button>
          </Card>
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
              <div className="mt-4 flex items-center justify-between border-t-[0.5px] border-stone-200/80 pt-4">
                <span className="text-xs font-medium uppercase tracking-[0.14em] text-stone-500">Total</span>
                <span className="font-serif text-2xl font-medium tabular-nums text-stone-900">{subtotalKr} kr</span>
              </div>
            </Card>

            <Card className="border-[0.5px] border-stone-200/90 bg-gradient-to-br from-white to-stone-50/90 p-5 shadow-sm">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-[0.5px] border-stone-200 bg-white">
                  <Lock size={18} className="text-[#7c5a10]" aria-hidden />
                </span>
                <div>
                  <p className="text-sm font-medium text-stone-900">Krypteret betaling</p>
                  <p className="mt-1 text-xs leading-relaxed text-stone-600">
                    Du sendes til Stripe Checkout. LOOMY behandler aldrig kortdata i browseren.
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
                      setPayError(data.error ?? "Kunne ikke starte betaling.");
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
