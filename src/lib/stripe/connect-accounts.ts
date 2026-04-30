/**
 * Maps LOOMY store_id → Stripe Connect connected account id (acct_…).
 * Set in env as JSON: LOOMY_STORE_STRIPE_ACCOUNTS={"strom-boutique":"acct_xxx",...}
 */
export function getStripeConnectAccountIdForStore(storeId: string): string | null {
  const raw = process.env.LOOMY_STORE_STRIPE_ACCOUNTS?.trim();
  if (!raw) return null;
  try {
    const map = JSON.parse(raw) as Record<string, string>;
    const id = map[storeId]?.trim();
    return id && id.startsWith("acct_") ? id : null;
  } catch {
    return null;
  }
}

/** Platform fee in basis points (1 bp = 0.01%). Default 100 = 1%. */
export function getApplicationFeeBps(): number {
  const raw = process.env.LOOMY_PLATFORM_FEE_BPS?.trim();
  const n = raw ? Number.parseInt(raw, 10) : 100;
  if (!Number.isFinite(n) || n < 0 || n > 10000) return 100;
  return n;
}

export function applicationFeeAmountMinor(amountMinor: number, bps: number): number {
  return Math.floor((amountMinor * bps) / 10000);
}
