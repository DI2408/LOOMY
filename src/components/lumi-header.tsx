"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import Image from "next/image";
import { ChevronDown, MapPin, Search, ShoppingCart } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useLumi } from "@/components/providers/lumi-provider";

const navItems = [
  { href: "/", label: "Hjem" },
  { href: "/shopping", label: "Shop" },
  { href: "/about", label: "Om os" },
  { href: "/feedback", label: "Feedback" },
] as const;

export function LumiHeader() {
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { role, loginAs, logout } = useLumi();
  const pathname = usePathname();

  const roleLabel =
    role === "customer" ? "Kunde" : role === "store" ? "Butik" : "Bud";

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/80 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center gap-3 px-4 py-3 md:flex-nowrap md:px-6">
        <Link
          href="/"
          className="flex h-12 shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-2 pr-3 shadow-sm transition hover:bg-slate-50/90"
        >
          <span className="flex h-10 w-10 items-center justify-center">
            <Image
              src="/loomy-logo.svg"
              alt="LOOMY logo"
              width={40}
              height={40}
              className="h-10 w-10 rounded-lg object-cover"
              priority
            />
          </span>
          <span className="font-loomy text-lg font-semibold tracking-tight text-slate-900">
            LOOMY
          </span>
        </Link>

        <nav className="order-last hidden w-full items-center gap-1 md:order-none md:flex md:w-auto">
          {navItems.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-xl px-3 py-2 text-sm font-medium transition ${
                  active
                    ? "bg-slate-100 text-slate-900"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden h-12 min-w-0 flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 md:flex">
          <Search size={16} className="shrink-0 text-slate-500" />
          <input
            placeholder="Søg butikker eller styles..."
            className="min-w-0 flex-1 bg-transparent text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none"
          />
        </div>
        <button
          type="button"
          className="hidden h-12 shrink-0 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-sm font-medium text-slate-800 shadow-sm transition hover:bg-slate-50 md:inline-flex"
        >
          <MapPin size={16} className="text-slate-600" />
          København K
        </button>
        <button className="flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200 bg-white">
          <ShoppingCart size={20} />
        </button>
        <div className="relative">
          <motion.button
            onClick={() => setMenuOpen((prev) => !prev)}
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.98 }}
            className="group flex h-12 items-center gap-2 rounded-xl border border-[#d8c08a]/70 bg-gradient-to-br from-[#fff8ea] to-[#fef3dd] px-4 text-sm font-semibold text-slate-900 shadow-[0_10px_24px_rgba(217,119,69,0.18)] transition hover:shadow-[0_14px_30px_rgba(217,119,69,0.24)]"
          >
            Mere
            <ChevronDown
              size={16}
              className={`transition ${menuOpen ? "rotate-180" : "rotate-0"}`}
            />
          </motion.button>
          <AnimatePresence>
            {menuOpen ? (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.98 }}
                transition={{ duration: 0.18 }}
                className="absolute right-0 z-50 mt-2 w-52 rounded-2xl border border-white/50 bg-white/90 p-2 shadow-[0_16px_40px_rgba(15,23,42,0.22)] backdrop-blur-2xl"
              >
                <p className="px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Navigation
                </p>
                {[
                  { href: "/shopping", label: "Butikker" },
                  { href: "/about", label: "Om os" },
                  { href: "/feedback", label: "Feedback" },
                  { href: "/#contact", label: "Kontakt" },
                ].map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                    className="mt-1 flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium text-slate-800 transition hover:bg-[#fff3dd] hover:text-slate-900"
                  >
                    {item.label}
                    <span className="text-xs text-slate-500">↗</span>
                  </Link>
                ))}
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
        <div className="relative ml-auto flex shrink-0 items-center gap-2">
          <Button
            variant="outlineLight"
            className="h-12 px-4 font-semibold"
            onClick={() => setOpen((prev) => !prev)}
          >
            {role === "customer" ? "Log ind" : roleLabel}
          </Button>
          {open ? (
            <div className="absolute right-0 z-50 mt-2 w-52 rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
              <p className="px-2 py-1 text-xs font-medium text-slate-500">Log ind som</p>
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  window.location.href = "/login/store";
                }}
                className="w-full rounded-lg px-2 py-2 text-left text-sm text-slate-700 hover:bg-slate-100"
              >
                Butik
              </button>
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  window.location.href = "/login/courier";
                }}
                className="w-full rounded-lg px-2 py-2 text-left text-sm text-slate-700 hover:bg-slate-100"
              >
                Bud
              </button>
              <button
                type="button"
                onClick={() => {
                  loginAs("customer");
                  setOpen(false);
                }}
                className="w-full rounded-lg px-2 py-2 text-left text-sm text-slate-700 hover:bg-slate-100"
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
                  className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-2 text-left text-sm text-slate-700 hover:bg-slate-100"
                >
                  Log ud
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
