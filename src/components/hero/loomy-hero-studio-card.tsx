"use client";

import { motion } from "framer-motion";
import { ArrowRight, Package, Ruler, Timer } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const features = [
  {
    icon: Ruler,
    title: "Live synlighed",
    text: "Størrelser og lager i realtid",
  },
  {
    icon: Package,
    title: "Kurateret flow",
    text: "Ét roligt spor til checkout",
  },
  {
    icon: Timer,
    title: "Præcis ETA",
    text: "Butik → bud uden støj",
  },
] as const;

export function LoomyHeroStudioCard() {
  return (
    <div className="relative flex h-full min-h-[320px] flex-col justify-between overflow-hidden rounded-3xl border border-white/20 bg-gradient-to-br from-white/[0.12] via-white/[0.06] to-white/[0.02] p-6 text-white shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur-[28px] md:min-h-[400px] md:p-8">
      <div className="pointer-events-none absolute -right-6 -top-6 h-40 w-40 rounded-full bg-amber-400/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-8 left-1/3 h-36 w-36 rounded-full bg-indigo-500/20 blur-3xl" />

      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#f4c57a]">
          LOOMY STUDIO
        </p>
        <h2 className="font-loomy mt-4 text-2xl font-semibold leading-tight md:text-3xl">
          Fra runway til din dør.
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-slate-200/95 md:text-base">
          Kurateret udvalg, live lager og et stramt spor fra boutique til bud — bygget til
          mennesker, ikke dashboards.
        </p>
      </div>

      <div className="mt-6">
        <Link href="/shopping">
          <Button
            variant="secondary"
            className="group h-12 w-full border border-[#f4c57a]/80 bg-transparent px-5 text-white shadow-[0_12px_40px_rgba(244,197,122,0.15)] hover:bg-white/10 md:inline-flex md:w-auto"
          >
            Udforsk udvalget
            <ArrowRight
              size={18}
              className="ml-2 transition group-hover:translate-x-0.5"
              aria-hidden
            />
          </Button>
        </Link>
      </div>

      <div className="mt-8 grid gap-2 sm:grid-cols-3">
        {features.map((item, i) => (
          <motion.div
            key={item.title}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 * i, duration: 0.35 }}
            className="rounded-2xl border border-white/20 bg-white/[0.07] p-3 backdrop-blur-md"
          >
            <item.icon size={16} className="mb-2 text-[#f4c57a]" aria-hidden />
            <p className="text-xs font-semibold text-white">{item.title}</p>
            <p className="mt-0.5 text-[11px] leading-snug text-slate-300/95">{item.text}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
