import type { PersistedCartLine } from "@/lib/loomy/cart-storage";

export const DEMO_CHECKOUT_SNAPSHOT_KEY = "loomy-demo-checkout-snapshot-v1";

export type DemoCheckoutSnapshot = {
  orderId: string;
  storeId: string;
  storeName: string;
  deliveryAddress: string;
  /** Mirrors OrderStatus in demo flow */
  status: string;
  lines: PersistedCartLine[];
  subtotalKr: number;
  /** Set after simulated payment succeeds */
  simulatedPaymentMethod?: string;
};

export function saveDemoCheckoutSnapshot(snapshot: DemoCheckoutSnapshot): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(DEMO_CHECKOUT_SNAPSHOT_KEY, JSON.stringify(snapshot));
  } catch {
    // ignore
  }
}

export function loadDemoCheckoutSnapshot(): DemoCheckoutSnapshot | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(DEMO_CHECKOUT_SNAPSHOT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DemoCheckoutSnapshot;
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      typeof parsed.orderId !== "string" ||
      !Array.isArray(parsed.lines)
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function clearDemoCheckoutSnapshot(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(DEMO_CHECKOUT_SNAPSHOT_KEY);
  } catch {
    // ignore
  }
}
