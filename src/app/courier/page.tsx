"use client";

import { Bike, CheckCircle2, MapPin, Package, Sparkles, User, Zap } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { LumiHeader } from "@/components/lumi-header";
import { Card } from "@/components/ui/card";
import { useLumi } from "@/components/providers/lumi-provider";
import { SlideAction } from "@/components/ui/slide-action";
import { springSoft } from "@/components/motion-config";

const statusDa: Record<string, string> = {
  courier_pickup: "Klar til afhentning",
  on_the_way: "På vej til kunde",
};

export default function CourierPage() {
  const { couriers, orders, progressOrderByCourier, role, partnerProfile } = useLumi();
  const activeCourierId =
    partnerProfile?.role === "courier" ? partnerProfile.courierId : undefined;

  if (role !== "courier") {
    return (
      <div className="flex min-h-screen flex-col bg-[radial-gradient(circle_at_top_right,#faf8f5_0%,#f6f4ef_50%,#ffffff_100%)] text-stone-900">
        <LumiHeader />
        <main className="mx-auto w-full max-w-lg flex-1 px-4 py-12 md:px-6">
          <Card className="border-[0.5px] border-stone-200/90 bg-white/95 p-8 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#7c5a10]/10">
              <Bike className="text-[#7c5a10]" size={28} strokeWidth={1.75} />
            </div>
            <h1 className="font-serif text-2xl font-medium tracking-tight">Bud-adgang påkrævet</h1>
            <p className="mt-3 text-sm leading-relaxed text-stone-600">
              Log ind som bud for at se dagens ture og bekræfte afhentning og levering.
            </p>
            <Link
              href="/login/courier"
              className="mt-6 inline-flex min-h-11 items-center justify-center rounded-xl border-[0.5px] border-stone-900 bg-stone-900 px-6 text-sm font-medium text-[#faf8f5] shadow-md transition hover:bg-stone-800 active:scale-[0.98]"
            >
              Gå til budlogin
            </Link>
          </Card>
        </main>
      </div>
    );
  }

  const activeOrders = orders.filter(
    (order) =>
      (order.status === "courier_pickup" || order.status === "on_the_way") &&
      (!activeCourierId || order.courierId === activeCourierId),
  );
  const visibleCouriers = activeCourierId
    ? couriers.filter((courier) => courier.id === activeCourierId)
    : couriers;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_right,#faf8f5_0%,#f6f4ef_45%,#ffffff_100%)] text-stone-900">
      <LumiHeader />
      <main className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-6 md:grid-cols-[minmax(0,320px)_1fr] md:gap-10 md:px-8 md:py-10">
        <Card className="h-fit border-[0.5px] border-stone-200/90 bg-white/95 p-6 shadow-[0_16px_48px_rgba(28,25,23,0.06)]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#7c5a10]">Dit hold</p>
          <h1 className="mt-2 font-serif text-2xl font-medium tracking-tight">Bud-hub</h1>
          <div className="mt-5 space-y-3">
            {visibleCouriers.map((courier) => (
              <div
                key={courier.id}
                className="rounded-2xl border-[0.5px] border-stone-200/80 bg-stone-50/80 p-4"
              >
                <p className="font-medium text-stone-900">{courier.name}</p>
                <p className="mt-1 text-xs text-stone-600">
                  {courier.zone} · ca. {courier.etaMinutes} min
                </p>
                <span
                  className={`mt-3 inline-flex rounded-full border-[0.5px] px-2.5 py-1 text-[11px] font-semibold ${
                    courier.status === "available"
                      ? "border-emerald-200/90 bg-emerald-50 text-emerald-800"
                      : "border-amber-200/90 bg-amber-50 text-amber-900"
                  }`}
                >
                  {courier.status === "available" ? "Ledig" : "Under levering"}
                </span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="border-[0.5px] border-stone-200/90 bg-white/95 shadow-[0_20px_56px_rgba(28,25,23,0.08)]">
          <div className="rounded-2xl border-[0.5px] border-stone-200/70 bg-gradient-to-br from-[#faf8f5] via-white to-stone-50/90 p-5 md:p-6">
            <div className="flex flex-wrap items-center gap-2">
              <Sparkles size={17} className="text-[#7c5a10]" strokeWidth={1.75} />
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-stone-600">
                Dagens ruter
              </p>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <Bike size={22} className="text-[#7c5a10]" strokeWidth={1.75} />
              <h2 className="font-serif text-2xl font-medium tracking-tight md:text-3xl">
                Aktive ture
              </h2>
              <span className="rounded-full bg-stone-900 px-3 py-1 text-xs font-semibold text-[#faf8f5]">
                {activeOrders.length} aktiv{activeOrders.length === 1 ? "" : "e"}
              </span>
            </div>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-stone-600">
              Træk skyderen til højre for at bekræfte afhentning eller levering — ét tryk ad gangen.
            </p>
          </div>

          <div className="border-t-[0.5px] border-stone-100 p-5 md:p-6">
            <h3 className="mb-4 flex items-center gap-2 font-serif text-lg font-medium text-stone-900">
              <Package size={18} className="text-[#7c5a10]" strokeWidth={1.75} />
              Kø
            </h3>
            {activeOrders.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-stone-200 bg-stone-50/60 px-6 py-12 text-center">
                <Bike className="mx-auto mb-3 text-stone-300" size={36} strokeWidth={1.25} />
                <p className="font-medium text-stone-800">Ingen aktive ture lige nu</p>
                <p className="mt-2 text-sm text-stone-600">
                  Når en ordre er klar til afhentning, dukker den op her.
                </p>
              </div>
            ) : (
              <div className="space-y-5">
                {activeOrders.map((order, idx) => (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ ...springSoft, delay: idx * 0.05 }}
                    className="rounded-2xl border-[0.5px] border-stone-200/90 bg-gradient-to-br from-white to-stone-50/50 p-4 shadow-sm md:p-5"
                  >
                    {(() => {
                      const isPickupStep = order.status === "courier_pickup";
                      const isDeliveryStep = order.status === "on_the_way";
                      const statusLabel =
                        statusDa[order.status] ?? order.status.replaceAll("_", " ");
                      return (
                        <>
                          <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
                            <div>
                              <p className="font-mono text-sm font-semibold text-stone-900">{order.id}</p>
                              <p className="mt-1 text-[11px] text-stone-500">
                                ca. {order.nearbyEtaMinutes} min til området
                              </p>
                            </div>
                            <span className="inline-flex items-center gap-1 rounded-full border-[0.5px] border-[#7c5a10]/25 bg-[#7c5a10]/10 px-2.5 py-1 text-[11px] font-semibold text-[#5f4308]">
                              <Zap size={12} strokeWidth={2} aria-hidden />
                              {statusLabel}
                            </span>
                          </div>

                          <div className="mb-3 space-y-3 rounded-xl border-[0.5px] border-stone-200/80 bg-white p-4">
                            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                              <MapPin size={14} className="text-[#7c5a10]" aria-hidden />
                              Trin 1 · Afhentning
                            </div>
                            <div className="flex items-start gap-2 text-xs">
                              {isPickupStep ? (
                                <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#7c5a10]" aria-hidden />
                              ) : (
                                <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-emerald-600" aria-hidden />
                              )}
                              <div className="space-y-1">
                                <p className="font-medium text-stone-800">{order.storeName}</p>
                                <p className="text-stone-600">{order.storeAddress}</p>
                                <p className="text-stone-500">
                                  {order.productName} · str. {order.size}
                                </p>
                              </div>
                            </div>
                          </div>

                          <div
                            className={`mb-4 space-y-3 rounded-xl border-[0.5px] p-4 transition ${
                              isDeliveryStep
                                ? "border-stone-300/90 bg-white shadow-sm"
                                : "border-stone-200/60 bg-stone-100/50 opacity-75"
                            }`}
                          >
                            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                              <User size={14} className="text-[#7c5a10]" aria-hidden />
                              Trin 2 · Levering
                            </div>
                            <div className="flex items-start gap-2 text-xs">
                              {isDeliveryStep ? (
                                <span className="mt-1 h-2 w-2 shrink-0 animate-pulse rounded-full bg-stone-800" aria-hidden />
                              ) : (
                                <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-stone-300" aria-hidden />
                              )}
                              <div className="space-y-1">
                                <p className="font-medium text-stone-800">{order.customerName}</p>
                                <p className="text-stone-600">{order.customerAddress}</p>
                                {!isDeliveryStep ? (
                                  <p className="text-[11px] text-stone-500">
                                    Låses op når afhentning er bekræftet.
                                  </p>
                                ) : null}
                              </div>
                            </div>
                          </div>

                          <SlideAction
                            label={
                              isPickupStep
                                ? "Bekræft afhentning i butikken"
                                : "Bekræft levering til kunden"
                            }
                            hint={
                              isPickupStep
                                ? "Træk hele vejen til højre når du har pakken"
                                : "Træk til højre når pakken er afleveret"
                            }
                            onComplete={() => void progressOrderByCourier(order.id)}
                          />
                          {isDeliveryStep ? (
                            <p className="mt-3 text-center text-[11px] font-medium text-[#7c5a10]">
                              Afhentning bekræftet — sidste skridt.
                            </p>
                          ) : null}
                        </>
                      );
                    })()}
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          <div className="mx-5 mb-6 rounded-2xl border-[0.5px] border-emerald-200/90 bg-emerald-50/90 p-4 text-xs text-emerald-900 md:mx-6">
            <div className="flex items-center gap-2 font-semibold">
              <CheckCircle2 size={15} strokeWidth={2} />
              Kunden ser status live
            </div>
            <p className="mt-1.5 leading-relaxed opacity-95">
              Hvert skridt synes med det samme i kunde-flowet — ingen ekstra beskeder nødvendige.
            </p>
          </div>
        </Card>
      </main>
    </div>
  );
}
