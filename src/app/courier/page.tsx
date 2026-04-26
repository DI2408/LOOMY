"use client";

import { Bike, CheckCircle2, Sparkles, Zap } from "lucide-react";
import Link from "next/link";
import { LumiHeader } from "@/components/lumi-header";
import { Card } from "@/components/ui/card";
import { useLumi } from "@/components/providers/lumi-provider";
import { SlideAction } from "@/components/ui/slide-action";

export default function CourierPage() {
  const { couriers, orders, progressOrderByCourier, role, partnerProfile } = useLumi();
  const activeCourierId =
    partnerProfile?.role === "courier" ? partnerProfile.courierId : undefined;

  if (role !== "courier") {
    return (
      <div className="min-h-screen text-stone-900">
        <LumiHeader />
        <main className="mx-auto w-full max-w-7xl px-4 py-10 md:px-6">
          <Card className="border border-stone-200 bg-white text-stone-900 shadow-sm">
            <h1 className="text-xl font-bold">Courier access required</h1>
            <p className="mt-2 text-sm text-stone-600">
              Please sign in from the dedicated courier login page.
            </p>
            <Link
              href="/login/courier"
              className="mt-3 inline-flex rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm font-semibold text-stone-800"
            >
              Go to Courier Login
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
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_right,#faf8f5_0%,#faf8f5_45%,#ffffff_100%)] text-stone-900">
      <LumiHeader />
      <main className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-6 md:grid-cols-[0.8fr_1.2fr] md:px-6 md:py-10">
        <Card className="border border-stone-200 bg-white/90 text-stone-900 shadow-sm">
          <h1 className="mb-3 text-xl font-bold">Courier Hub</h1>
          <div className="space-y-2">
            {visibleCouriers.map((courier) => (
              <div
                key={courier.id}
                className="rounded-xl border border-stone-200 bg-stone-50 p-3"
              >
                <p className="font-semibold">{courier.name}</p>
                <p className="text-xs text-stone-600">
                  {courier.zone} • ETA {courier.etaMinutes} min
                </p>
                <span
                  className={`mt-2 inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                    courier.status === "available"
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {courier.status === "available" ? "Available" : "On Delivery"}
                </span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="border border-stone-200 bg-white/90 text-stone-900 shadow-[0_12px_30px_-24px_rgba(15,23,42,0.7)]">
          <div className="mb-4 rounded-2xl border border-stone-200/90 bg-gradient-to-r from-[#faf8f5] via-white to-stone-100 p-4">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-[#8b6914]" />
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-700">
                Smart Dispatch Board
              </p>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <Bike size={20} className="text-[#8b6914]" />
              <h2 className="text-2xl font-bold tracking-tight">Courier Tasks</h2>
              <span className="rounded-full bg-stone-900 px-2.5 py-1 text-xs font-semibold text-white">
                {activeOrders.length} active
              </span>
            </div>
            <p className="mt-2 text-sm text-stone-600">
              Swipe cards forward to push each delivery to the next live status.
            </p>
          </div>
          <div className="mb-3 flex items-center gap-2">
            <Bike size={18} className="text-[#8b6914]" />
            <h3 className="text-lg font-semibold">Task queue</h3>
          </div>
          {activeOrders.length === 0 ? (
            <p className="text-sm text-stone-600">No active courier tasks right now.</p>
          ) : (
            <div className="space-y-3">
              {activeOrders.map((order) => (
                <div
                  key={order.id}
                  className="rounded-2xl border border-stone-200 bg-gradient-to-br from-stone-50 to-white p-4 shadow-sm"
                >
                  {(() => {
                    const isPickupStep = order.status === "courier_pickup";
                    const isDeliveryStep = order.status === "on_the_way";
                    return (
                      <>
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-base font-bold">{order.id}</p>
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#8b6914]/15 px-2 py-1 text-xs font-semibold text-[#6b4f0a]">
                      <Zap size={12} />
                      {order.status.replaceAll("_", " ")}
                    </span>
                  </div>
                  <div className="mb-3 grid gap-2 rounded-xl border border-stone-200 bg-white p-3">
                    <div className="flex items-center gap-2 text-xs">
                      {isPickupStep ? (
                        <span className="h-2 w-2 rounded-full bg-[#8b6914]" />
                      ) : (
                        <span className="inline-flex animate-pulse items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                          <CheckCircle2 size={11} />
                          Completed
                        </span>
                      )}
                      <p className="font-semibold text-stone-700">
                        Step 1: Pickup at store {isPickupStep ? "(active)" : "(completed)"}
                      </p>
                    </div>
                    <p className="text-xs text-stone-600">Store: {order.storeName}</p>
                    <p className="text-xs text-stone-600">Address: {order.storeAddress}</p>
                    <p className="text-xs text-stone-600">
                      Product: {order.productName} - Size {order.size}
                    </p>
                  </div>

                  <div
                    className={`mb-2 grid gap-2 rounded-xl border p-3 transition ${
                      isDeliveryStep
                        ? "border-stone-200 bg-stone-50/90"
                        : "border-stone-200 bg-stone-100/70 opacity-70"
                    }`}
                  >
                    <div className="flex items-center gap-2 text-xs">
                      {isDeliveryStep ? (
                        <span className="h-2 w-2 animate-pulse rounded-full bg-stone-800" />
                      ) : (
                        <span className="h-2 w-2 rounded-full bg-stone-300" />
                      )}
                      <p className="font-semibold text-stone-700">
                        Step 2: Deliver to customer {isDeliveryStep ? "(active)" : "(locked until pickup)"}
                      </p>
                    </div>
                    <p className="text-xs text-stone-600">Customer: {order.customerName}</p>
                    <p className="text-xs text-stone-600">Dropoff: {order.customerAddress}</p>
                    <p className="text-xs text-stone-600">
                      Nearby ETA: {order.nearbyEtaMinutes} min
                    </p>
                  </div>
                  <div className="mt-3">
                    <SlideAction
                      label={
                        isPickupStep
                          ? "Slide to confirm pickup"
                          : "Slide to confirm delivery"
                      }
                      onComplete={() => progressOrderByCourier(order.id)}
                    />
                    {isDeliveryStep ? (
                      <p className="mt-2 text-xs font-semibold text-[#8b6914]">
                        Pickup complete. Final step unlocked.
                      </p>
                    ) : null}
                  </div>
                      </>
                    );
                  })()}
                </div>
              ))}
            </div>
          )}
          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">
            <div className="flex items-center gap-2 font-semibold">
              <CheckCircle2 size={14} />
              Customer updates are automatic
            </div>
            <p className="mt-1">
              Every courier status update is reflected instantly in the customer flow.
            </p>
          </div>
        </Card>
      </main>
    </div>
  );
}
