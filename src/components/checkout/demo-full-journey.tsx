"use client";

/**
 * Simulated end-to-end purchase: pick payment → processing delay → status steps to delivered.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Check, CheckCircle2, Loader2, Package, Sparkles, Truck } from "lucide-react";
import type { OrderStatus } from "@/components/providers/lumi-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { springSoft } from "@/components/motion-config";
import type { DemoCheckoutSnapshot } from "@/lib/loomy/demo-checkout-storage";
import { loadDemoCheckoutSnapshot } from "@/lib/loomy/demo-checkout-storage";
import {
  DEMO_PAYMENT_LABELS,
  DEMO_PAYMENT_MS,
  DEMO_STEP_MS,
} from "@/lib/loomy/demo-checkout-simulation";

const STEPS: { status: OrderStatus; label: string; hint: string }[] = [
  { status: "order_placed", label: "Ordre modtaget", hint: "Vi bekræfter din betaling" },
  { status: "store_packing", label: "Butik pakker", hint: "Din ordre klargøres" },
  { status: "courier_pickup", label: "Bud henter", hint: "Kurér er på vej til butikken" },
  { status: "on_the_way", label: "På vej", hint: "Pakken er under transport" },
  { status: "delivered", label: "Leveret", hint: "Velbekomme — nyd dit køb" },
];

type Phase = "pick" | "processing" | "journey" | "done";

type DemoFullJourneyProps = {
  initialSnapshot: DemoCheckoutSnapshot;
  setDemoOrderStatus: (
    orderId: string,
    status: OrderStatus,
    options?: { simulatedPaymentMethod?: string },
  ) => void;
  reloadSnapshot: () => void;
};

export function DemoFullJourney({
  initialSnapshot,
  setDemoOrderStatus,
  reloadSnapshot,
}: DemoFullJourneyProps) {
  const reduceMotion = useReducedMotion();
  const [snap, setSnap] = useState(initialSnapshot);
  const [phase, setPhase] = useState<Phase>(() => {
    if (initialSnapshot.status === "delivered") return "done";
    if (initialSnapshot.status !== "order_placed") return "journey";
    return "pick";
  });
  const [method, setMethod] = useState<"mobilepay" | "apple_pay" | "card">("mobilepay");
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimers = useCallback(() => {
    for (const t of timersRef.current) {
      clearTimeout(t);
    }
    timersRef.current = [];
  }, []);

  useEffect(() => {
    return () => clearTimers();
  }, [clearTimers]);

  const statusIndex = STEPS.findIndex((s) => s.status === snap.status);
  const activeIdx = statusIndex >= 0 ? statusIndex : 0;

  const startSimulation = () => {
    if (snap.status !== "order_placed") return;
    setPhase("processing");
    clearTimers();
    const orderId = snap.orderId;
    const t1 = setTimeout(() => {
      setDemoOrderStatus(orderId, "store_packing", {
        simulatedPaymentMethod: method,
      });
      reloadSnapshot();
      setSnap(loadDemoCheckoutSnapshot() ?? { ...snap, status: "store_packing" });
      setPhase("journey");

      const chain: OrderStatus[] = ["courier_pickup", "on_the_way", "delivered"];
      let delay = DEMO_STEP_MS;
      for (const st of chain) {
        const t = setTimeout(() => {
          setDemoOrderStatus(orderId, st);
          reloadSnapshot();
          setSnap((prev) => loadDemoCheckoutSnapshot() ?? { ...prev, status: st });
          if (st === "delivered") {
            setPhase("done");
          }
        }, delay);
        timersRef.current.push(t);
        delay += DEMO_STEP_MS;
      }
    }, DEMO_PAYMENT_MS);
    timersRef.current.push(t1);
  };

  const showJourney = phase === "journey" || phase === "done" || snap.status !== "order_placed";

  return (
    <div className="space-y-6">
      <motion.section
        initial={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={springSoft}
        className="mb-2"
      >
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8b6914]">Checkout · Demo</p>
        <h1 className="mt-2 font-serif text-3xl font-medium tracking-tight text-stone-900">Simuler hele købet</h1>
        <p className="mt-3 max-w-lg text-sm leading-relaxed text-stone-600">
          Vælg betalingsmetode, oplev behandlingstid og følg ordren hele vejen til leveret — uden Supabase eller Stripe.
        </p>
      </motion.section>

      <Card className="border-[0.5px] border-stone-200/90 bg-white/95 p-5 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-500">Ordre</p>
            <p className="font-mono text-sm font-medium text-stone-900">{snap.orderId}</p>
          </div>
          <span className="rounded-full border-[0.5px] border-[#7c5a10]/30 bg-[#7c5a10]/10 px-3 py-1 text-[11px] font-medium text-[#6b4f0a]">
            {snap.storeName}
          </span>
        </div>
        <ul className="space-y-3">
          {snap.lines.map((line) => (
            <li
              key={line.id}
              className="flex gap-3 rounded-xl border-[0.5px] border-stone-100 bg-stone-50/80 p-3"
            >
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border-[0.5px] border-stone-200/80 bg-white">
                <Image src={line.imageUrl} alt="" fill className="object-cover" sizes="64px" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-stone-900">{line.productName}</p>
                <p className="text-xs text-stone-500">
                  Str. {line.size} · {line.qty} stk.
                </p>
                <p className="mt-1 text-sm tabular-nums text-stone-800">{line.unitPriceKr * line.qty} kr</p>
              </div>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex items-center justify-between border-t-[0.5px] border-stone-200/80 pt-4">
          <span className="text-xs font-medium uppercase tracking-[0.14em] text-stone-500">Total</span>
          <span className="font-serif text-2xl font-medium tabular-nums text-stone-900">{snap.subtotalKr} kr</span>
        </div>
      </Card>

      <Card className="border-[0.5px] border-stone-200/90 bg-gradient-to-br from-white to-stone-50/90 p-5 shadow-sm">
        <p className="text-sm font-medium text-stone-900">Levering</p>
        <p className="mt-1 text-xs leading-relaxed text-stone-600">{snap.deliveryAddress}</p>
        <Link
          href="/customer"
          className="mt-2 inline-block text-[11px] font-medium text-[#6b4f0a] underline-offset-2 hover:underline"
        >
          Redigér i Mit LOOMY
        </Link>
      </Card>

      {snap.status === "order_placed" && phase === "pick" ? (
        <Card className="space-y-4 border-[0.5px] border-stone-200/90 bg-white/95 p-5 shadow-sm">
          <p className="text-sm font-medium text-stone-900">Vælg betaling (demo)</p>
          <div className="grid gap-2 sm:grid-cols-3">
            {(
              [
                { id: "mobilepay" as const, title: "MobilePay", sub: "Dansk mobilbetaling" },
                { id: "apple_pay" as const, title: "Apple Pay", sub: "Hurtig godkendelse" },
                { id: "card" as const, title: "Kort", sub: "Visa, Mastercard …" },
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setMethod(opt.id)}
                className={`rounded-2xl border-[0.5px] p-3 text-left transition active:scale-[0.98] ${
                  method === opt.id
                    ? "border-[#7c5a10]/50 bg-[#faf8f5] ring-1 ring-[#7c5a10]/25"
                    : "border-stone-200 bg-white hover:border-stone-300"
                }`}
              >
                <p className="text-sm font-semibold text-stone-900">{opt.title}</p>
                <p className="mt-0.5 text-[11px] text-stone-500">{opt.sub}</p>
              </button>
            ))}
          </div>
          <Button fullWidth onClick={startSimulation} className="min-h-12">
            <Sparkles size={16} className="mr-2 text-[#faf8f5]" />
            Start simuleret betaling og levering
          </Button>
        </Card>
      ) : null}

      {phase === "processing" ? (
        <Card className="flex flex-col items-center gap-4 border-[0.5px] border-stone-200/90 bg-white/95 py-12 shadow-sm">
          <Loader2 className="animate-spin text-[#8b6914]" size={36} strokeWidth={1.5} />
          <div className="text-center">
            <p className="font-medium text-stone-900">Behandler betaling…</p>
            <p className="mt-1 text-sm text-stone-600">
              {DEMO_PAYMENT_LABELS[method]} — vent som ved en rigtig betaling ({Math.round(DEMO_PAYMENT_MS / 100) / 10}{" "}
              sek.)
            </p>
          </div>
        </Card>
      ) : null}

      {showJourney ? (
        <Card className="border-[0.5px] border-stone-200/90 bg-white/95 p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Truck size={18} className="text-[#8b6914]" aria-hidden />
            <p className="text-sm font-medium text-stone-900">Din ordre undervejs</p>
          </div>
          {snap.simulatedPaymentMethod ? (
            <p className="mb-4 text-xs text-stone-600">
              Betaling (simuleret):{" "}
              <span className="font-medium text-stone-800">
                {DEMO_PAYMENT_LABELS[snap.simulatedPaymentMethod] ?? snap.simulatedPaymentMethod}
              </span>
            </p>
          ) : null}
          <ol className="space-y-3">
            {STEPS.map((step, i) => {
              const done = i < activeIdx;
              const current = i === activeIdx;
              return (
                <li key={step.status} className="flex gap-3">
                  <span
                    className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-[0.5px] text-[11px] font-semibold ${
                      done
                        ? "border-emerald-400/80 bg-emerald-50 text-emerald-800"
                        : current
                          ? "border-[#7c5a10]/45 bg-[#faf8f5] text-[#6b4f0a]"
                          : "border-stone-200 bg-stone-50 text-stone-400"
                    }`}
                  >
                    {done ? <Check size={14} strokeWidth={2.5} /> : i + 1}
                  </span>
                  <div>
                    <p className={`text-sm font-medium ${current ? "text-stone-900" : "text-stone-700"}`}>
                      {step.label}
                    </p>
                    <p className="text-[11px] text-stone-500">{step.hint}</p>
                  </div>
                </li>
              );
            })}
          </ol>
          {phase === "journey" && snap.status !== "delivered" ? (
            <p className="mt-4 flex items-center gap-2 text-xs text-stone-500">
              <Loader2 size={14} className="animate-spin text-[#8b6914]" />
              Simulerer næste trin om ca. {Math.round(DEMO_STEP_MS / 1000)} sek.…
            </p>
          ) : null}
        </Card>
      ) : null}

      {phase === "done" || snap.status === "delivered" ? (
        <motion.div
          initial={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={springSoft}
        >
          <Card className="border-[0.5px] border-emerald-200/90 bg-emerald-50/90 p-6 text-center shadow-sm">
            <CheckCircle2 className="mx-auto mb-2 text-emerald-700" size={32} strokeWidth={1.5} />
            <p className="font-medium text-emerald-950">Levering fuldført (demo)</p>
            <p className="mt-2 text-sm text-emerald-900/90">
              Du har nu gennemført hele flowet som kunde. Se ordren under Mit LOOMY.
            </p>
            <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-center">
              <Button href="/customer">Mit LOOMY</Button>
              <Button variant="secondary" href="/shopping">
                <Package size={15} className="mr-2" />
                Shop videre
              </Button>
            </div>
          </Card>
        </motion.div>
      ) : null}

      {snap.status === "order_placed" && phase === "pick" ? (
        <p className="text-center text-[11px] text-stone-500">
          Med Supabase og Stripe erstattes dette af rigtig Checkout og webhook-opdateringer.
        </p>
      ) : null}
    </div>
  );
}
