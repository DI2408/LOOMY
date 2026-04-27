"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ChevronDown, MapPin, Menu, Search } from "lucide-react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useLumi } from "@/components/providers/lumi-provider";

const menuSpring = { type: "spring" as const, stiffness: 420, damping: 32 };

const mainNav = [
  { href: "/", label: "Hjem" },
  { href: "/shopping", label: "Shop" },
  { href: "/about", label: "Om os" },
  { href: "/feedback", label: "Feedback" },
] as const;

export function LumiHeader() {
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { role, loginAs, logout } = useLumi();

  const roleLabel =
    role === "customer" ? "Kunde" : role === "store" ? "Butik" : "Bud";

  return (
    <header className="sticky top-0 z-50 border-b-[0.5px] border-stone-200/80 bg-[#f6f4ef]/80 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-7xl items-center gap-2 px-4 py-3 md:gap-3 md:px-8 md:py-4">
        <Link
          href="/"
          className="group flex min-h-11 shrink-0 items-center rounded-lg px-1.5 text-stone-900 transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7c5a10]/30 focus-visible:ring-offset-2 focus-visible:ring-offset-[#f6f4ef]"
        >
          <span className="font-serif text-lg font-medium tracking-[0.12em] sm:text-xl">LOOMY</span>
        </Link>

        <nav
          className="ml-1 hidden items-center gap-1 rounded-2xl border-[0.5px] border-stone-200/70 bg-white/70 p-1 md:flex"
          aria-label="Hovedmenu"
        >
          {mainNav.map((item) => {
            const active = pathname === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <motion.span
                  whileTap={{ scale: 0.97 }}
                  transition={menuSpring}
                  className={`relative flex min-h-10 items-center rounded-xl px-4 text-sm font-medium transition-colors ${
                    active ? "text-stone-900" : "text-stone-600 hover:text-stone-900"
                  }`}
                >
                  {active ? (
                    <motion.span
                      layoutId="nav-pill"
                      className="absolute inset-0 rounded-xl bg-[#f6f4ef] shadow-[inset_0_0_0_1px_rgba(124,90,16,0.14)]"
                      transition={menuSpring}
                    />
                  ) : null}
                  <span className="relative z-10">{item.label}</span>
                </motion.span>
              </Link>
            );
          })}
        </nav>

        <div className="hidden min-h-11 min-w-0 flex-1 items-center gap-2 rounded-xl border-[0.5px] border-stone-200/90 bg-white/90 px-4 backdrop-blur-sm lg:flex">
          <Search size={17} className="shrink-0 text-stone-400" aria-hidden />
          <input
            placeholder="Søg butikker eller styles…"
            className="min-h-10 w-full min-w-0 bg-transparent text-sm text-stone-800 placeholder:text-stone-400 focus:outline-none"
            aria-label="Søg"
          />
        </div>

        <motion.button
          type="button"
          whileTap={{ scale: 0.97 }}
          whileHover={reduceMotion ? undefined : { scale: 1.02 }}
          transition={menuSpring}
          className="hidden min-h-11 shrink-0 items-center gap-2 rounded-xl border-[0.5px] border-stone-200/90 bg-white/90 px-3 text-sm font-medium text-stone-800 backdrop-blur-sm transition hover:bg-white xl:flex"
        >
          <MapPin size={16} className="text-[#7c5a10]" aria-hidden />
          <span className="max-w-[8rem] truncate">København K</span>
        </motion.button>

        <div className="relative ml-auto md:ml-0">
          <motion.button
            type="button"
            onClick={() => setMenuOpen((prev) => !prev)}
            whileTap={{ scale: 0.98 }}
            transition={menuSpring}
            className="flex min-h-11 items-center gap-2 rounded-xl border-[0.5px] border-stone-900/10 bg-stone-900 px-3 text-sm font-medium text-[#f6f4ef] shadow-md transition hover:bg-stone-800 md:px-4"
            aria-expanded={menuOpen}
            aria-haspopup="true"
          >
            <Menu size={17} strokeWidth={1.75} className="md:hidden" aria-hidden />
            <span className="hidden md:inline">Mere</span>
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
                className="absolute right-0 z-50 mt-2 w-60 rounded-2xl border-[0.5px] border-stone-200/90 bg-white/98 p-2 shadow-[0_24px_56px_rgba(28,25,23,0.12)] backdrop-blur-xl"
              >
                <p className="px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-400">
                  Genveje
                </p>
                {[
                  { href: "/shopping", label: "Shop" },
                  { href: "/about", label: "Om os" },
                  { href: "/feedback", label: "Feedback" },
                  { href: "/#contact", label: "Kontakt" },
                  { href: "/login/store", label: "Butikslogin" },
                  { href: "/login/courier", label: "Budlogin" },
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

        <div className="relative shrink-0">
          <Button
            variant="secondary"
            className="min-h-11 border-[0.5px] border-stone-200 bg-white px-3 font-medium !text-stone-900 shadow-sm md:px-4"
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
