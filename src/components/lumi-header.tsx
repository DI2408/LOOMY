"use client";

import Link from "next/link";
import { useState } from "react";
import Image from "next/image";
import { ChevronDown, MapPin, Search, ShoppingCart } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useLumi } from "@/components/providers/lumi-provider";

export function LumiHeader() {
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { role, loginAs, logout } = useLumi();

  const roleLabel =
    role === "customer" ? "Customer" : role === "store" ? "Store Partner" : "Courier";

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/80 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-7xl items-center gap-3 px-4 py-3 md:px-6">
        <Link
          href="/"
          className="flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200 bg-white shadow-sm"
        >
          <Image
            src="/loomy-logo.png"
            alt="LOOMY logo"
            width={40}
            height={40}
            className="h-10 w-10 rounded-lg object-cover"
            priority
          />
        </Link>
        <div className="hidden h-12 flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 md:flex">
          <Search size={16} className="text-slate-500" />
          <input
            placeholder="Search boutiques or products"
            className="w-full bg-transparent text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none"
          />
        </div>
        <button className="hidden h-12 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm md:flex">
          <MapPin size={16} />
          Copenhagen
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
            Menu
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
        <div className="relative ml-auto">
          <Button
            variant="secondary"
            className="h-12 border border-slate-300 bg-white px-4 font-semibold !text-slate-900"
            onClick={() => setOpen((prev) => !prev)}
          >
            {role === "customer" ? "Login" : roleLabel}
          </Button>
          {open ? (
            <div className="absolute right-0 z-50 mt-2 w-48 rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
              <p className="px-2 py-1 text-xs font-medium text-slate-500">Access as</p>
              <button
                onClick={() => {
                  setOpen(false);
                  window.location.href = "/login/store";
                }}
                className="w-full rounded-lg px-2 py-2 text-left text-sm text-slate-700 hover:bg-slate-100"
              >
                Store login
              </button>
              <button
                onClick={() => {
                  setOpen(false);
                  window.location.href = "/login/courier";
                }}
                className="w-full rounded-lg px-2 py-2 text-left text-sm text-slate-700 hover:bg-slate-100"
              >
                Courier login
              </button>
              <button
                onClick={() => {
                  loginAs("customer");
                  setOpen(false);
                }}
                className="w-full rounded-lg px-2 py-2 text-left text-sm text-slate-700 hover:bg-slate-100"
              >
                Customer view
              </button>
              {role !== "customer" ? (
                <button
                  onClick={() => {
                    logout();
                    setOpen(false);
                  }}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-2 text-left text-sm text-slate-700 hover:bg-slate-100"
                >
                  Logout
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
