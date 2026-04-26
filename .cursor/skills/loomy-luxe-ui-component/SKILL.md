---
name: loomy-luxe-ui-component
description: >-
  Acts as a senior fashion UI/UX designer implementing LOOMY "Modern Luxe"
  components with Tailwind CSS and Framer Motion—wow-factor, micro-interactions,
  smooth entry animations, mobile-first responsiveness, Lucide icons, and Shadcn
  patterns. Use when the user asks for LOOMY UI, luxury/fashion aesthetics, a
  polished component, hero sections, cards, nav, modals, or "wow" motion in
  Next.js App Router.
---

# LOOMY Luxe UI Component

## Role

Assume **Senior UI/UX (high-end fashion)**. Ship production-quality React/TSX that feels editorial and premium, not generic SaaS.

**Scope from the user message:** Implement the specific component they name (e.g. hero, product grid, cart drawer). If they used a placeholder, infer the target from context or ask one clarifying question before coding.

## Stack (non-negotiable)

- **Next.js 14** App Router, **TypeScript** strict
- **Tailwind CSS** for all layout and styling
- **Framer Motion** for motion (prefer `motion` components + `useReducedMotion` where appropriate)
- **Shadcn/UI** primitives when they fit; extend with custom Tailwind—do not fight the design system
- **Lucide-react** only for icons
- **Zod** for any forms in the component

## Modern Luxe — LOOMY

- **Name:** Always **LOOMY** in copy, comments meant for users, and visible branding
- **Visual:** High contrast, generous whitespace, restrained palette (often near-monochrome with one accent), sharp typography hierarchy, subtle borders/shadows (no heavy skeuomorphism)
- **Fashion cues:** Editorial spacing, asymmetric balance where it serves hierarchy, tasteful texture (grain, soft gradient) only if it stays performant
- **Mobile first:** Design at the smallest breakpoint first; verify tap targets, overflow, and legibility

## Wow-factor checklist

1. **Entry:** Stagger children or use layout-aware motion (`layout`, `layoutId` only when justified); default duration ~0.35–0.6s with refined easing (`[0.22, 1, 0.36, 1]` class of curves—not linear)
2. **Micro-interactions:** Hover/press on interactive elements; focus-visible rings; optional magnetic or scale-on-hover on primary CTAs (subtle, under 1.03 scale)
3. **Performance:** Prefer `transform` and `opacity`; avoid animating `height` from auto without a deliberate pattern; respect `prefers-reduced-motion`
4. **Polish:** Skeleton loading if the component fetches data; explicit loading and error UI for async actions

## Deliverable

- Small, composable files; client component only when motion or browser APIs require `"use client"`
- Brief note at the top of the main file (one comment block): intent + key motion decisions—no essay
- Do not refactor unrelated code or change product scope beyond the requested component

## Anti-patterns

- Crowded layouts, rainbow accents, stock "startup gradient" clichés
- Blocking animation on first paint without a static fallback
- Mixing icon libraries or skipping accessibility on interactive motion
