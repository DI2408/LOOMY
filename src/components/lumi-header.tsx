"use client";

import Link from "next/link";
import { useState } from "react";
import Image from "next/image";
import { ChevronDown, MapPin, Menu, Search, ShoppingBag } from "lucide-react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useLumi } from "@/components/providers/lumi-provider";

const menuSpring = { type: "spring" as const, stiffness: 420, damping: 32 };

export function LumiHeader() {
  const reduceMotion = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { role, loginAs, logout } = useLumi();

  const roleLabel =
    role === "customer" ? "Kunde" : role === "store" ? "Butik" : "Bud";

  return (
    <header className="sticky top-0 z-50 border-b-[0.5px] border-stone-200/80 bg-[#faf8f5]/75 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-7xl items-center gap-3 px-4 py-3 md:gap-4 md:px-8">
        <Link
          href="/"
          className="group flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-xl border-[0.5px] border-stone-200/90 bg-white/90 shadow-[0_4px_20px_rgba(28,25,23,0.06)] ring-stone-900/5 transition hover:shadow-[0_8px_28px_rgba(28,25,23,0.08)]"
        >
          <Image
            src="/loomy-logo.png"
            alt="LOOMY"
            width={40}
            height={40}
            className="h-9 w-9 rounded-lg object-cover transition group-hover:scale-[1.02]"
            priority
          />
        </Link>

        <div className="hidden min-h-11 flex-1 items-center gap-2 rounded-xl border-[0.5px] border-stone-200/90 bg-white/80 px-4 backdrop-blur-sm md:flex">
          <Search size={17} className="shrink-0 text-stone-400" aria-hidden />
          <input
            placeholder="Søg butikker eller styles…"
            className="min-h-10 w-full bg-transparent text-sm text-stone-800 placeholder:text-stone-400 focus:outline-none"
            aria-label="Søg"
          />
        </div>

        <motion.button
          type="button"
          whileTap={{ scale: 0.97 }}
          whileHover={reduceMotion ? undefined : { scale: 1.02 }}
          transition={menuSpring}
          className="hidden min-h-11 items-center gap-2 rounded-xl border-[0.5px] border-stone-200/90 bg-white/80 px-4 text-sm font-medium text-stone-800 backdrop-blur-sm transition hover:bg-white md:flex"
        >
          <MapPin size={16} className="text-[#8b6914]" aria-hidden />
          København K
        </motion.button>

        <motion.button
          type="button"
          whileTap={{ scale: 0.97 }}
          whileHover={reduceMotion ? undefined : { scale: 1.02 }}
          transition={menuSpring}
          className="relative ml-auto flex min-h-11 min-w-11 items-center justify-center rounded-xl border-[0.5px] border-stone-200/90 bg-white/90 text-stone-800 shadow-sm md:ml-0"
          aria-label="Kurv"
        >
          <ShoppingBag size={20} strokeWidth={1.75} />
        </motion.button>

        <div className="relative">
          <motion.button
            type="button"
            onClick={() => setMenuOpen((prev) => !prev)}
            whileTap={{ scale: 0.98 }}
            transition={menuSpring}
            className="flex min-h-11 items-center gap-2 rounded-xl border-[0.5px] border-stone-900/10 bg-stone-900 px-4 text-sm font-medium text-[#faf8f5] shadow-[0_10px_28px_rgba(28,25,23,0.2)] transition hover:bg-stone-800"
            aria-expanded={menuOpen}
            aria-haspopup="true"
          >
            <Menu size={17} strokeWidth={1.75} className="md:hidden" aria-hidden />
            <span className="hidden md:inline">Menu</span>
            <ChevronDown
              size={16}
              className={`hidden transition md:block ${menuOpen ? "rotate-180" : "rotate-0"}`}
              aria-hidden
            />
          </motion.button>
          <AnimatePresence>
            {menuOpen ? (
              <motion.div
                initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.98 }}
                transition={menuSpring}
                className="absolute right-0 z-50 mt-2 w-56 rounded-2xl border-[0.5px] border-stone-200/90 bg-white/95 p-2 shadow-[0_20px_50px_rgba(28,25,23,0.12)] backdrop-blur-xl"
              >
                <p className="px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-400">
                  LOOMY
                </p>
                {[
                  { href: "/shopping", label: "Shop" },
                  { href: "/about", label: "Om os" },
                  { href: "/feedback", label: "Feedback" },
                  { href: "/#contact", label: "Kontakt" },
                ].map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                    className="flex min-h-11 items-center justify-between rounded-xl px-3 text-sm font-medium text-stone-800 transition hover:bg-stone-50"
                  >
                    {item.label}
                    <span className="text-xs text-stone-400" aria-hidden>
                      →
                    </span>
                  </Link>
                ))}
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>

        <div className="relative">
          <Button
            variant="secondary"
            className="min-h-11 border-[0.5px] border-stone-200 bg-white px-4 font-medium !text-stone-900 shadow-sm"
            onClick={() => setOpen((prev) => !prev)}
          >
            {role === "customer" ? "Log ind" : roleLabel}
          </Button>
          <AnimatePresence>
            {open ? (
              <motion.div
                initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 6, scale: 0.98 }}
                transition={menuSpring}
                className="absolute right-0 z-50 mt-2 w-52 rounded-2xl border-[0.5px] border-stone-200/90 bg-white p-2 shadow-[0_16px_40px_rgba(28,25,23,0.1)]"
              >
                <p className="px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-400">
                  Åbn som
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    window.location.href = "/login/store";
                  }}
                  className="flex min-h-11 w-full rounded-xl px-3 text-left text-sm text-stone-700 transition hover:bg-stone-50"
                >
                  Butikslogin
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    window.location.href = "/login/courier";
                  }}
                  className="flex min-h-11 w-full rounded-xl px-3 text-left text-sm text-stone-700 transition hover:bg-stone-50"
                >
                  Budlogin
                </button>
                <button
                  type="button"
                  onClick={() => {
                    loginAs("customer");
                    setOpen(false);
                  }}
                  className="flex min-h-11 w-full rounded-xl px-3 text-left text-sm text-stone-700 transition hover:bg-stone-50"
                >
                  Kundevisning
                </button>
                {role !== "customer" ? (
                  <button
                    type="button"
                    onClick={() => {
                      logout();
                      setOpen(false);
                    }}
                    className="mt-1 flex min-h-11 w-full rounded-xl border-[0.5px] border-stone-200 px-3 text-left text-sm text-stone-700 transition hover:bg-stone-50"
                  >
                    Log ud
                  </button>
                ) : null}
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
