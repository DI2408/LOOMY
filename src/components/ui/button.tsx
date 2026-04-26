"use client";

import { motion } from "framer-motion";
import type { HTMLMotionProps } from "framer-motion";
import type { ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost";

type ButtonProps = Omit<HTMLMotionProps<"button">, "children"> & {
  children: ReactNode;
  variant?: ButtonVariant;
  fullWidth?: boolean;
};

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-[#f9a26c] text-[#0A0E1A] shadow-[0_10px_24px_rgba(249,162,108,0.35)] hover:bg-[#ffb383] hover:shadow-[0_14px_30px_rgba(249,162,108,0.45)] active:scale-95 active:shadow-[0_6px_14px_rgba(249,162,108,0.35)] focus-visible:ring-[#f9a26c]/40",
  secondary:
    "bg-white/10 text-white border border-white/20 shadow-[0_8px_20px_rgba(15,23,42,0.20)] hover:bg-white/20 hover:shadow-[0_12px_26px_rgba(15,23,42,0.24)] active:scale-95 active:shadow-[0_5px_12px_rgba(15,23,42,0.18)] focus-visible:ring-white/30",
  ghost:
    "bg-transparent text-slate-300 hover:bg-white/10 hover:text-white active:scale-95 focus-visible:ring-white/20",
};

export function Button({
  children,
  className = "",
  variant = "primary",
  fullWidth = false,
  ...props
}: ButtonProps) {
  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      whileHover={{ y: -1 }}
      className={`inline-flex h-11 items-center justify-center rounded-xl px-4 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 ${variantClasses[variant]} ${fullWidth ? "w-full" : ""} ${className}`}
      {...props}
    >
      {children}
    </motion.button>
  );
}
