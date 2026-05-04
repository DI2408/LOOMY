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

export function LoomyHeader() {
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { role, loginAs, logout } = useLumi();
  const pathname = usePathname();

  const roleLabel =
    role === "customer" ? "Kunde" : role === "store" ? "Butik" : "Bud";

  return (
    <header className="sticky top-0 z-50 border-b border-black/[0.06] bg-[#fdfcf8]/90 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center gap-3 px-4 py-4 md:flex-nowrap md:gap-4 md:px-6">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2.5 rounded-2xl py-1 pr-1 transition hover:opacity-90"
        >
          <span className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl border border-black/[0.08] bg-white shadow-sm">
            <Image
              src="/loomy-logo.svg"
              alt="LOOMY"
              width={44}
              height={44}
              className="h-11 w-11 object-cover"
              priority
            />
          </span>
          <span className="font-loomy text-xl font-semibold uppercase tracking-[0.08em] text-[#121212]">
            LOOMY
          </span>
        </Link>

        <nav
          aria-label="Primær"
          className="order-last hidden w-full items-center justify-center md:order-none md:flex md:w-auto md:shrink-0"
        >
          <div className="flex items-center gap-0.5 rounded-full border border-black/[0.08] bg-white px-1.5 py-1.5 shadow-sm">
            {navItems.map((item) => {
              const active =
                item.href === "/"
                  ? pathname === "/"
                  : pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-full px-3.5 py-2 text-sm font-medium transition md:px-4 ${
                    active
                      ? "bg-[#ececec] text-[#121212]"
                      : "text-[#444] hover:bg-[#f5f5f5] hover:text-[#121212]"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>

        <div className="flex min-h-12 min-w-0 flex-1 items-center gap-3 rounded-full border border-black/[0.08] bg-white px-4 py-2.5 shadow-sm">
          <Search size={18} className="shrink-0 text-[#888]" strokeWidth={2} />
          <input
            type="search"
            placeholder="Søg butikker eller styles..."
            className="min-w-0 flex-1 bg-transparent text-sm text-[#121212] placeholder:text-[#9ca3af] focus:outline-none"
            aria-label="Søg"
          />
        </div>

        <div className="flex shrink-0 items-center gap-2 md:gap-2.5">
          <button
            type="button"
            className="hidden h-11 shrink-0 items-center gap-2 rounded-full border border-black/[0.08] bg-white px-4 text-sm font-medium text-[#121212] shadow-sm transition hover:bg-[#fafafa] md:inline-flex"
          >
            <MapPin size={17} className="text-[#666]" />
            København K
          </button>

          <div className="relative">
            <motion.button
              type="button"
              onClick={() => setMenuOpen((prev) => !prev)}
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.98 }}
              className="flex h-11 items-center gap-2 rounded-full bg-[#121212] px-5 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(0,0,0,0.18)] transition hover:bg-[#1a1a1a]"
            >
              Mere
              <ChevronDown
                size={16}
                className={`opacity-90 transition ${menuOpen ? "rotate-180" : ""}`}
              />
            </motion.button>
            <AnimatePresence>
              {menuOpen ? (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.98 }}
                  transition={{ duration: 0.18 }}
                  className="absolute right-0 z-50 mt-2 w-52 rounded-2xl border border-black/[0.06] bg-white/95 p-2 shadow-[0_16px_40px_rgba(15,23,42,0.12)] backdrop-blur-xl"
                >
                  <p className="px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#888]">
                    Menu
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
                      className="mt-1 flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium text-[#121212] transition hover:bg-[#f5f5f5]"
                    >
                      {item.label}
                      <span className="text-xs text-[#999]">↗</span>
                    </Link>
                  ))}
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>

          <button
            type="button"
            className="flex h-11 w-11 items-center justify-center rounded-2xl border border-black/[0.08] bg-white shadow-sm transition hover:bg-[#fafafa]"
            aria-label="Kurv"
          >
            <ShoppingCart size={20} className="text-[#121212]" strokeWidth={2} />
          </button>

          <div className="relative">
            <Button
              variant="outlineLight"
              className="h-11 rounded-full border-black/[0.1] px-5 font-semibold shadow-sm"
              onClick={() => setOpen((prev) => !prev)}
            >
              {role === "customer" ? "Log ind" : roleLabel}
            </Button>
            {open ? (
              <div className="absolute right-0 z-50 mt-2 w-52 rounded-2xl border border-black/[0.08] bg-white p-2 shadow-lg">
                <p className="px-2 py-1 text-xs font-medium text-[#888]">Log ind som</p>
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    window.location.href = "/login/store";
                  }}
                  className="w-full rounded-lg px-2 py-2 text-left text-sm text-[#121212] hover:bg-[#f5f5f5]"
                >
                  Butik
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    window.location.href = "/login/courier";
                  }}
                  className="w-full rounded-lg px-2 py-2 text-left text-sm text-[#121212] hover:bg-[#f5f5f5]"
                >
                  Bud
                </button>
                <button
                  type="button"
                  onClick={() => {
                    loginAs("customer");
                    setOpen(false);
                  }}
                  className="w-full rounded-lg px-2 py-2 text-left text-sm text-[#121212] hover:bg-[#f5f5f5]"
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
                    className="mt-1 w-full rounded-lg border border-black/[0.1] px-2 py-2 text-left text-sm text-[#121212] hover:bg-[#f5f5f5]"
                  >
                    Log ud
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}
