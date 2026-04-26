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
    <div className="rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50 via-white to-cyan-50 p-4 shadow-[0_10px_28px_-18px_rgba(30,41,59,0.8)]">
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-600">
          Slide to confirm
        </p>
        <span className="inline-flex items-center gap-1 rounded-full border border-indigo-200 bg-white px-2 py-1 text-[10px] font-semibold text-indigo-600">
          <Sparkles size={11} />
          Smart action
        </span>
      </div>
      <div className="relative">
        <div className="mb-3 h-11 overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div
            className="h-full rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-400 transition-all duration-150"
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
        <p className="text-sm font-semibold text-slate-800">{label}</p>
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500">
          {value}%
          <ArrowRight size={13} />
        </span>
      </div>
    </div>
  );
}
