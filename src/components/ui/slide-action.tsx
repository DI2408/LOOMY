"use client";

import { useState } from "react";
import { ArrowRight, Sparkles } from "lucide-react";

type SlideActionProps = {
  label: string;
  onComplete: () => void;
};

export function SlideAction({ label, onComplete }: SlideActionProps) {
  const [value, setValue] = useState(0);

  return (
    <div className="rounded-2xl border-[0.5px] border-stone-200/90 bg-gradient-to-r from-[#faf8f5] via-white to-stone-50 p-4 shadow-[0_12px_32px_rgba(28,25,23,0.08)]">
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8b6914]">
          Slide to confirm
        </p>
        <span className="inline-flex items-center gap-1 rounded-full border-[0.5px] border-[#8b6914]/25 bg-white px-2 py-1 text-[10px] font-semibold text-[#6b4f0a]">
          <Sparkles size={11} />
          Smart action
        </span>
      </div>
      <div className="relative">
        <div className="mb-3 h-11 overflow-hidden rounded-xl border-[0.5px] border-stone-200 bg-white">
          <div
            className="h-full rounded-xl bg-gradient-to-r from-stone-800 to-[#8b6914] transition-all duration-150"
            style={{ width: `${Math.max(8, value)}%` }}
          />
        </div>
        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={value}
          onChange={(event) => {
            const next = Number(event.target.value);
            setValue(next);
            if (next >= 100) {
              onComplete();
              setValue(0);
            }
          }}
          className="absolute inset-0 h-11 w-full cursor-pointer opacity-0"
          aria-label={label}
        />
      </div>
      <div className="mt-1 flex items-center justify-between">
        <p className="text-sm font-semibold text-stone-800">{label}</p>
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-stone-500">
          {value}%
          <ArrowRight size={13} />
        </span>
      </div>
    </div>
  );
}
