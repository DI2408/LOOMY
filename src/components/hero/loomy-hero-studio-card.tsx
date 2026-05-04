"use client";

import { motion } from "framer-motion";
import { ArrowRight, Package, Ruler, Timer } from "lucide-react";
import Link from "next/link";

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
    <div className="relative flex h-full min-h-[380px] flex-col overflow-hidden rounded-[1.75rem] border border-white/15 bg-[#1a1a1a]/40 p-6 text-white shadow-[0_24px_64px_rgba(0,0,0,0.4)] backdrop-blur-[32px] md:min-h-[440px] md:rounded-[2rem] md:p-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_0%_0%,rgba(197,160,89,0.14),transparent_55%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_100%_100%,rgba(90,70,140,0.12),transparent_45%)]" />

      <div className="relative flex flex-1 flex-col">
        <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-[#c5a059]">
          LOOMY STUDIO
        </p>
        <h2 className="font-loomy mt-5 text-2xl font-semibold leading-[1.2] text-white md:text-3xl">
          Fra runway til din dør.
        </h2>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-white/82 md:text-[15px]">
          Kurateret udvalg, live lager og et stramt spor fra boutique til bud — bygget til
          mennesker, ikke dashboards.
        </p>

        <div className="mt-8">
          <Link
            href="/shopping"
            className="group inline-flex h-12 w-full items-center justify-center rounded-xl border-2 border-[#c5a059] bg-transparent px-5 text-sm font-semibold uppercase tracking-[0.12em] text-[#c5a059] shadow-[0_8px_32px_rgba(197,160,89,0.12)] transition hover:bg-[#c5a059]/10 md:w-auto md:min-w-[220px]"
          >
            Udforsk udvalget
            <ArrowRight
              size={18}
              className="ml-2 transition group-hover:translate-x-0.5"
              aria-hidden
            />
          </Link>
        </div>
      </div>

      <div className="relative mt-auto grid gap-2 pt-8 sm:grid-cols-3">
        {features.map((item, i) => (
          <motion.div
            key={item.title}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.06 * i, duration: 0.35 }}
            className="rounded-2xl border border-white/12 bg-black/35 p-3.5 shadow-inner backdrop-blur-md"
          >
            <item.icon size={15} className="mb-2.5 text-[#c5a059]" strokeWidth={1.75} aria-hidden />
            <p className="text-[13px] font-semibold leading-tight text-white">{item.title}</p>
            <p className="mt-1 text-[11px] leading-snug text-white/65">{item.text}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
