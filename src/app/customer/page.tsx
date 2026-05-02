"use client";

/**
 * LOOMY customer profile hub with luxe, mobile-first UX.
 */
import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Check, Loader2, Package, Sparkles, Truck, UserRound } from "lucide-react";
import { z } from "zod";
import { LumiHeader } from "@/components/lumi-header";
import { useLumi, type OrderData } from "@/components/providers/lumi-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { springSoft } from "@/components/motion-config";
import { orderTrackingSteps, paymentStatusLabelDa } from "@/lib/loomy/customer-order-ui";

const profileSchema = z.object({
  name: z.string().trim().min(2, "Indtast dit fulde navn."),
  email: z.string().trim().email("Indtast en gyldig e-mail."),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[0-9\s-]{8,}$/, "Indtast et gyldigt telefonnummer."),
  address: z.string().trim().min(8, "Indtast en fuld leveringsadresse."),
});

type FieldErrors = Partial<Record<keyof z.infer<typeof profileSchema>, string>>;

function CustomerOrderCard({
  order,
  emphasizePayment,
}: {
  order: OrderData;
  emphasizePayment?: boolean;
}) {
  const reduceMotion = useReducedMotion();
  const { steps, activeIndex, paidAwaitingFulfillment } = orderTrackingSteps(order);
  const payLabel = paymentStatusLabelDa(order.paymentStatus);
  const lines = order.itemLines ?? [
    { productId: order.productId, productName: order.productName, size: order.size, qty: order.qty },
  ];
  const totalKr = order.totalMinor != null ? Math.round(order.totalMinor / 100) : null;

  return (
    <Card className="border-[0.5px] border-stone-200/90 bg-white/95 p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-mono text-[11px] font-medium text-stone-500">{order.id}</p>
          <p className="mt-1 text-sm font-medium text-stone-900">{order.storeName}</p>
        </div>
        <div className="flex flex-wrap justify-end gap-1.5">
          {payLabel ? (
            <span
              className={`rounded-full border-[0.5px] px-2.5 py-1 text-[11px] font-medium ${
                order.paymentStatus === "succeeded"
                  ? "border-emerald-300/80 bg-emerald-50 text-emerald-900"
                  : order.paymentStatus === "requires_payment"
                    ? "border-amber-300/70 bg-amber-50 text-amber-950"
                    : "border-stone-200 bg-stone-50 text-stone-700"
              }`}
            >
              {payLabel}
            </span>
          ) : null}
          <span className="rounded-full border-[0.5px] border-stone-200 bg-stone-50 px-2.5 py-1 text-[11px] text-stone-700">
            {order.status.replaceAll("_", " ")}
          </span>
        </div>
      </div>

      {emphasizePayment && paidAwaitingFulfillment ? (
        <p className="mt-3 rounded-xl border-[0.5px] border-[#7c5a10]/25 bg-[#7c5a10]/8 px-3 py-2 text-xs text-[#5c4308]">
          Betaling er gennemført — butikken kan nu pakke din ordre.
        </p>
      ) : null}

      <div className="mt-4 overflow-x-auto pb-1">
        <ol className="flex min-w-[min(100%,520px)] gap-1">
          {steps.map((step, i) => {
            const done = i < activeIndex;
            const current = i === activeIndex;
            return (
              <motion.li
                key={step.status}
                initial={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...springSoft, delay: i * 0.03 }}
                className="flex min-w-0 flex-1 flex-col items-center gap-1 text-center"
              >
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-[0.5px] text-[11px] font-semibold ${
                    done
                      ? "border-emerald-400/80 bg-emerald-50 text-emerald-800"
                      : current
                        ? "border-[#7c5a10]/50 bg-[#faf8f5] text-[#6b4f0a]"
                        : "border-stone-200 bg-white text-stone-400"
                  }`}
                >
                  {done ? <Check size={14} strokeWidth={2.5} /> : i + 1}
                </span>
                <span className="text-[9px] font-medium uppercase leading-tight tracking-wide text-stone-500">
                  {step.label}
                </span>
              </motion.li>
            );
          })}
        </ol>
      </div>

      <div className="mt-4 space-y-2 border-t-[0.5px] border-stone-100 pt-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-400">Varer</p>
        <ul className="space-y-2">
          {lines.map((line) => (
            <li
              key={`${line.productId}-${line.size}`}
              className="flex items-start justify-between gap-2 text-sm text-stone-800"
            >
              <span className="min-w-0">
                <span className="font-medium">{line.productName}</span>
                <span className="text-stone-500"> · Str. {line.size}</span>
              </span>
              <span className="shrink-0 tabular-nums text-stone-600">×{line.qty}</span>
            </li>
          ))}
        </ul>
        {totalKr != null ? (
          <p className="pt-2 text-right text-sm font-semibold tabular-nums text-stone-900">{totalKr} kr</p>
        ) : null}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-stone-500">
        <span className="inline-flex items-center gap-1">
          <Truck size={13} className="text-[#8b6914]" aria-hidden /> ETA ca. {order.nearbyEtaMinutes} min
        </span>
        <Button variant="ghost" className="min-h-9 px-2 text-[11px]" href={`/checkout?order_id=${encodeURIComponent(order.id)}`}>
          Åbn checkout
        </Button>
      </div>
    </Card>
  );
}

export default function CustomerPage() {
  const reduceMotion = useReducedMotion();
  const { customerProfile, getCustomerOrders, getRecommendedProducts, updateCustomerProfile } = useLumi();
  const [form, setForm] = useState({
    name: customerProfile.name,
    email: customerProfile.email,
    phone: customerProfile.phone,
    address: customerProfile.address,
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [saving, setSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState("");

  const customerOrders = useMemo(() => getCustomerOrders(), [getCustomerOrders]);
  const recommendations = useMemo(() => getRecommendedProducts(), [getRecommendedProducts]);
  const latestOrder = customerOrders[0];

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden text-stone-900">
      <LumiHeader />
      <main className="mx-auto w-full max-w-7xl flex-1 space-y-8 px-4 py-8 md:px-8 md:py-10">
        <motion.section
          initial={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={springSoft}
          className="relative overflow-hidden rounded-[2rem] border-[0.5px] border-stone-900/10 bg-[linear-gradient(120deg,#fdfcf9_0%,#f7f3ea_55%,#f2ede4_100%)] p-6 md:p-8"
        >
          <div className="pointer-events-none absolute -top-16 right-0 h-44 w-44 rounded-full bg-[#7c5a10]/10 blur-3xl" />
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#8b6914]">
            LOOMY · Kundeområde
          </p>
          <h1 className="mt-3 font-serif text-3xl font-medium tracking-tight md:text-4xl">
            Velkommen tilbage, {customerProfile.name.split(" ")[0]}.
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-stone-600 md:text-base">
            Se dine seneste ordrer, opdatér profiloplysninger og få styles kurateret ud fra dine køb.
          </p>
        </motion.section>

        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <Card className="space-y-4 border-[0.5px] border-stone-200/90 bg-white/95 p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-serif text-xl font-medium">Din profil</h2>
              <span className="rounded-full border-[0.5px] border-[#7c5a10]/30 bg-[#7c5a10]/10 px-2.5 py-1 text-[11px] font-medium text-[#6b4f0a]">
                Personlige oplysninger
              </span>
            </div>
            <form
              className="space-y-3"
              onSubmit={async (event) => {
                event.preventDefault();
                setSavedMessage("");
                const parsed = profileSchema.safeParse(form);
                if (!parsed.success) {
                  const nextErrors: FieldErrors = {};
                  for (const issue of parsed.error.issues) {
                    const key = issue.path[0];
                    if (typeof key === "string" && !(key in nextErrors)) {
                      nextErrors[key as keyof z.infer<typeof profileSchema>] = issue.message;
                    }
                  }
                  setErrors(nextErrors);
                  return;
                }
                setErrors({});
                setSaving(true);
                await new Promise((resolve) => window.setTimeout(resolve, 420));
                updateCustomerProfile(parsed.data);
                setSaving(false);
                setSavedMessage("Profil opdateret.");
              }}
            >
              <div>
                <Input
                  label="Fulde navn"
                  value={form.name}
                  onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                />
                {errors.name ? <p className="mt-1 text-xs text-red-600">{errors.name}</p> : null}
              </div>
              <div>
                <Input
                  label="E-mail"
                  type="email"
                  value={form.email}
                  onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                />
                {errors.email ? <p className="mt-1 text-xs text-red-600">{errors.email}</p> : null}
              </div>
              <div>
                <Input
                  label="Telefon"
                  value={form.phone}
                  onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
                />
                {errors.phone ? <p className="mt-1 text-xs text-red-600">{errors.phone}</p> : null}
              </div>
              <div>
                <Input
                  label="Leveringsadresse"
                  value={form.address}
                  onChange={(event) => setForm((prev) => ({ ...prev, address: event.target.value }))}
                />
                {errors.address ? <p className="mt-1 text-xs text-red-600">{errors.address}</p> : null}
              </div>
              <Button type="submit" disabled={saving} className="w-full">
                {saving ? <Loader2 size={15} className="mr-2 animate-spin" /> : null}
                Gem ændringer
              </Button>
              {savedMessage ? (
                <p className="rounded-xl border-[0.5px] border-emerald-200/80 bg-emerald-50/90 px-3 py-2 text-xs text-emerald-900">
                  {savedMessage}
                </p>
              ) : null}
            </form>
          </Card>

          <Card className="space-y-4 border-[0.5px] border-stone-200/90 bg-gradient-to-b from-white to-stone-50/70 p-6">
            <h2 className="font-serif text-xl font-medium">Seneste ordre</h2>
            {latestOrder ? (
              <CustomerOrderCard order={latestOrder} emphasizePayment />
            ) : (
              <div className="rounded-2xl border-[0.5px] border-dashed border-stone-200 bg-stone-50/70 p-5 text-center">
                <Package className="mx-auto mb-2 text-stone-400" size={26} strokeWidth={1.5} />
                <p className="text-sm text-stone-600">Ingen tidligere ordrer endnu.</p>
              </div>
            )}
            <div className="rounded-2xl border-[0.5px] border-stone-200/90 bg-white/90 p-4">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-stone-500">
                Stil-DNA
              </p>
              <div className="flex flex-wrap gap-2">
                {customerProfile.styleTags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border-[0.5px] border-[#7c5a10]/30 bg-[#7c5a10]/10 px-2.5 py-1 text-[11px] font-medium text-[#6b4f0a]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </Card>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-serif text-xl font-medium md:text-2xl">Anbefalet til dig</h2>
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-stone-500">
              <Sparkles size={14} className="text-[#8b6914]" /> Baseret på dine tidligere køb
            </span>
          </div>
          {recommendations.length === 0 ? (
            <Card className="border-[0.5px] border-dashed border-stone-200 bg-stone-50/80 p-6 text-center">
              <UserRound className="mx-auto mb-2 text-stone-400" size={24} strokeWidth={1.5} />
              <p className="text-sm text-stone-600">Ingen anbefalinger endnu.</p>
            </Card>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {recommendations.map((product) => (
                <motion.div
                  key={product.id}
                  initial={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={springSoft}
                >
                  <Card className="h-full border-[0.5px] border-stone-200/90 bg-white/95 p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-500">
                      {product.category}
                    </p>
                    <p className="mt-2 font-medium text-stone-900">{product.name}</p>
                    <p className="mt-1 text-sm text-stone-600">{product.description}</p>
                    <p className="mt-3 text-sm font-semibold text-stone-900">{product.price} kr.</p>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-xl font-medium md:text-2xl">Ordrehistorik</h2>
          {customerOrders.length === 0 ? (
            <Card className="border-[0.5px] border-dashed border-stone-200 bg-stone-50/70 p-6 text-center">
              <Package className="mx-auto mb-2 text-stone-400" size={24} strokeWidth={1.5} />
              <p className="text-sm text-stone-600">Du har ingen afsluttede køb endnu.</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {customerOrders.map((order) => (
                <CustomerOrderCard key={order.id} order={order} />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
