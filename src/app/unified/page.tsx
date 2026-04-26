"use client";

import { CheckCircle2, Clock3 } from "lucide-react";
import { LumiHeader } from "@/components/lumi-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLumi, type OrderStatus, type SizeKey } from "@/components/providers/lumi-provider";

const sizeKeys: SizeKey[] = ["XS", "S", "M", "L"];

const statusSteps: { id: OrderStatus; label: string }[] = [
  { id: "order_placed", label: "Order placed" },
  { id: "store_packing", label: "Store packing" },
  { id: "courier_pickup", label: "Courier pickup" },
  { id: "on_the_way", label: "On the way" },
  { id: "delivered", label: "Delivered" },
];

export default function UnifiedPage() {
  const {
    stores,
    couriers,
    orders,
    placeOrder,
    updateStock,
    progressOrderByStore,
    progressOrderByCourier,
  } = useLumi();

  return (
    <div className="min-h-screen text-slate-900">
      <LumiHeader />
      <main className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 md:px-6 md:py-10">
        <Card className="border border-slate-200 bg-white text-slate-900 shadow-sm">
          <h1 className="text-2xl font-bold">LUMI Unified Operations View</h1>
          <p className="mt-1 text-sm text-slate-600">
            One live view for Customer, Store, and Courier in the same flow.
          </p>
        </Card>

        <section className="grid gap-6 lg:grid-cols-3">
          <Card className="border border-slate-200 bg-white text-slate-900 shadow-sm">
            <h2 className="mb-3 text-lg font-semibold">Customer</h2>
            <div className="space-y-4">
              {stores.map((store) => (
                <div key={store.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <p className="font-semibold">{store.name}</p>
                  <p className="text-xs text-slate-600">
                    Rating {store.rating.toFixed(1)} • ETA {store.etaMinutes} min
                  </p>
                  {store.products.map((product) => (
                    <div key={product.id} className="mt-2 rounded-lg border border-slate-200 bg-white p-2">
                      <p className="text-sm font-medium">{product.name}</p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {Object.entries(product.sizes).map(([size, stock]) => (
                          <button
                            key={`${product.id}-${size}`}
                            disabled={stock <= 0}
                            onClick={() =>
                              placeOrder({
                                storeId: store.id,
                                productId: product.id,
                                size: size as SizeKey,
                              })
                            }
                            className={`rounded px-2 py-1 text-xs ${
                              stock > 0
                                ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                                : "cursor-not-allowed bg-rose-50 text-rose-700"
                            }`}
                          >
                            {size}: {stock} left
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </Card>

          <Card className="border border-slate-200 bg-white text-slate-900 shadow-sm">
            <h2 className="mb-3 text-lg font-semibold">Store</h2>
            <div className="space-y-4">
              {stores.map((store) => (
                <div key={store.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <p className="font-semibold">{store.name}</p>
                  {store.products.map((product) => (
                    <div key={product.id} className="mt-2 rounded-lg border border-slate-200 bg-white p-2">
                      <p className="text-sm font-medium">{product.name}</p>
                      <div className="mt-1 grid grid-cols-4 gap-1">
                        {sizeKeys.map((size) => (
                          <input
                            key={`${product.id}-${size}`}
                            type="number"
                            min={0}
                            value={product.sizes[size]}
                            onChange={(event) =>
                              updateStock({
                                storeId: store.id,
                                productId: product.id,
                                size,
                                quantity: Number(event.target.value),
                              })
                            }
                            className="rounded border border-slate-200 px-1 py-1 text-xs"
                            title={`${size} stock`}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ))}

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="mb-2 text-sm font-semibold">Store Actions</p>
                {orders
                  .filter((order) => order.status === "order_placed" || order.status === "store_packing")
                  .map((order) => (
                    <div key={order.id} className="mb-2 flex items-center justify-between rounded-lg bg-white p-2">
                      <span className="text-xs">{order.id}</span>
                      <Button variant="secondary" onClick={() => progressOrderByStore(order.id)}>
                        {order.status === "order_placed" ? "Pack" : "Ready"}
                      </Button>
                    </div>
                  ))}
              </div>
            </div>
          </Card>

          <Card className="border border-slate-200 bg-white text-slate-900 shadow-sm">
            <h2 className="mb-3 text-lg font-semibold">Courier + Live Flow</h2>
            <div className="space-y-3">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="mb-2 text-sm font-semibold">Courier Pool</p>
                {couriers.map((courier) => (
                  <div key={courier.id} className="mb-1 text-xs text-slate-700">
                    {courier.name} • {courier.zone} • {courier.status}
                  </div>
                ))}
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="mb-2 text-sm font-semibold">Courier Actions</p>
                {orders
                  .filter((order) => order.status === "courier_pickup" || order.status === "on_the_way")
                  .map((order) => (
                    <div key={order.id} className="mb-2 flex items-center justify-between rounded-lg bg-white p-2">
                      <span className="text-xs">{order.id}</span>
                      <Button variant="secondary" onClick={() => progressOrderByCourier(order.id)}>
                        {order.status === "courier_pickup" ? "Picked Up" : "Delivered"}
                      </Button>
                    </div>
                  ))}
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="mb-2 text-sm font-semibold">Order Timeline</p>
                {orders.length === 0 ? (
                  <p className="text-xs text-slate-600">No orders yet.</p>
                ) : (
                  orders.slice(0, 5).map((order) => (
                    <div key={order.id} className="mb-2 rounded-lg bg-white p-2">
                      <p className="text-xs font-semibold">{order.id}</p>
                      <div className="mt-1 space-y-1">
                        {statusSteps.map((step) => {
                          const done =
                            statusSteps.findIndex((x) => x.id === order.status) >=
                            statusSteps.findIndex((x) => x.id === step.id);
                          return (
                            <div key={`${order.id}-${step.id}`} className="flex items-center justify-between text-[11px]">
                              <span>{step.label}</span>
                              {done ? (
                                <CheckCircle2 size={12} className="text-emerald-600" />
                              ) : (
                                <Clock3 size={12} className="text-slate-400" />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </Card>
        </section>
      </main>
    </div>
  );
}
