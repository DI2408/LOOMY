"use client";

import { useMemo, useState } from "react";
import {
  Activity,
  CalendarDays,
  CircleAlert,
  DollarSign,
  PackageCheck,
  RotateCw,
  ShoppingBag,
  TrendingUp,
  Users,
} from "lucide-react";
import Link from "next/link";
import { LumiHeader } from "@/components/lumi-header";
import { Card } from "@/components/ui/card";
import { useLumi, type SizeKey } from "@/components/providers/lumi-provider";
import { SlideAction } from "@/components/ui/slide-action";

const sizes: SizeKey[] = ["XS", "S", "M", "L"];
type DateRange = "7d" | "30d" | "all";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("da-DK", { style: "currency", currency: "DKK", maximumFractionDigits: 0 }).format(
    value,
  );
}

export default function StorePage() {
  const { stores, orders, updateStock, progressOrderByStore, role, partnerProfile } = useLumi();
  const [range, setRange] = useState<DateRange>("30d");
  const activeStoreId = partnerProfile?.role === "store" ? partnerProfile.storeId : undefined;
  const activeStores = activeStoreId
    ? stores.filter((store) => store.id === activeStoreId)
    : stores;
  const activeOrders = orders.filter(
    (order) =>
      (order.status === "order_placed" || order.status === "store_packing") &&
      (!activeStoreId || order.storeId === activeStoreId),
  );
  const allStoreOrders = orders.filter((order) => !activeStoreId || order.storeId === activeStoreId);
  const anchorTime = useMemo(() => {
    if (allStoreOrders.length === 0) return 0;
    return Math.max(...allStoreOrders.map((order) => order.createdAt));
  }, [allStoreOrders]);
  const rangeStart = useMemo(() => {
    if (range === "all") return 0;
    const days = range === "7d" ? 7 : 30;
    return anchorTime - days * 24 * 60 * 60 * 1000;
  }, [anchorTime, range]);
  const filteredOrders = allStoreOrders.filter((order) => order.createdAt >= rangeStart);
  const productPrices = useMemo(() => {
    const priceMap = new Map<string, number>();
    for (const store of activeStores) {
      for (const product of store.products) {
        priceMap.set(product.id, product.price);
      }
    }
    return priceMap;
  }, [activeStores]);

  const dashboard = useMemo(() => {
    const productSales = new Map<string, { name: string; qty: number }>();
    let liveStockUnits = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;

    for (const store of activeStores) {
      for (const product of store.products) {
        const totalUnits = sizes.reduce((sum, size) => sum + product.sizes[size], 0);
        liveStockUnits += totalUnits;
        if (totalUnits === 0) outOfStockCount += 1;
        else if (totalUnits <= 5) lowStockCount += 1;
      }
    }

    let revenue = 0;
    for (const order of filteredOrders) {
      const current = productSales.get(order.productId) ?? { name: order.productName, qty: 0 };
      current.qty += order.qty;
      productSales.set(order.productId, current);
      revenue += (productPrices.get(order.productId) ?? 0) * order.qty;
    }

    const topProducts = [...productSales.values()]
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 3);

    const totalOrders = filteredOrders.length;
    const completedOrders = filteredOrders.filter((order) => order.status === "delivered").length;
    const conversionRate = totalOrders > 0 ? Math.round((completedOrders / totalOrders) * 100) : 0;
    const estimatedViews = totalOrders * 26 + activeStores.length * 140 + 420;
    const avgOrderValue = totalOrders > 0 ? revenue / totalOrders : 0;

    const trendBase = anchorTime;
    if (trendBase === 0) {
      const emptyTrend = [
        { label: "Mon", count: 0 },
        { label: "Tue", count: 0 },
        { label: "Wed", count: 0 },
        { label: "Thu", count: 0 },
        { label: "Fri", count: 0 },
        { label: "Sat", count: 0 },
        { label: "Sun", count: 0 },
      ];
      return {
        totalOrders,
        completedOrders,
        conversionRate,
        estimatedViews,
        revenue,
        avgOrderValue,
        liveStockUnits,
        lowStockCount,
        outOfStockCount,
        topProducts,
        orderTrend: emptyTrend,
        maxTrendCount: 1,
      };
    }
    const dayLabels = Array.from({ length: 7 }, (_, index) => {
      const d = new Date(trendBase - (6 - index) * 24 * 60 * 60 * 1000);
      return d.toLocaleDateString("da-DK", { weekday: "short" });
    });
    const orderTrend = dayLabels.map((label, index) => {
      const dayStart = new Date(trendBase - (6 - index) * 24 * 60 * 60 * 1000);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = dayStart.getTime() + 24 * 60 * 60 * 1000;
      const count = filteredOrders.filter(
        (order) => order.createdAt >= dayStart.getTime() && order.createdAt < dayEnd,
      ).length;
      return { label, count };
    });
    const maxTrendCount = Math.max(1, ...orderTrend.map((entry) => entry.count));

    return {
      totalOrders,
      completedOrders,
      conversionRate,
      estimatedViews,
      revenue,
      avgOrderValue,
      liveStockUnits,
      lowStockCount,
      outOfStockCount,
      topProducts,
      orderTrend,
      maxTrendCount,
    };
  }, [activeStores, anchorTime, filteredOrders, productPrices]);

  if (role !== "store") {
    return (
      <div className="min-h-screen text-stone-900">
        <LumiHeader />
        <main className="mx-auto w-full max-w-7xl px-4 py-10 md:px-6">
          <Card className="border border-stone-200 bg-white text-stone-900 shadow-sm">
            <h1 className="text-xl font-bold">Store access required</h1>
            <p className="mt-2 text-sm text-stone-600">
              Please sign in from the dedicated store login page.
            </p>
            <Link
              href="/login/store"
              className="mt-3 inline-flex rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm font-semibold text-stone-800"
            >
              Go to Store Login
            </Link>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_right,#faf8f5_0%,#faf8f5_45%,#ffffff_100%)] text-stone-900">
      <LumiHeader />
      <main className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-6 md:grid-cols-[1.2fr_0.8fr] md:px-6 md:py-10">
        <section className="space-y-4">
          <div className="rounded-2xl border border-stone-200/90 bg-white/80 p-5 shadow-[0_12px_30px_-20px_rgba(30,41,59,0.45)] backdrop-blur">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-[#8b6914]">Store Operations Center</p>
                <h1 className="mt-2 text-2xl font-bold text-stone-900">KPI Dashboard</h1>
              </div>
              <div className="inline-flex items-center gap-1 rounded-xl border border-stone-200 bg-white p-1">
                {(["7d", "30d", "all"] as DateRange[]).map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setRange(option)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                      range === option
                        ? "bg-stone-900 text-white shadow-sm"
                        : "text-stone-600 hover:bg-stone-100"
                    }`}
                  >
                    {option === "all" ? "All time" : option.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
            <p className="mt-2 text-sm text-stone-600">
              Real-time overview of orders, top-selling items, inventory risk, and product interest.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <Card className="border border-stone-200 bg-white/90 p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">Total Orders</p>
                <ShoppingBag size={16} className="text-[#8b6914]" />
              </div>
              <p className="mt-3 text-2xl font-bold">{dashboard.totalOrders}</p>
              <p className="mt-1 text-xs text-stone-500">{dashboard.completedOrders} delivered</p>
            </Card>
            <Card className="border border-stone-200 bg-white/90 p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">Top Conversion</p>
                <TrendingUp size={16} className="text-emerald-500" />
              </div>
              <p className="mt-3 text-2xl font-bold">{dashboard.conversionRate}%</p>
              <p className="mt-1 text-xs text-stone-500">Orders completed end-to-end</p>
            </Card>
            <Card className="border border-stone-200 bg-white/90 p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">Product Views</p>
                <Users size={16} className="text-[#8b6914]" />
              </div>
              <p className="mt-3 text-2xl font-bold">{dashboard.estimatedViews.toLocaleString()}</p>
              <p className="mt-1 text-xs text-stone-500">Estimated unique visits (30d)</p>
            </Card>
            <Card className="border border-stone-200 bg-white/90 p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">Revenue</p>
                <DollarSign size={16} className="text-[#8b6914]" />
              </div>
              <p className="mt-3 text-2xl font-bold">{formatCurrency(dashboard.revenue)}</p>
              <p className="mt-1 text-xs text-stone-500">
                Avg order: {formatCurrency(dashboard.avgOrderValue)}
              </p>
            </Card>
            <Card className="border border-stone-200 bg-white/90 p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">Live Stock</p>
                <Activity size={16} className="text-stone-600" />
              </div>
              <p className="mt-3 text-2xl font-bold">{dashboard.liveStockUnits}</p>
              <p className="mt-1 text-xs text-stone-500">
                {dashboard.lowStockCount} low stock · {dashboard.outOfStockCount} sold out
              </p>
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="border border-stone-200 bg-white/85 shadow-sm">
              <div className="flex items-center gap-2">
                <TrendingUp size={16} className="text-[#8b6914]" />
                <h2 className="text-lg font-semibold">Top-selling products</h2>
              </div>
              <p className="mt-1 text-xs text-stone-500">Based on current date filter</p>
              <div className="mt-4 space-y-2">
                {dashboard.topProducts.length === 0 ? (
                  <p className="text-sm text-stone-600">No completed sales data yet.</p>
                ) : (
                  dashboard.topProducts.map((item, index) => (
                    <div
                      key={`${item.name}-${index}`}
                      className="flex items-center justify-between rounded-xl border border-stone-200 bg-stone-50 px-3 py-2"
                    >
                      <p className="text-sm font-semibold text-stone-800">{item.name}</p>
                      <span className="rounded-full bg-[#8b6914]/15 px-2 py-1 text-xs font-semibold text-[#6b4f0a]">
                        {item.qty} sold
                      </span>
                    </div>
                  ))
                )}
              </div>
            </Card>
            <Card className="border border-stone-200 bg-white/85 shadow-sm">
              <div className="flex items-center gap-2">
                <CalendarDays size={16} className="text-[#8b6914]" />
                <h2 className="text-lg font-semibold">Order trend</h2>
              </div>
              <p className="mt-1 text-xs text-stone-500">Last 7 days performance</p>
              <div className="mt-4 flex items-end gap-2">
                {dashboard.orderTrend.map((entry) => (
                  <div key={entry.label} className="flex flex-1 flex-col items-center gap-1">
                    <div className="text-[10px] font-semibold text-stone-500">{entry.count}</div>
                    <div className="flex h-24 w-full items-end rounded-md bg-stone-100 p-1">
                      <div
                        className="w-full rounded bg-gradient-to-t from-stone-800 to-amber-600"
                        style={{
                          height: `${Math.max(10, (entry.count / dashboard.maxTrendCount) * 100)}%`,
                        }}
                      />
                    </div>
                    <div className="text-[10px] text-stone-500">{entry.label}</div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
          <Card className="border border-amber-200 bg-amber-50/80 shadow-sm">
            <div className="flex items-start gap-2">
              <CircleAlert size={16} className="mt-0.5 text-amber-600" />
              <div>
                <h2 className="text-sm font-semibold text-amber-800">Inventory automation</h2>
                <p className="mt-1 text-xs text-amber-700">
                  Use quick restock on low/out sizes to keep your bestseller items always available.
                </p>
              </div>
            </div>
          </Card>

          {activeStores.map((store) => (
            <Card
              key={store.id}
              className="border border-stone-200 bg-white/90 text-stone-900 shadow-[0_12px_30px_-24px_rgba(15,23,42,0.7)]"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="font-serif text-xl font-medium tracking-tight">{store.name}</h2>
                  <p className="text-xs text-stone-500">{store.address}</p>
                </div>
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  Lager live
                </span>
              </div>

              <div className="mt-4 rounded-2xl border border-stone-200 bg-stone-50/70 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-500">
                  Hurtig handling
                </p>
                <p className="mt-1 text-xs text-stone-600">
                  Tryk <span className="font-medium">- / +</span> for små justeringer, eller skriv et præcist
                  tal i feltet. Lagerstatus opdateres med det samme.
                </p>
              </div>

              <div className="mt-4 space-y-4">
                {store.products.map((product) => (
                  <div
                    key={product.id}
                    className="rounded-2xl border border-stone-200 bg-gradient-to-br from-stone-50 to-white p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-semibold text-stone-900">{product.name}</p>
                      <span className="rounded-full bg-stone-100 px-2.5 py-1 text-[11px] font-semibold text-stone-600">
                        {sizes.reduce((sum, size) => sum + product.sizes[size], 0)} stk
                      </span>
                    </div>

                    <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                      {sizes.map((size) => {
                        const qty = product.sizes[size];
                        const tone =
                          qty === 0
                            ? "bg-rose-100 text-rose-700"
                            : qty <= 2
                              ? "bg-amber-100 text-amber-700"
                              : "bg-emerald-100 text-emerald-700";
                        const label = qty === 0 ? "Udsolgt" : qty <= 2 ? "Få tilbage" : "På lager";

                        return (
                          <div
                            key={`${product.id}-${size}`}
                            className="rounded-xl border border-stone-200 bg-white p-3 text-xs shadow-sm"
                          >
                            <div className="mb-2 flex items-center justify-between">
                              <span className="text-sm font-semibold text-stone-800">{size}</span>
                              <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${tone}`}>
                                {label}
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  void updateStock({
                                    storeId: store.id,
                                    productId: product.id,
                                    size,
                                    quantity: Math.max(0, qty - 1),
                                  })
                                }
                                className="inline-flex min-h-9 min-w-9 items-center justify-center rounded-lg border border-stone-200 bg-stone-50 text-sm font-semibold text-stone-700 transition hover:bg-stone-100 active:scale-95"
                                aria-label={`Sænk lager for ${product.name} ${size}`}
                              >
                                -
                              </button>

                              <input
                                type="number"
                                min={0}
                                value={qty}
                                onChange={(event) =>
                                  void updateStock({
                                    storeId: store.id,
                                    productId: product.id,
                                    size,
                                    quantity: Number(event.target.value),
                                  })
                                }
                                className="min-h-9 w-full rounded-lg border border-stone-200 px-2 text-center text-sm font-semibold text-stone-800 focus:border-[#8b6914]/40 focus:outline-none"
                                aria-label={`Lagerantal for ${product.name} ${size}`}
                              />

                              <button
                                type="button"
                                onClick={() =>
                                  void updateStock({
                                    storeId: store.id,
                                    productId: product.id,
                                    size,
                                    quantity: qty + 1,
                                  })
                                }
                                className="inline-flex min-h-9 min-w-9 items-center justify-center rounded-lg border border-stone-200 bg-stone-50 text-sm font-semibold text-stone-700 transition hover:bg-stone-100 active:scale-95"
                                aria-label={`Øg lager for ${product.name} ${size}`}
                              >
                                +
                              </button>
                            </div>

                            <button
                              type="button"
                              onClick={() =>
                                void updateStock({
                                  storeId: store.id,
                                  productId: product.id,
                                  size,
                                  quantity: qty + 5,
                                })
                              }
                              className="mt-2 inline-flex w-full items-center justify-center gap-1 rounded-lg border border-stone-200 bg-stone-50 px-2 py-1.5 text-[10px] font-semibold text-stone-700 transition hover:bg-stone-100"
                            >
                              <RotateCw size={10} />
                              Hurtig opfyldning +5
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </section>

        <section className="space-y-4">
          <Card className="border border-stone-200 bg-white/90 text-stone-900 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <PackageCheck size={18} className="text-[#8b6914]" />
              <h2 className="text-lg font-semibold">Incoming Orders</h2>
            </div>
            <div className="space-y-3">
              {activeOrders.length === 0 ? (
                <p className="text-sm text-stone-600">No orders waiting for store action.</p>
              ) : (
                activeOrders.map((order) => (
                    <div key={order.id} className="rounded-xl border border-stone-200 bg-stone-50 p-3">
                      <p className="text-sm font-semibold">{order.id}</p>
                      <p className="text-xs text-stone-600">Store: {order.storeName}</p>
                      <p className="text-xs text-stone-600">
                        Customer: {order.customerName} - {order.customerAddress}
                      </p>
                      <p className="text-xs text-stone-600">
                        Product: {order.productName} - Size {order.size}
                      </p>
                      <p className="mb-2 text-xs text-stone-600">
                        Current step: {order.status.replaceAll("_", " ")}
                      </p>
                      <SlideAction
                        label={
                          order.status === "order_placed"
                            ? "Acceptér og start pakning"
                            : "Pakken er klar til bud"
                        }
                        hint={
                          order.status === "order_placed"
                            ? "Træk til højre for at gå i gang med ordren"
                            : "Træk til højre når pakken kan afhentes"
                        }
                        onComplete={() => void progressOrderByStore(order.id)}
                      />
                    </div>
                  ))
              )}
            </div>
          </Card>
        </section>
      </main>
    </div>
  );
}
