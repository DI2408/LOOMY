"use client";

/**
 * Shared motion presets for LOOMY: spring-first interactions, editorial entry.
 * Durations tuned for snappy luxury feel; pair with useReducedMotion in heavy UIs.
 */
export const springSnappy = { type: "spring" as const, stiffness: 380, damping: 28 };
export const springSoft = { type: "spring" as const, stiffness: 260, damping: 32 };
export const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.06 },
  },
};
export const fadeUpItem = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: springSoft,
  },
};
