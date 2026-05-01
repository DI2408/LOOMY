"use client";

/**
 * Editorial hero visual when no Spline scene URL — Modern Luxe: asymmetric type,
 * hairline gold rule, staggered fade-up; motion softened when prefers-reduced-motion.
 */
import { motion, useReducedMotion } from "framer-motion";
import { BadgeCheck, Clock3, ScanLine } from "lucide-react";
import Link from "next/link";
import { springSoft } from "@/components/motion-config";

const pillars = [
  {
    icon: ScanLine,
    title: "Live synlighed",
    hint: "Størrelser og lager i realtid",
  },
  {
    icon: BadgeCheck,
    title: "Kurateret flow",
    hint: "Ét roligt spor til checkout",
  },
  {
    icon: Clock3,
    title: "Præcis ETA",
    hint: "Butik → bud uden støj",
  },
] as const;

export function HeroVisualLuxe() {
  const reduceMotion = useReducedMotion();

  const containerVariants = {
    hidden: {},
    visible: {
      transition: reduceMotion
        ? { duration: 0 }
        : { staggerChildren: 0.09, delayChildren: 0.06 },
    },
  };

  const itemVariants = {
    hidden: reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 18 },
    visible: {
      opacity: 1,
      y: 0,
      transition: springSoft,
    },
  };

  return (
    <div className="relative h-full min-h-[300px] w-full overflow-hidden rounded-[1.35rem] border-[0.5px] border-white/15 bg-[linear-gradient(165deg,rgba(250,248,245,0.09)_0%,rgba(255,255,255,0.04)_42%,rgba(18,16,14,0.35)_100%)] backdrop-blur-[40px]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_85%_55%_at_50%_-10%,rgba(212,175,55,0.14),transparent_52%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_100%_100%,rgba(250,248,245,0.07),transparent_42%)]" />
      <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-[#d4af37]/40 to-transparent" />

      <motion.div
        className="relative flex h-full flex-col justify-between gap-8 p-6 md:p-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="space-y-4">
          <motion.p
            variants={itemVariants}
            className="text-[10px] font-semibold uppercase tracking-[0.32em] text-[#e8d89a]"
          >
            LOOMY Studio
          </motion.p>
          <motion.h2
            variants={itemVariants}
            className="max-w-[14ch] font-serif text-2xl font-medium leading-[1.15] tracking-tight text-[#faf8f5] md:text-[1.85rem]"
          >
            Fra runway til din dør.
          </motion.h2>
          <motion.p
            variants={itemVariants}
            className="max-w-sm text-sm leading-relaxed text-stone-300/95"
          >
            Kurateret udvalg, live lager og et stramt spor fra boutique til bud — bygget til mennesker,
            ikke dashboards.
          </motion.p>
          <motion.div variants={itemVariants} className="pt-1">
            <Link
              href="/shopping"
              className="group inline-flex min-h-11 items-center gap-2 rounded-full border-[0.5px] border-[#d4af37]/45 bg-[#d4af37]/10 px-5 text-xs font-semibold uppercase tracking-[0.18em] text-[#faf8f5] transition hover:border-[#d4af37]/65 hover:bg-[#d4af37]/18 active:scale-[0.98]"
            >
              Udforsk udvalget
              <span
                className="inline-block translate-x-0 transition group-hover:translate-x-0.5"
                aria-hidden
              >
                →
              </span>
            </Link>
          </motion.div>
        </div>

        <motion.ul
          variants={itemVariants}
          className="grid gap-2 sm:grid-cols-3"
          role="list"
        >
          {pillars.map(({ icon: Icon, title, hint }) => (
            <li key={title}>
              <motion.div
                whileHover={reduceMotion ? undefined : { y: -2 }}
                whileTap={reduceMotion ? undefined : { scale: 0.98 }}
                transition={springSoft}
                className="rounded-2xl border-[0.5px] border-white/12 bg-white/[0.06] px-3 py-3 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-md"
              >
                <Icon className="mb-2 text-[#e8d89a]" size={18} strokeWidth={1.5} aria-hidden />
                <p className="text-[11px] font-semibold tracking-wide text-[#faf8f5]">{title}</p>
                <p className="mt-0.5 text-[10px] leading-snug text-stone-400">{hint}</p>
              </motion.div>
            </li>
          ))}
        </motion.ul>
      </motion.div>

      {!reduceMotion ? (
        <motion.div
          aria-hidden
          className="pointer-events-none absolute -bottom-16 -right-16 h-52 w-52 rounded-full border-[0.5px] border-[#d4af37]/15"
          animate={{ rotate: 360 }}
          transition={{ duration: 48, repeat: Infinity, ease: "linear" }}
        />
      ) : null}
    </div>
  );
}
