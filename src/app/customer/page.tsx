"use client";

/**
 * LOOMY customer profile hub with luxe, mobile-first UX.
 */
import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Loader2, Package, Sparkles, UserRound } from "lucide-react";
import { z } from "zod";
import { LumiHeader } from "@/components/lumi-header";
import { useLumi } from "@/components/providers/lumi-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { springSoft } from "@/components/motion-config";

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
              <div className="space-y-3 rounded-2xl border-[0.5px] border-stone-200 bg-white/90 p-4">
                <p className="text-sm font-medium text-stone-900">{latestOrder.productName}</p>
                <p className="text-xs text-stone-600">{latestOrder.storeName}</p>
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full border-[0.5px] border-stone-200 px-2.5 py-1 text-[11px] text-stone-700">
                    Str. {latestOrder.size}
                  </span>
                  <span className="rounded-full border-[0.5px] border-stone-200 px-2.5 py-1 text-[11px] text-stone-700">
                    Status: {latestOrder.status.replaceAll("_", " ")}
                  </span>
                </div>
              </div>
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
                <Card key={order.id} className="border-[0.5px] border-stone-200/90 bg-white/95 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-medium text-stone-900">{order.productName}</p>
                    <span className="rounded-full border-[0.5px] border-stone-200 px-2.5 py-1 text-[11px] text-stone-700">
                      {order.id}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-stone-600">
                    {order.storeName} · Str. {order.size} · Antal {order.qty}
                  </p>
                </Card>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
