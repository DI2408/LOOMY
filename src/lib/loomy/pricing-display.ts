/**
 * LOOMY checkout: fragt + moms-visning. Varer og fragt antages vist inkl. dansk moms (25 %).
 * "Heraf moms" = udløbsbeløb i vare+fragt-total: total × 25/125 (afrundet ned til hele øre).
 */

const DEFAULT_DELIVERY_MINOR = 49_00; // 49 kr in øre (must match SQL default in migrations)

function deliveryMinorResolved(): number {
  if (typeof process !== "undefined" && process.env.NEXT_PUBLIC_LOOMY_DELIVERY_MINOR) {
    const n = Number.parseInt(process.env.NEXT_PUBLIC_LOOMY_DELIVERY_MINOR, 10);
    if (Number.isFinite(n) && n >= 0) return n;
  }
  if (typeof process !== "undefined" && process.env.LOOMY_DELIVERY_MINOR_DEFAULT) {
    const n = Number.parseInt(process.env.LOOMY_DELIVERY_MINOR_DEFAULT, 10);
    if (Number.isFinite(n) && n >= 0) return n;
  }
  return DEFAULT_DELIVERY_MINOR;
}
const VAT_NUMERATOR = 25;
const VAT_DENOMINATOR = 125; // 25 % moms af pris inkl. moms

export function getDeliveryMinorDefault(): number {
  return deliveryMinorResolved();
}

export type OrderPricingBreakdown = {
  subtotalMinor: number;
  deliveryMinor: number;
  totalInclVatMinor: number;
  /** Momsbeløb indeholdt i total (til kvittering) */
  vatIncludedMinor: number;
  subtotalKr: number;
  deliveryKr: number;
  vatKr: number;
  totalKr: number;
};

export function computeOrderPricingBreakdown(subtotalMinor: number): OrderPricingBreakdown {
  const deliveryMinor = deliveryMinorResolved();
  const totalInclVatMinor = subtotalMinor + deliveryMinor;
  const vatIncludedMinor = Math.floor((totalInclVatMinor * VAT_NUMERATOR) / VAT_DENOMINATOR);
  return {
    subtotalMinor,
    deliveryMinor,
    totalInclVatMinor,
    vatIncludedMinor,
    subtotalKr: Math.round(subtotalMinor / 100),
    deliveryKr: Math.round(deliveryMinor / 100),
    vatKr: Math.round(vatIncludedMinor / 100),
    totalKr: Math.round(totalInclVatMinor / 100),
  };
}
