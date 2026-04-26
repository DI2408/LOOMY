import type { HTMLAttributes, ReactNode } from "react";

type CardProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
};

export function Card({ children, className = "", ...props }: CardProps) {
  return (
    <div
      {...props}
      className={`rounded-2xl border-[0.5px] border-stone-200/90 bg-white/95 p-5 text-stone-900 shadow-[0_8px_32px_rgba(28,25,23,0.06)] backdrop-blur-sm ${className}`}
    >
      {children}
    </div>
  );
}
