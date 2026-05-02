/**
 * In-process bus for `order.paid` (Node server runtime).
 * Edge Functions / separate workers can call the same DB + push paths instead.
 */

export type StoreOrderDetailsJson = Record<string, unknown>;

export type OrderPaidEventPayload = {
  orderId: string;
  storeId: string;
  orderDetails: StoreOrderDetailsJson;
};

type Listener = (payload: OrderPaidEventPayload) => void | Promise<void>;

const listeners = new Set<Listener>();

export function subscribeOrderPaid(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function emitOrderPaid(payload: OrderPaidEventPayload): void {
  for (const listener of listeners) {
    void Promise.resolve(listener(payload)).catch((err: unknown) => {
      console.error("[loomy] order.paid listener error", err);
    });
  }
}
