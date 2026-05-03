"use client";

/**
 * LOOMY cart: glass drawer, spring motion, thumb-friendly controls.
 */
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Loader2, Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { useLumi } from "@/components/providers/lumi-provider";
import { springSoft } from "@/components/motion-config";
import { computeOrderPricingBreakdown } from "@/lib/loomy/pricing-display";

const drawerSpring = { type: "spring" as const, stiffness: 420, damping: 36 };

type CartDrawerProps = {
  /** Close overlapping menus (e.g. header "Mere") when opening cart */
  onOpen?: () => void;
};

export function CartDrawer({ onOpen }: CartDrawerProps) {
  const reduceMotion = useReducedMotion();
  const {
    cartOpen,
    setCartOpen,
    cartLines,
    cartItemCount,
    cartSubtotalKr,
    updateCartQty,
    removeCartLine,
    placeCartOrder,
    supabaseDataMode,
    authUserId,
  } = useLumi();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const cartSubtotalMinor = cartSubtotalKr * 100;
  const cartPricing = computeOrderPricingBreakdown(cartSubtotalMinor);
  const [portalReady, setPortalReady] = useState(false);

  useLayoutEffect(() => {
    queueMicrotask(() => {
      setPortalReady(true);
    });
  }, []);

  const drawerLayer = (
    <AnimatePresence>
      {cartOpen ? (
        <motion.div
          key="loomy-cart-layer"
          role="presentation"
          className="pointer-events-none fixed inset-0 z-[2147483000] isolate"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduceMotion ? 0.1 : 0.18 }}
        >
          <motion.button
            type="button"
            aria-label="Luk kurv"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduceMotion ? 0.12 : 0.2 }}
            className="pointer-events-auto absolute inset-0 bg-stone-900/45 backdrop-blur-[2px]"
            onClick={() => setCartOpen(false)}
          />
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-labelledby="cart-drawer-title"
            initial={reduceMotion ? { x: "100%" } : { x: "100%", opacity: 0.98 }}
            animate={{ x: 0, opacity: 1 }}
            exit={reduceMotion ? { x: "100%" } : { x: "100%", opacity: 0.98 }}
            transition={drawerSpring}
            className="pointer-events-auto absolute inset-y-0 right-0 z-10 flex w-full max-w-md flex-col border-l-[0.5px] border-stone-200/90 bg-[#faf8f5]/95 shadow-[0_0_60px_rgba(28,25,23,0.12)] backdrop-blur-xl"
          >
            <div className="flex items-center justify-between border-b-[0.5px] border-stone-200/90 px-5 py-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#8b6914]">LOOMY</p>
                <h2 id="cart-drawer-title" className="font-serif text-lg font-medium text-stone-900">
                  Din kurv
                </h2>
              </div>
              <motion.button
                type="button"
                whileTap={{ scale: 0.95 }}
                onClick={() => setCartOpen(false)}
                className="flex min-h-11 min-w-11 items-center justify-center rounded-xl border-[0.5px] border-stone-200 bg-white text-stone-600 transition hover:bg-stone-50"
                aria-label="Luk"
              >
                <X size={18} />
              </motion.button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
              {cartLines.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border-[0.5px] border-dashed border-stone-200 bg-white/80 px-6 py-14 text-center">
                  <ShoppingBag className="text-stone-300" size={36} strokeWidth={1.25} aria-hidden />
                  <p className="text-sm text-stone-600">Kurven er tom — find noget lækkert i shoppen.</p>
                  <Button variant="secondary" href="/shopping" onClick={() => setCartOpen(false)}>
                    Gå til shop
                  </Button>
                </div>
              ) : (
                <ul className="space-y-3">
                  {cartLines.map((line, index) => (
                    <motion.li
                      key={line.id}
                      initial={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ ...springSoft, delay: index * 0.04 }}
                      className="flex gap-3 rounded-2xl border-[0.5px] border-stone-200/90 bg-white/95 p-3 shadow-sm"
                    >
                      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border-[0.5px] border-stone-200/80 bg-stone-100">
                        <Image
                          src={line.imageUrl}
                          alt=""
                          fill
                          className="object-cover"
                          sizes="80px"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-stone-900">{line.productName}</p>
                        <p className="text-[11px] text-stone-500">
                          {line.storeName} · Str. {line.size}
                        </p>
                        <p className="mt-1 text-sm tabular-nums text-stone-800">
                          {line.unitPriceKr * line.qty} kr
                        </p>
                        <div className="mt-2 flex items-center gap-2">
                          <motion.button
                            type="button"
                            whileTap={{ scale: 0.92 }}
                            onClick={() => updateCartQty(line.id, line.qty - 1)}
                            className="flex h-9 w-9 items-center justify-center rounded-lg border-[0.5px] border-stone-200 bg-stone-50 text-stone-700"
                            aria-label="Mindre"
                          >
                            <Minus size={14} />
                          </motion.button>
                          <span className="min-w-8 text-center text-sm font-semibold tabular-nums">{line.qty}</span>
                          <motion.button
                            type="button"
                            whileTap={{ scale: 0.92 }}
                            onClick={() => updateCartQty(line.id, line.qty + 1)}
                            className="flex h-9 w-9 items-center justify-center rounded-lg border-[0.5px] border-stone-200 bg-stone-50 text-stone-700"
                            aria-label="Flere"
                          >
                            <Plus size={14} />
                          </motion.button>
                          <motion.button
                            type="button"
                            whileTap={{ scale: 0.92 }}
                            onClick={() => removeCartLine(line.id)}
                            className="ml-auto flex h-9 w-9 items-center justify-center rounded-lg border-[0.5px] border-rose-200/80 bg-rose-50 text-rose-700"
                            aria-label="Fjern"
                          >
                            <Trash2 size={14} />
                          </motion.button>
                        </div>
                      </div>
                    </motion.li>
                  ))}
                </ul>
              )}
            </div>

            {cartLines.length > 0 ? (
              <div className="border-t-[0.5px] border-stone-200/90 bg-[#f6f4ef]/90 px-5 py-4 backdrop-blur-md">
                <div className="mb-3 space-y-1.5 text-xs text-stone-600">
                  <div className="flex justify-between gap-3">
                    <span>Varer (inkl. moms)</span>
                    <span className="tabular-nums font-medium text-stone-900">{cartSubtotalKr} kr</span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span>Fragt</span>
                    <span className="tabular-nums font-medium text-stone-900">{cartPricing.deliveryKr} kr</span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span>Heraf moms (25 %)</span>
                    <span className="tabular-nums">{cartPricing.vatKr} kr</span>
                  </div>
                </div>
                <div className="mb-3 flex items-baseline justify-between border-t-[0.5px] border-stone-200/80 pt-3">
                  <span className="text-xs font-medium uppercase tracking-[0.16em] text-stone-500">Total inkl. moms</span>
                  <span className="font-serif text-xl font-medium tabular-nums text-stone-900">
                    {cartPricing.totalKr} kr
                  </span>
                </div>
                {error ? (
                  <p className="mb-2 rounded-xl border-[0.5px] border-rose-200/80 bg-rose-50 px-3 py-2 text-xs text-rose-800">
                    {error}
                  </p>
                ) : null}
                <Button
                  fullWidth
                  disabled={busy || (supabaseDataMode && !authUserId)}
                  onClick={async () => {
                    setError("");
                    if (supabaseDataMode && !authUserId) {
                      setError("Log ind som kunde for at gennemføre køb.");
                      return;
                    }
                    setBusy(true);
                    const res = await placeCartOrder();
                    setBusy(false);
                    if (!res.ok) {
                      setError(res.error);
                      return;
                    }
                    setCartOpen(false);
                    window.location.href = `/checkout?order_id=${encodeURIComponent(res.order.id)}`;
                  }}
                >
                  {busy ? (
                    <>
                      <Loader2 size={15} className="mr-2 animate-spin" />
                      Opretter ordre…
                    </>
                  ) : (
                    "Gå til betaling"
                  )}
                </Button>
                <p className="mt-2 text-center text-[11px] text-stone-500">
                  {supabaseDataMode ? (
                    authUserId ? (
                      "Du sendes til checkout — betal med Stripe eller fuldfør demo."
                    ) : (
                      <span className="block">
                        Log ind som kunde for at betale med Stripe.{" "}
                        <Link
                          href={`/login/customer?next=${encodeURIComponent("/shopping")}`}
                          className="font-medium text-[#6b4f0a] underline-offset-2 hover:underline"
                        >
                          Gå til login
                        </Link>
                      </span>
                    )
                  ) : (
                    "Demo uden Supabase: checkout med simuleret betaling."
                  )}
                </p>
              </div>
            ) : null}
          </motion.aside>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );

  return (
    <>
      <motion.button
        type="button"
        whileTap={{ scale: 0.96 }}
        transition={drawerSpring}
        onClick={() => {
          onOpen?.();
          setCartOpen(true);
        }}
        className="relative flex min-h-11 min-w-11 items-center justify-center rounded-xl border-[0.5px] border-stone-200/90 bg-white/90 text-stone-800 shadow-sm backdrop-blur-sm transition hover:bg-white"
        aria-label={`Kurv, ${cartItemCount} varer`}
      >
        <ShoppingBag size={18} strokeWidth={1.75} className="text-[#7c5a10]" aria-hidden />
        {cartItemCount > 0 ? (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-stone-900 px-1 text-[10px] font-semibold text-[#faf8f5]">
            {cartItemCount > 9 ? "9+" : cartItemCount}
          </span>
        ) : null}
      </motion.button>

      {portalReady && typeof document !== "undefined"
        ? createPortal(drawerLayer, document.body)
        : null}
    </>
  );
}
