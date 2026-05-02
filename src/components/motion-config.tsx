"use client";

/**
 * Shared motion presets for LOOMY: spring-first interactions, editorial entry.
 * Durations tuned for snappy luxury feel; pair with useReducedMotion in heavy UIs.
 */
export const springSnappy = { type: "spring" as const, stiffness: 380, damping: 28 };
export const springSoft = { type: "spring" as const, stiffness: 260, damping: 32 };
/** Parent only orchestrates stagger — keep opacity on children so hero never stays blank. */
export const staggerContainer = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.07, delayChildren: 0.04 },
  },
};
export const fadeUpItem = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: springSoft,
  },
};
