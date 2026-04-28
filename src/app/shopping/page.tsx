"use client";

/**
 * LOOMY shopping v2: editorial marketplace with boutique-first curation.
 */
import { CheckCircle2, Clock3, Loader2, Package, ShieldCheck, Sparkles, X } from "lucide-react";
import Image from "next/image";
import { useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
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
import { springSoft } from "@/components/motion-config";

const categories = ["New In", "Emergency Outfits", "Shoes", "Accessories"];

const statusSteps: { id: OrderStatus; label: string; owner: string }[] = [
  { id: "order_placed", label: "Bestilt", owner: "Kunde" },
  { id: "store_packing", label: "Butik pakker", owner: "Butik" },
  { id: "courier_pickup", label: "Bud afhenter", owner: "Bud" },
  { id: "on_the_way", label: "På vej", owner: "Bud" },
  { id: "delivered", label: "Leveret", owner: "Alle" },
];

const modalSpring = { type: "spring" as const, stiffness: 400, damping: 34 };

export default function ShoppingPage() {
  const { stores, orders, placeOrder, loginAs } = useLumi();
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [query, setQuery] = useState("");
  const [loginMessage, setLoginMessage] = useState<string>("");
  const [feedback, setFeedback] = useState("");
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [feedbackError, setFeedbackError] = useState("");
  const [sendingFeedback, setSendingFeedback] = useState(false);
  const [loginBusy, setLoginBusy] = useState<"google" | "apple" | "magic" | null>(null);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [selected, setSelected] = useState<{ store: StoreData; product: Product } | null>(null);
  const [selectedSize, setSelectedSize] = useState<SizeKey | null>(null);
  const storeSectionRef = useRef<HTMLElement | null>(null);
  const reduceMotion = useReducedMotion();

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
    <div className="flex min-h-screen flex-col overflow-x-hidden text-stone-900">
      <LumiHeader />

      <main className="mx-auto w-full max-w-7xl flex-1 space-y-10 px-4 py-8 md:space-y-12 md:px-8 md:py-12">
        <motion.section
          initial={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={springSoft}
          className="relative overflow-hidden rounded-[2rem] border-[0.5px] border-stone-900/20 bg-[linear-gradient(140deg,#fdfcf9_0%,#f7f3ea_42%,#f4efe6_100%)] p-8 shadow-[0_24px_70px_rgba(28,25,23,0.09)] md:p-12"
        >
          <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#7c5a10]/[0.09] blur-3xl" />
          <div className="pointer-events-none absolute -bottom-16 left-1/4 h-48 w-48 rounded-full bg-stone-300/30 blur-3xl" />
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#8b6914]">
            Market Edit · LOOMY
          </p>
          <h1 className="mt-3 max-w-3xl font-serif text-3xl font-medium leading-tight tracking-tight md:text-5xl">
            Shop som i et digitalt atelier.
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-stone-600 md:text-base">
            Udvalgte boutiques, live størrelser og hurtig levering — designet til hurtige,
            sikre valg uden støj.
          </p>
          <div className="mt-5 inline-flex items-center rounded-full border-[0.5px] border-[#7c5a10]/30 bg-white/75 px-3 py-1 text-[11px] font-medium text-[#6b4f0a] backdrop-blur-sm">
            New: Curated capsule drops opdateres løbende
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button
              onClick={() =>
                storeSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
              }
            >
              Se butikker
            </Button>
            <Button variant="secondary" href="/">
              Til forsiden
            </Button>
          </div>
        </motion.section>

        <div className="grid gap-10 lg:grid-cols-[1.4fr_0.6fr] lg:gap-12">
          <div className="space-y-10">
            <section className="space-y-4">
              <h2 className="font-serif text-xl font-medium text-stone-900 md:text-2xl">Kategori</h2>
              <div className="flex flex-wrap gap-2">
                {["All", ...categories].map((category) => {
                  const active = selectedCategory === category;
                  return (
                    <motion.button
                      key={category}
                      type="button"
                      onClick={() => setSelectedCategory(category)}
                      whileTap={{ scale: 0.97 }}
                      transition={{ type: "spring", stiffness: 400, damping: 28 }}
                      className={`min-h-11 rounded-full border-[0.5px] px-4 text-xs font-medium transition ${
                        active
                          ? "border-stone-900 bg-stone-900 text-[#faf8f5] shadow-md"
                          : "border-stone-200/90 bg-white/90 text-stone-700 hover:border-stone-300 hover:bg-white"
                      }`}
                    >
                      {category === "All" ? "Alle" : category}
                    </motion.button>
                  );
                })}
              </div>
            </section>

            <section id="stores" className="space-y-5" ref={storeSectionRef}>
              <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
                <h2 className="font-serif text-xl font-medium text-stone-900 md:text-2xl">
                  Butikker i Indre By
                </h2>
                <label className="w-full sm:w-80">
                  <span className="sr-only">Søg produkter</span>
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    className="min-h-11 w-full rounded-xl border-[0.5px] border-stone-200/90 bg-white/90 px-4 text-sm text-stone-800 shadow-sm backdrop-blur-sm placeholder:text-stone-400 focus:border-stone-400 focus:outline-none focus:ring-2 focus:ring-[#8b6914]/20"
                    placeholder="Søg i kataloget…"
                  />
                </label>
              </div>

              {filteredStores.length === 0 ? (
                <Card className="flex flex-col items-center gap-4 border-dashed border-stone-300/80 bg-stone-50/50 py-14 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#8b6914]/10">
                    <Sparkles className="text-[#8b6914]" size={26} strokeWidth={1.5} />
                  </div>
                  <p className="max-w-sm font-medium text-stone-800">Ingen styles matcher lige nu</p>
                  <p className="max-w-md text-sm text-stone-600">
                    Prøv en anden kategori eller ryd søgefeltet — der er mere på vej fra vores
                    partnere.
                  </p>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setQuery("");
                      setSelectedCategory("All");
                    }}
                  >
                    Nulstil filtre
                  </Button>
                </Card>
              ) : (
                <div className="grid gap-6 md:grid-cols-2">
                  {filteredStores.map((storeItem) => (
                    <div key={storeItem.id} className="min-w-0">
                      <Card className="h-full border-[0.5px] border-stone-200/90 p-6 shadow-[0_12px_40px_rgba(28,25,23,0.05)]">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <p className="font-serif text-lg font-medium text-stone-900 md:text-xl">
                            {storeItem.name}
                          </p>
                          <span className="shrink-0 rounded-full border-[0.5px] border-[#8b6914]/25 bg-[#8b6914]/[0.08] px-3 py-1 text-xs font-medium text-[#6b4f0a]">
                            ~{storeItem.etaMinutes} min
                          </span>
                        </div>
                        <p className="mt-2 text-sm text-stone-600">
                          {storeItem.neighborhood} · {storeItem.address}
                        </p>
                        <p className="mt-1 text-xs text-stone-500">
                          {storeItem.rating.toFixed(1)} ★ fra kunder
                        </p>
                        <div className="mt-5 space-y-4">
                          {storeItem.products.map((product) => {
                            const totalStock = Object.values(product.sizes).reduce(
                              (sum, qty) => sum + qty,
                              0,
                            );
                            const stockTone =
                              totalStock === 0
                                ? "border-rose-200/80 bg-rose-50 text-rose-800"
                                : totalStock < 6
                                  ? "border-[#7c5a10]/30 bg-[#7c5a10]/10 text-[#5f4308]"
                                  : "border-emerald-200/80 bg-emerald-50 text-emerald-900";
                            const stockLabel =
                              totalStock === 0
                                ? "Udsolgt"
                                : totalStock < 6
                                  ? `Få tilbage (${totalStock})`
                                  : `${totalStock} på lager`;

                            return (
                              <motion.button
                                key={product.id}
                                type="button"
                                onClick={() => {
                                  setSelected({ store: storeItem, product });
                                  setSelectedSize(null);
                                }}
                                whileHover={reduceMotion ? undefined : { scale: 1.015 }}
                                whileTap={{ scale: 0.985 }}
                                transition={{ type: "spring", stiffness: 380, damping: 26 }}
                                className="w-full overflow-hidden rounded-2xl border-[0.5px] border-stone-200/90 bg-stone-50/50 p-3 text-left shadow-sm transition hover:border-[#7c5a10]/35 hover:bg-white hover:shadow-md"
                              >
                                <div className="relative mb-3 aspect-[4/3] overflow-hidden rounded-xl border-[0.5px] border-stone-200/80 bg-white">
                                  <Image
                                    src={product.imageUrl}
                                    alt={product.name}
                                    width={900}
                                    height={700}
                                    className="h-full w-full object-cover transition duration-500 ease-out hover:scale-[1.03]"
                                  />
                                </div>
                                <div className="flex items-start justify-between gap-2 px-0.5">
                                  <p className="text-sm font-medium text-stone-900">{product.name}</p>
                                  <p className="shrink-0 text-sm font-medium tabular-nums text-stone-800">
                                    {product.price} kr
                                  </p>
                                </div>
                                <p className="mt-1 px-0.5 text-xs leading-relaxed text-stone-600">
                                  {product.description}
                                </p>
                                <div className="mt-2 flex flex-wrap items-center justify-between gap-2 px-0.5">
                                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-500">
                                    {product.category}
                                  </p>
                                  <span
                                    className={`rounded-full border-[0.5px] px-2.5 py-0.5 text-[11px] font-medium ${stockTone}`}
                                  >
                                    {stockLabel}
                                  </span>
                                </div>
                              </motion.button>
                            );
                          })}
                        </div>
                      </Card>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          <div className="space-y-6 lg:sticky lg:top-24 lg:self-start">
            <Card className="border-[0.5px] border-stone-200/90 bg-gradient-to-b from-white to-stone-50/80 p-6 shadow-sm">
              <p className="mb-4 font-serif text-lg font-medium text-stone-900">Log ind som kunde</p>
              <div className="space-y-3">
                <Button
                  fullWidth
                  disabled={loginBusy !== null}
                  onClick={() => {
                    setLoginBusy("google");
                    loginAs("customer");
                    setLoginMessage("Velkommen — demo med Google.");
                    window.setTimeout(() => setLoginBusy(null), 420);
                  }}
                >
                  {loginBusy === "google" ? (
                    <Loader2 size={15} className="mr-2 animate-spin" />
                  ) : null}
                  Fortsæt med Google
                </Button>
                <Button
                  variant="secondary"
                  fullWidth
                  disabled={loginBusy !== null}
                  onClick={() => {
                    setLoginBusy("apple");
                    loginAs("customer");
                    setLoginMessage("Velkommen — demo med Apple.");
                    window.setTimeout(() => setLoginBusy(null), 420);
                  }}
                >
                  {loginBusy === "apple" ? (
                    <Loader2 size={15} className="mr-2 animate-spin" />
                  ) : null}
                  Fortsæt med Apple
                </Button>
                <Button
                  variant="secondary"
                  fullWidth
                  disabled={loginBusy !== null}
                  onClick={() => {
                    setLoginBusy("magic");
                    loginAs("customer");
                    setLoginMessage("Magic link sendt (demo).");
                    window.setTimeout(() => setLoginBusy(null), 420);
                  }}
                >
                  {loginBusy === "magic" ? (
                    <Loader2 size={15} className="mr-2 animate-spin" />
                  ) : null}
                  Send magic link
                </Button>
                {loginMessage ? (
                  <p className="rounded-xl border-[0.5px] border-emerald-200/80 bg-emerald-50/90 px-3 py-2.5 text-xs text-emerald-900">
                    {loginMessage}
                  </p>
                ) : null}
              </div>
            </Card>

            <Card className="border-[0.5px] border-stone-200/90 bg-white/95 p-6 shadow-sm">
              <h2 className="mb-4 font-serif text-lg font-medium text-stone-900">Live ordreflow</h2>
              <div className="space-y-4">
                {orders.length === 0 ? (
                  <div className="rounded-2xl border-[0.5px] border-dashed border-stone-200 bg-stone-50/60 px-4 py-8 text-center">
                    <Package className="mx-auto mb-3 text-stone-400" size={28} strokeWidth={1.25} />
                    <p className="text-sm text-stone-600">
                      Bestil fra et produkt for at se hele flowet — fra butik til bud.
                    </p>
                  </div>
                ) : (
                  orders.slice(0, 3).map((order) => (
                    <div
                      key={order.id}
                      className="rounded-2xl border-[0.5px] border-stone-200/90 bg-stone-50/50 p-4"
                    >
                      <p className="text-sm font-medium text-stone-900">Ordre {order.id}</p>
                      <p className="mt-1 text-xs text-stone-600">
                        Str. {order.size} · Antal {order.qty}
                      </p>
                      <div className="mt-3 space-y-2">
                        {statusSteps.map((step) => {
                          const reached =
                            statusSteps.findIndex((item) => item.id === order.status) >=
                            statusSteps.findIndex((item) => item.id === step.id);
                          return (
                            <div
                              key={`${order.id}-${step.id}`}
                              className={`rounded-xl border-[0.5px] p-2.5 ${
                                reached
                                  ? "border-emerald-200/90 bg-emerald-50/80"
                                  : "border-stone-200/80 bg-white/80"
                              }`}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <p className="text-xs font-medium text-stone-900">{step.label}</p>
                                {reached ? (
                                  <CheckCircle2 size={15} className="shrink-0 text-emerald-700" />
                                ) : (
                                  <Clock3 size={15} className="shrink-0 text-stone-400" />
                                )}
                              </div>
                              <p className="text-[10px] text-stone-500">{step.owner}</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>

            <Card className="border-[0.5px] border-stone-200/90 bg-white/95 p-6 shadow-sm">
              <h2 className="mb-3 font-serif text-lg font-medium text-stone-900">Tryg overdragelse</h2>
              <div className="flex items-start gap-3">
                <ShieldCheck size={18} className="mt-0.5 shrink-0 text-[#8b6914]" strokeWidth={1.75} />
                <p className="text-sm leading-relaxed text-stone-600">
                  Ordrer sendes straks til den rette butik og videre til et ledigt bud, når pakken er
                  klar.
                </p>
              </div>
            </Card>

            <Card id="feedback" className="border-[0.5px] border-stone-200/90 bg-white/95 p-6 shadow-sm">
              <h2 className="mb-3 font-serif text-lg font-medium text-stone-900">Feedback</h2>
              <textarea
                value={feedback}
                onChange={(event) => {
                  setFeedback(event.target.value);
                  setFeedbackSent(false);
                  setFeedbackError("");
                }}
                className="min-h-28 w-full rounded-xl border-[0.5px] border-stone-200/90 bg-white px-3 py-2.5 text-sm text-stone-800 placeholder:text-stone-400 focus:border-stone-400 focus:outline-none focus:ring-2 focus:ring-[#8b6914]/15"
                placeholder="Hvad kan vi gøre bedre?"
              />
              <Button
                className="mt-4"
                fullWidth
                disabled={sendingFeedback}
                onClick={async () => {
                  if (!feedback.trim()) {
                    setFeedbackError("Skriv gerne en kort besked, før du sender.");
                    return;
                  }
                  setFeedbackError("");
                  setSendingFeedback(true);
                  await new Promise((resolve) => window.setTimeout(resolve, 420));
                  setFeedbackSent(true);
                  setFeedback("");
                  setSendingFeedback(false);
                }}
              >
                {sendingFeedback ? <Loader2 size={15} className="mr-2 animate-spin" /> : null}
                Send feedback
              </Button>
              {feedbackError ? (
                <p className="mt-2 rounded-xl border-[0.5px] border-rose-200/80 bg-rose-50 px-3 py-2 text-xs text-rose-700">
                  {feedbackError}
                </p>
              ) : null}
              {feedbackSent ? (
                <p className="mt-3 rounded-xl border-[0.5px] border-emerald-200/80 bg-emerald-50 px-3 py-2 text-xs text-emerald-900">
                  Tak — vi bruger det til at gøre LOOMY bedre.
                </p>
              ) : null}
            </Card>
          </div>
        </div>
      </main>

      <AnimatePresence>
        {selected ? (
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="product-modal-title"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduceMotion ? 0.15 : 0.22 }}
            className="fixed inset-0 z-[60] flex items-end justify-center bg-stone-900/50 p-3 backdrop-blur-[2px] md:items-center"
            onClick={() => setSelected(null)}
          >
            <motion.div
              initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 28, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.98 }}
              transition={modalSpring}
              onClick={(e) => e.stopPropagation()}
              className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl border-[0.5px] border-stone-200/90 bg-[#faf8f5] shadow-[0_32px_80px_rgba(12,10,9,0.25)]"
            >
              <div className="flex items-start justify-between gap-4 border-b-[0.5px] border-stone-200/90 px-5 py-4 md:px-8">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-500">
                    {selected.store.name} · {selected.store.neighborhood}
                  </p>
                  <h3 id="product-modal-title" className="font-serif text-xl font-medium text-stone-900 md:text-2xl">
                    {selected.product.name}
                  </h3>
                </div>
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelected(null)}
                  className="flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-xl border-[0.5px] border-stone-200 bg-white text-stone-600 transition hover:bg-stone-50"
                  aria-label="Luk"
                >
                  <X size={18} />
                </motion.button>
              </div>

              <div className="grid gap-6 p-5 md:grid-cols-[1.05fr_0.95fr] md:gap-8 md:p-8">
                <div className="overflow-hidden rounded-2xl border-[0.5px] border-stone-200/90 bg-white">
                  <Image
                    src={selected.product.imageUrl}
                    alt={selected.product.name}
                    width={900}
                    height={700}
                    className="h-full min-h-56 w-full object-cover md:min-h-72"
                  />
                </div>
                <div className="space-y-4">
                  <p className="text-sm leading-relaxed text-stone-600">{selected.product.description}</p>
                  <p className="text-lg font-medium tabular-nums text-stone-900">{selected.product.price} kr</p>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-500">
                    {selected.product.category}
                  </p>

                  <div className="rounded-2xl border-[0.5px] border-stone-200/90 bg-white/80 p-4">
                    <p className="mb-3 text-sm font-medium text-stone-900">Størrelser</p>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {(Object.entries(selected.product.sizes) as [SizeKey, number][]).map(
                        ([size, amount]) => (
                          <motion.button
                            key={`modal-${selected.product.id}-${size}`}
                            type="button"
                            onClick={() => setSelectedSize(size)}
                            disabled={amount <= 0}
                            whileTap={amount > 0 ? { scale: 0.97 } : undefined}
                            className={`rounded-xl border-[0.5px] px-3 py-2.5 text-left text-xs transition ${
                              selectedSize === size
                                ? "border-stone-900 bg-stone-900 text-[#faf8f5]"
                                : amount > 0
                                  ? "border-stone-200 bg-white text-stone-800 hover:border-stone-300"
                                  : "cursor-not-allowed border-rose-200/80 bg-rose-50 text-rose-700"
                            }`}
                          >
                            <span className="block font-semibold">{size}</span>
                            <span>{amount <= 0 ? "Udsolgt" : `${amount} tilbage`}</span>
                          </motion.button>
                        ),
                      )}
                    </div>
                  </div>
                  <Button
                    fullWidth
                    disabled={!selectedSize || placingOrder}
                    onClick={() => {
                      if (!selectedSize) return;
                      setPlacingOrder(true);
                      placeOrder({
                        storeId: selected.store.id,
                        productId: selected.product.id,
                        size: selectedSize,
                      });
                      setPlacingOrder(false);
                      setSelected(null);
                    }}
                  >
                    {placingOrder ? (
                      <>
                        <Loader2 size={15} className="mr-2 animate-spin" />
                        Opretter ordre...
                      </>
                    ) : selectedSize ? (
                      `Bestil str. ${selectedSize}`
                    ) : (
                      "Vælg størrelse"
                    )}
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
