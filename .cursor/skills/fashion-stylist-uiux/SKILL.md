---
name: fashion-stylist-uiux
description: >-
  Applies LOOMY Fashion Stylist UI/UX: minimalist luxury (hairline borders,
  generous whitespace, Inter/Playfair typography), Framer Motion spring transitions,
  product hover and button micro-interactions, mobile-first thumb-friendly layouts.
  Use when implementing or styling frontend components, Tailwind classes, animations,
  layout, or when the user asks for luxury fashion marketplace aesthetics, motion, or
  mobile commerce UI.
---

# Fashion Stylist UI/UX

Use this skill for **all frontend work** in LOOMY: components, pages, Tailwind, and motion. Stack defaults stay **Next.js App Router**, **Tailwind**, **Shadcn/UI**, **Framer Motion**, **Lucide**—this skill defines **visual and interaction language** on top of those tools.

## 1. Minimalist luxury

- **Borders**: Prefer hairline separation—`border-[0.5px]` or `ring-1` with low-opacity neutrals—not heavy 2px frames unless emphasis is intentional.
- **Whitespace**: Default to generous padding—`p-8` / `p-12` on sections and hero blocks; increase vertical rhythm with `gap-8`–`gap-12` in grids; avoid cramped `p-2`/`p-3` on primary surfaces unless density is explicitly required (e.g. compact lists).
- **Typography**: **Inter** for UI, body, and data. **Playfair Display** for display headings, editorial titles, and brand moments. Load via `next/font/google`; pair weights deliberately (e.g. Inter 400/500, Playfair 500/600).
- **Color**: High contrast, restrained palette; favor neutrals with one accent; avoid rainbow utility sprawl—one clear hierarchy per screen.

## 2. Motion (Framer Motion)

- **Default transitions**: Use **`type: "spring"`** for interactive motion (layout, hover lifts, modals, drawers). Avoid `easeIn` / `ease-in` as the primary feel—prefer spring or `easeOut` only when springs are wrong (e.g. linear progress).
- **Coverage**: Every **meaningful interaction** (tap, hover on desktop, expand/collapse, route transition, add-to-cart, tab change) should have a short, intentional motion—not decorative noise on static text.
- **Performance**: Prefer `transform` and `opacity`; keep durations snappy (often 0.2–0.45s equivalent perceived length); respect `prefers-reduced-motion` by reducing or disabling non-essential animation.

## 3. Micro-interactions

- **Product tiles / cards**: On hover (pointer devices), subtle **scale to ~1.02** (`whileHover={{ scale: 1.02 }}` or Tailwind `hover:scale-[1.02]` with `transition-transform`) plus optional slight shadow lift—no aggressive bounce.
- **Buttons / chips**: **Haptic-style feedback**: quick press-in (`scale: 0.98` on `whileTap`), small spring on release, optional subtle opacity or ring pulse on success—pair with loading/disabled states so motion never fights clarity.

## 4. Mobile-first (one-handed use)

- **Touch targets**: Minimum **44×44px** interactive hit areas (`min-h-11 min-w-11` or larger); extend tap targets with padding, not tiny icons alone.
- **Navigation**: Primary navigation for customer/rider flows should favor **bottom bars** or thumb-reachable FABs on mobile; keep destructive actions away from easy accidental reach or add confirmation.
- **Layout**: Single-column first; progressive enhancement for tablet/desktop grids; keep primary actions in the **lower third** on key screens where possible.

## 5. Checklist before shipping UI

- [ ] Hairline borders and section spacing feel editorial, not dashboard-dense.
- [ ] Inter + Playfair roles are consistent (no mixing display fonts in body copy).
- [ ] Interactive elements use spring (or justified alternative) and include tap/hover feedback.
- [ ] Product imagery/cards have restrained hover scale.
- [ ] Mobile layout is thumb-safe; bottom nav or reachable primary actions verified.

## Relationship to other LOOMY rules

- **Shadcn/UI**: Use as primitives; override spacing, typography, and motion to match this skill—do not default to generic dense admin spacing.
- **q-commerce-optimizer**: Use that skill for order/realtime/ETA logic; use **this** skill for how those flows **look and feel**.
