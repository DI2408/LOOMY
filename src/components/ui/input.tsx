import type { InputHTMLAttributes } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
};

export function Input({ label, className = "", id, ...props }: InputProps) {
  const inputId = id ?? label.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="space-y-2">
      <label htmlFor={inputId} className="text-xs font-medium text-stone-600">
        {label}
      </label>
      <input
        id={inputId}
        className={`h-11 w-full rounded-xl border-[0.5px] border-stone-200 bg-white px-3 text-sm text-stone-900 placeholder:text-stone-400 focus:border-[#8b6914]/50 focus:outline-none focus:ring-2 focus:ring-[#8b6914]/15 ${className}`}
        {...props}
      />
    </div>
  );
}
