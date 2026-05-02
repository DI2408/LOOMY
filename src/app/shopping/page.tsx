"use client";

import { CheckCircle2, Clock3, ShieldCheck, X } from "lucide-react";
import Image from "next/image";
import { useMemo, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LumiHeader } from "@/components/lumi-header";
import {
  useLumi,
  type OrderStatus,
  type Product,
  type SizeKey,
  type StoreData,
} from "@/components/providers/lumi-provider";

const categories = ["New In", "Emergency Outfits", "Shoes", "Accessories"];

const statusSteps: { id: OrderStatus; label: string; owner: string }[] = [
  { id: "order_placed", label: "Order placed", owner: "Customer App" },
  { id: "store_packing", label: "Store confirms & packs", owner: "Store Partner" },
  { id: "courier_pickup", label: "Courier pickup", owner: "Courier App" },
  { id: "on_the_way", label: "On the way", owner: "Courier App" },
  { id: "delivered", label: "Delivered", owner: "Customer + Store" },
];

export default function ShoppingPage() {
  const { stores, orders, placeOrder, loginAs } = useLumi();
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [query, setQuery] = useState("");
  const [loginMessage, setLoginMessage] = useState<string>("");
  const [feedback, setFeedback] = useState("");
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [selected, setSelected] = useState<{ store: StoreData; product: Product } | null>(null);
  const [selectedSize, setSelectedSize] = useState<SizeKey | null>(null);
  const storeSectionRef = useRef<HTMLElement | null>(null);

  const filteredStores = useMemo(() => {
    return stores
      .map((store) => {
        const products = store.products.filter((product) => {
          const categoryMatch =
            selectedCategory === "All" || product.category === selectedCategory;
          const queryMatch =
            query.trim().length === 0 ||
            product.name.toLowerCase().includes(query.toLowerCase()) ||
            product.description.toLowerCase().includes(query.toLowerCase());
          return categoryMatch && queryMatch;
        });
        return { ...store, products };
      })
      .filter((store) => store.products.length > 0);
  }, [stores, selectedCategory, query]);

  return (
    <div className="min-h-screen text-slate-900">
      <LumiHeader />

      <main className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 md:px-6 md:py-10">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <h1 className="text-2xl font-black md:text-4xl">Shopping</h1>
          <p className="mt-2 text-sm text-slate-600 md:text-base">
            Alle butikker og valgmuligheder samlet i ét shopping-vindue.
          </p>
          <div className="mt-4">
            <Button
              onClick={() =>
                storeSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
              }
            >
              Go to Stores
            </Button>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.45fr_0.55fr]">
          <div className="space-y-6">
            <section className="space-y-3">
              <h2 className="text-xl font-bold text-slate-900">Categories</h2>
              <div className="flex flex-wrap gap-2">
                {["All", ...categories].map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
                      selectedCategory === category
                        ? "bg-slate-900 text-white"
                        : "border border-slate-300 bg-white text-slate-700"
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </section>

            <section id="stores" className="space-y-3" ref={storeSectionRef}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-xl font-bold text-slate-900">Indre By Boutiques</h2>
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 md:w-80"
                  placeholder="Search products in catalog..."
                />
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {filteredStores.map((storeItem) => (
                  <div key={storeItem.id}>
                    <Card className="border border-slate-200 bg-white text-slate-900 shadow-sm">
                      <div className="flex items-center justify-between">
                        <p className="text-lg font-semibold">{storeItem.name}</p>
                        <span className="rounded-full bg-[#fff3ed] px-2 py-1 text-xs font-medium text-[#c86436]">
                          {storeItem.etaMinutes} min
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-slate-600">
                        {storeItem.neighborhood} • {storeItem.address}
                      </p>
                      <p className="mt-1 text-sm text-slate-600">Rating {storeItem.rating.toFixed(1)}</p>
                      {storeItem.products.map((product) => {
                        const totalStock = Object.values(product.sizes).reduce(
                          (sum, qty) => sum + qty,
                          0,
                        );
                        const stockTone =
                          totalStock === 0
                            ? "bg-rose-100 text-rose-700"
                            : totalStock < 6
                              ? "bg-amber-100 text-amber-700"
                              : "bg-emerald-100 text-emerald-700";
                        const stockLabel =
                          totalStock === 0
                            ? "Sold out"
                            : totalStock < 6
                              ? `Low stock (${totalStock})`
                              : `${totalStock} in stock`;

                        return (
                          <button
                            key={product.id}
                            onClick={() => {
                              setSelected({ store: storeItem, product });
                              setSelectedSize(null);
                            }}
                            className="mt-3 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-left transition hover:border-slate-300 hover:bg-slate-100"
                          >
                            <div className="mb-2 aspect-[4/3] overflow-hidden rounded-lg border border-slate-200 bg-white">
                              <Image
                                src={product.imageUrl}
                                alt={product.name}
                                width={900}
                                height={700}
                                className="h-full w-full object-cover"
                              />
                            </div>
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-semibold text-slate-800">{product.name}</p>
                              <p className="text-sm font-semibold text-slate-700">{product.price} DKK</p>
                            </div>
                            <p className="mt-1 text-xs text-slate-600">{product.description}</p>
                            <div className="mt-2 flex items-center justify-between">
                              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                                {product.category}
                              </p>
                              <span
                                className={`rounded-full px-2 py-1 text-[11px] font-semibold ${stockTone}`}
                              >
                                {stockLabel}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </Card>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <div className="space-y-4">
            <Card className="border border-slate-200 bg-white text-slate-900 shadow-sm">
              <p className="mb-3 text-sm font-semibold">Customer Login</p>
              <div className="space-y-3">
                <Button
                  fullWidth
                  onClick={() => {
                    loginAs("customer");
                    setLoginMessage("Signed in with Google.");
                  }}
                >
                  Continue with Google
                </Button>
                <Button
                  variant="secondary"
                  fullWidth
                  className="border border-slate-300 bg-white text-slate-800"
                  onClick={() => {
                    loginAs("customer");
                    setLoginMessage("Signed in with Apple.");
                  }}
                >
                  Continue with Apple
                </Button>
                <Button
                  variant="secondary"
                  fullWidth
                  className="border border-slate-300 bg-white text-slate-800"
                  onClick={() => {
                    loginAs("customer");
                    setLoginMessage("Magic link sent (demo).");
                  }}
                >
                  Send Magic Link
                </Button>
                {loginMessage ? (
                  <p className="rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
                    {loginMessage}
                  </p>
                ) : null}
              </div>
            </Card>

            <Card className="border border-slate-200 bg-white text-slate-900 shadow-sm">
              <h2 className="mb-3 text-lg font-bold">Live Order Flow</h2>
              <div className="space-y-4">
                {orders.length === 0 ? (
                  <p className="text-sm text-slate-600">
                    Place an order from a product card to start the full automated flow.
                  </p>
                ) : (
                  orders.slice(0, 3).map((order) => (
                    <div
                      key={order.id}
                      className="rounded-xl border border-slate-200 bg-slate-50 p-3"
                    >
                      <p className="mb-2 text-sm font-semibold">Order {order.id}</p>
                      <p className="mb-2 text-xs text-slate-600">
                        Product size: {order.size} • Qty: {order.qty}
                      </p>
                      <div className="space-y-2">
                        {statusSteps.map((step) => {
                          const reached =
                            statusSteps.findIndex((item) => item.id === order.status) >=
                            statusSteps.findIndex((item) => item.id === step.id);
                          return (
                            <div
                              key={`${order.id}-${step.id}`}
                              className={`rounded-lg border p-2 ${
                                reached
                                  ? "border-emerald-200 bg-emerald-50"
                                  : "border-slate-200 bg-white"
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <p className="text-xs font-semibold">{step.label}</p>
                                {reached ? (
                                  <CheckCircle2 size={14} className="text-emerald-600" />
                                ) : (
                                  <Clock3 size={14} className="text-slate-500" />
                                )}
                              </div>
                              <p className="text-[11px] text-slate-600">Owner: {step.owner}</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>

            <Card className="border border-slate-200 bg-white text-slate-900 shadow-sm">
              <h2 className="mb-3 text-lg font-bold">Automatic Handoff</h2>
              <div className="space-y-2">
                <div className="flex items-center gap-2 font-semibold">
                  <ShieldCheck size={14} />
                  Automatic handoff enabled
                </div>
                <p className="mt-1 text-sm text-slate-600">
                  Orders are routed instantly to the responsible store, then handed to
                  an available courier when packing is complete.
                </p>
              </div>
            </Card>

            <Card id="feedback" className="border border-slate-200 bg-white text-slate-900 shadow-sm">
              <h2 className="mb-3 text-lg font-bold">Feedback</h2>
              <textarea
                value={feedback}
                onChange={(event) => {
                  setFeedback(event.target.value);
                  setFeedbackSent(false);
                }}
                className="min-h-24 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800"
                placeholder="Del gerne din feedback om oplevelsen..."
              />
              <Button
                className="mt-3"
                fullWidth
                onClick={() => {
                  if (!feedback.trim()) return;
                  setFeedbackSent(true);
                  setFeedback("");
                }}
              >
                Send feedback
              </Button>
              {feedbackSent ? (
                <p className="mt-2 rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
                  Tak for din feedback! Vi bruger den til at forbedre LOOMY.
                </p>
              ) : null}
            </Card>
          </div>
        </section>
      </main>

      {selected ? (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-slate-900/55 p-3 md:items-center">
          <div className="w-full max-w-3xl rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 md:px-6">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  {selected.store.name} • {selected.store.neighborhood}
                </p>
                <h3 className="text-lg font-bold text-slate-900">{selected.product.name}</h3>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="rounded-lg border border-slate-300 p-2 text-slate-600 hover:bg-slate-100"
              >
                <X size={16} />
              </button>
            </div>

            <div className="grid gap-4 p-4 md:grid-cols-[1.1fr_0.9fr] md:p-6">
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                <Image
                  src={selected.product.imageUrl}
                  alt={selected.product.name}
                  width={900}
                  height={700}
                  className="h-full min-h-64 w-full object-cover"
                />
              </div>
              <div className="space-y-3">
                <p className="text-sm text-slate-600">{selected.product.description}</p>
                <p className="text-sm font-semibold text-slate-800">{selected.product.price} DKK</p>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {selected.product.category}
                </p>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <p className="mb-2 text-sm font-semibold">Sizes and stock</p>
                  <div className="grid grid-cols-2 gap-2">
                    {(Object.entries(selected.product.sizes) as [SizeKey, number][]).map(
                      ([size, amount]) => (
                        <button
                          key={`modal-${selected.product.id}-${size}`}
                          onClick={() => setSelectedSize(size)}
                          disabled={amount <= 0}
                          className={`rounded-lg border px-3 py-2 text-left text-xs ${
                            selectedSize === size
                              ? "border-slate-900 bg-slate-900 text-white"
                              : amount > 0
                                ? "border-slate-300 bg-white text-slate-800 hover:bg-slate-100"
                                : "cursor-not-allowed border-rose-200 bg-rose-50 text-rose-700"
                          }`}
                        >
                          <span className="block font-semibold">{size}</span>
                          <span>{amount} left</span>
                        </button>
                      ),
                    )}
                  </div>
                </div>
                <Button
                  fullWidth
                  onClick={() => {
                    if (!selectedSize) return;
                    void placeOrder({
                      storeId: selected.store.id,
                      productId: selected.product.id,
                      size: selectedSize,
                    });
                    setSelected(null);
                  }}
                  disabled={!selectedSize}
                >
                  {selectedSize ? `Order size ${selectedSize}` : "Select size to order"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
