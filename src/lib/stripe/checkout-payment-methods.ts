/**
 * Explicit Checkout payment methods for DK: card (Apple Pay / Google Pay show as wallet options on Stripe's page),
 * Link, and MobilePay. Override via LOOMY_CHECKOUT_PAYMENT_METHOD_TYPES JSON array of Stripe type strings.
 */
export function getCheckoutPaymentMethodTypes(): string[] {
  const raw = process.env.LOOMY_CHECKOUT_PAYMENT_METHOD_TYPES?.trim();
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed) && parsed.every((x) => typeof x === "string" && x.length > 0)) {
        return parsed as string[];
      }
    } catch {
      // fall through to defaults
    }
  }
  return ["card", "link", "mobilepay"];
}
