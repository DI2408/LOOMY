"use client";

import { computeOrderPricingBreakdown } from "@/lib/loomy/pricing-display";

type Props = {
  subtotalMinor: number;
  deliveryMinor?: number | null;
  vatIncludedMinor?: number | null;
  totalMinor?: number | null;
  className?: string;
};

/**
 * Receipt-style lines: varer, fragt, heraf moms (25 % af total inkl.), total inkl. moms.
 */
export function OrderPricingSummary({
  subtotalMinor,
  deliveryMinor,
  vatIncludedMinor,
  totalMinor,
  className = "",
}: Props) {
  const fromDb =
    deliveryMinor != null && vatIncludedMinor != null && totalMinor != null;

  const b = fromDb
    ? {
        subtotalKr: Math.round(subtotalMinor / 100),
        deliveryKr: Math.round(deliveryMinor / 100),
        vatKr: Math.round(vatIncludedMinor / 100),
        totalKr: Math.round(totalMinor / 100),
      }
    : computeOrderPricingBreakdown(subtotalMinor);

  return (
    <div className={`space-y-2 border-t-[0.5px] border-stone-200/80 pt-4 text-sm ${className}`}>
      <div className="flex justify-between gap-4 text-stone-700">
        <span>Varer (inkl. moms)</span>
        <span className="tabular-nums font-medium text-stone-900">{b.subtotalKr} kr</span>
      </div>
      <div className="flex justify-between gap-4 text-stone-700">
        <span>Fragt</span>
        <span className="tabular-nums font-medium text-stone-900">{b.deliveryKr} kr</span>
      </div>
      <div className="flex justify-between gap-4 text-stone-600">
        <span className="text-xs leading-snug">Heraf moms (25 %)</span>
        <span className="tabular-nums text-xs">{b.vatKr} kr</span>
      </div>
      <div className="flex justify-between gap-4 border-t-[0.5px] border-stone-200/80 pt-3 font-serif text-lg font-medium text-stone-900">
        <span>Total inkl. moms</span>
        <span className="tabular-nums">{b.totalKr} kr</span>
      </div>
    </div>
  );
}
