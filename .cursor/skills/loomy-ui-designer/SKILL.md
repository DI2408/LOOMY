---
name: loomy-ui-designer
description: >-
  Enforces LOOMY UI standards: Tailwind CSS, Framer Motion, and Shadcn/UI only;
  Modern Luxe aesthetic, micro-interactions, mobile-first polish. Use when
  building or reviewing LOOMY screens, components, layout, motion, or visual
  design in Next.js App Router.
---

# LOOMY UI Designer

## Mandatory stack

For any LOOMY frontend work, **always** use:

- **Tailwind CSS** for layout, spacing, typography, color, responsive breakpoints.
- **Framer Motion** for page transitions, layout animations, hover/tap feedback, and meaningful motion—not gratuitous motion.
- **Shadcn/UI** (Radix primitives) for accessible controls: do not replace with ad-hoc unstyled HTML for patterns Shadcn already covers.

Also align with project defaults: **Lucide-react** icons, **Zod** for forms, **TypeScript** strict, **Next.js 14 App Router**.

## Aesthetic: Modern Luxe

- **High contrast**, generous **whitespace**, restrained **typography scale** (clear hierarchy, no clutter).
- **Cohesive palette**: few base neutrals + one accent system; avoid rainbow or generic “AI slop” gradients unless they serve the brand moment.
- **Depth through subtlety**: borders, rings, soft shadows, and motion—not loud decoration.
- **Polished empty, loading, and error states** (skeletons, gentle motion); never ship placeholder-gray blocks as “done.”

## Micro-interactions

- Prefer **motion with purpose**: stagger lists modestly, `layout`/`layoutId` for shared-element continuity where it helps, **spring-like** or smooth easing (avoid linear UI everywhere).
- **Hover/active/focus** visible and consistent; respect `prefers-reduced-motion`—provide reduced or static fallbacks.
- **Touch targets** and spacing suited to thumbs on small screens first.

## Mobile first

- Design and implement **smallest breakpoint first**; enhance up for tablet/desktop.
- Avoid desktop-only patterns (tiny tap areas, hover-only affordances) without mobile equivalents.

## Code quality bar

- **Do not write boring or boilerplate-heavy UI** when a composable Shadcn pattern, a small motion wrapper, or a Tailwind utility composition would read better.
- Keep components **small and reusable**; match existing project naming and file structure.
- No default “corporate dashboard” look: every screen should feel intentional for **LOOMY**.

## Anti-patterns

- Raw CSS modules or inline styles for things Tailwind + Shadcn solve cleanly—avoid unless integrating third-party that requires it.
- `animate-pulse` on entire pages as the only loading UX—use structured **skeleton** layouts.
- Disabling focus rings or removing accessibility to “look cleaner.”

## When in doubt

Choose the option that feels **more considered on a phone in one hand**—motion subtle, type readable, tap targets confident—while staying **Modern Luxe**.
