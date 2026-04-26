import type { InputHTMLAttributes } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
};

export function Input({ label, className = "", id, ...props }: InputProps) {
  const inputId = id ?? label.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="space-y-2">
      <label htmlFor={inputId} className="text-xs font-medium text-slate-300">
        {label}
      </label>
      <input
        id={inputId}
        className={`h-11 w-full rounded-xl border border-white/15 bg-white/5 px-3 text-sm text-white placeholder:text-slate-400 focus:border-[#f9a26c] focus:outline-none ${className}`}
        {...props}
      />
    </div>
  );
}
