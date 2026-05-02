"use client";

/**
 * Thumb-first slide confirm: drag right to confirm (courier handoff).
 * prefers-reduced-motion: falls back to a primary button tap.
 */
import { useState } from "react";
import { ArrowRight, Check, Loader2, MousePointerClick, MoveRight } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/button";

const spring = { type: "spring" as const, stiffness: 420, damping: 32 };

type SlideActionProps = {
  label: string;
  hint?: string;
  onComplete: () => void | Promise<void>;
};

export function SlideAction({ label, hint = "Træk til højre for at bekræfte", onComplete }: SlideActionProps) {
  const reduceMotion = useReducedMotion();
  const [value, setValue] = useState(0);
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const runComplete = () => {
    if (submitting) return;
    setSubmitting(true);
    void Promise.resolve(onComplete()).finally(() => {
      window.setTimeout(() => {
        setSubmitting(false);
        setDone(false);
        setValue(0);
      }, 400);
    });
  };

  if (reduceMotion) {
    return (
      <Button
        fullWidth
        className="min-h-12"
        disabled={submitting}
        onClick={runComplete}
      >
        <span className="inline-flex items-center gap-2">
          {submitting ? <Loader2 size={16} className="animate-spin" /> : <MousePointerClick size={16} />}
          {label}
        </span>
      </Button>
    );
  }

  const pct = Math.min(100, Math.max(0, value));
  const filled = pct >= 98;

  return (
    <div className="rounded-2xl border-[0.5px] border-stone-200/90 bg-gradient-to-br from-[#faf8f5]/95 via-white to-stone-50/90 p-4 shadow-[0_12px_36px_rgba(28,25,23,0.08)]">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#7c5a10]">Bekræft</p>
          <p className="mt-0.5 text-xs text-stone-500">{hint}</p>
        </div>
        {filled || submitting ? (
          <motion.span
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={spring}
            className="inline-flex items-center gap-1 rounded-full border border-emerald-200/90 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-800"
          >
            {submitting ? <Loader2 size={12} className="animate-spin" aria-hidden /> : <Check size={12} strokeWidth={2.5} aria-hidden />}
            {submitting ? "Sender" : "Klar"}
          </motion.span>
        ) : (
          <span className="rounded-full border-[0.5px] border-stone-200 bg-white/90 px-2.5 py-1 text-[11px] font-medium text-stone-500 tabular-nums">
            {pct}%
          </span>
        )}
      </div>

      <div className="relative min-h-[52px] overflow-hidden rounded-2xl border-[0.5px] border-stone-200/90 bg-stone-100/90 shadow-inner">
        <motion.div
          className="absolute inset-y-0 left-0 rounded-2xl bg-gradient-to-r from-stone-800 via-stone-700 to-[#7c5a10]"
          initial={false}
          animate={{ width: `${pct}%` }}
          transition={{ type: "spring", stiffness: 300, damping: 35 }}
          style={{ opacity: filled ? 1 : 0.92 }}
        />
        <motion.div
          className="pointer-events-none absolute inset-y-2 flex items-center"
          style={{ left: `clamp(8px, calc(${pct}% - 28px), calc(100% - 56px))` }}
          animate={{ scale: filled ? 1.05 : 1 }}
          transition={spring}
        >
          <span className="flex h-10 w-12 items-center justify-center rounded-xl border-[0.5px] border-white/40 bg-white/95 text-stone-800 shadow-md">
            <ArrowRight size={18} strokeWidth={2} aria-hidden />
          </span>
        </motion.div>
        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={value}
          disabled={done || submitting}
          onChange={(event) => {
            const next = Number(event.target.value);
            setValue(next);
            if (next >= 100 && !done && !submitting) {
              setDone(true);
              runComplete();
            }
          }}
          className="slide-action-range absolute inset-0 z-10 h-full w-full cursor-grab touch-none active:cursor-grabbing disabled:cursor-default"
          aria-label={label}
        />
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <p className="text-sm font-medium leading-snug text-stone-800">{label}</p>
        {done || submitting ? (
          <Loader2 size={16} className="animate-spin text-[#7c5a10]" aria-hidden />
        ) : (
          <span className="hidden text-[11px] text-stone-400 sm:inline">Slip ved 100%</span>
        )}
      </div>

      <button
        type="button"
        disabled={submitting}
        onClick={runComplete}
        className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border-[0.5px] border-stone-200/90 bg-white/90 text-sm font-medium text-stone-800 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-70"
      >
        {submitting ? <Loader2 size={16} className="animate-spin" aria-hidden /> : <MoveRight size={16} aria-hidden />}
        Tryk i stedet for slide
      </button>
    </div>
  );
}
