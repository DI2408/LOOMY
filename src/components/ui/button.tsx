"use client";

import { motion } from "framer-motion";
import type { HTMLMotionProps } from "framer-motion";
import type { ReactNode } from "react";
import Link from "next/link";

type ButtonVariant = "primary" | "secondary" | "ghost";

type ButtonProps = Omit<HTMLMotionProps<"button">, "children"> & {
  children: ReactNode;
  variant?: ButtonVariant;
  fullWidth?: boolean;
  href?: string;
};

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-stone-900 text-[#faf8f5] shadow-[0_12px_28px_rgba(28,25,23,0.18)] ring-1 ring-stone-900/80 hover:bg-stone-800 hover:shadow-[0_16px_36px_rgba(28,25,23,0.22)] active:scale-95 focus-visible:ring-2 focus-visible:ring-[#8b6914]/35 focus-visible:ring-offset-2 focus-visible:ring-offset-[#faf8f5]",
  secondary:
    "bg-white/90 text-stone-900 border-[0.5px] border-stone-200/90 shadow-[0_8px_24px_rgba(28,25,23,0.06)] backdrop-blur-md hover:bg-white hover:shadow-[0_12px_32px_rgba(28,25,23,0.08)] active:scale-95 focus-visible:ring-2 focus-visible:ring-stone-400/30 focus-visible:ring-offset-2",
  ghost:
    "bg-transparent text-stone-600 hover:bg-stone-100/80 hover:text-stone-900 active:scale-95 focus-visible:ring-2 focus-visible:ring-stone-400/25 focus-visible:ring-offset-2",
};

const baseClass =
  "inline-flex min-h-11 items-center justify-center rounded-xl px-5 text-sm font-medium tracking-tight transition-colors focus-visible:outline-none";

export function Button({
  children,
  className = "",
  variant = "primary",
  fullWidth = false,
  href,
  ...props
}: ButtonProps) {
  const classes = `${baseClass} ${variantClasses[variant]} ${fullWidth ? "w-full" : ""} ${className}`;

  if (href) {
    return (
      <motion.span whileTap={{ scale: 0.98 }} whileHover={{ y: -1 }} className={fullWidth ? "block w-full" : "inline-block"}>
        <Link href={href} className={classes}>
          {children}
        </Link>
      </motion.span>
    );
  }

  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      whileHover={{ y: -1 }}
      transition={{ type: "spring", stiffness: 400, damping: 28 }}
      className={classes}
      {...props}
    >
      {children}
    </motion.button>
  );
}
