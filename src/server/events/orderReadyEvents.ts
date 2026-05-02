export type OrderReadyPayload = {
  orderId: string;
};

type Listener = (payload: OrderReadyPayload) => void | Promise<void>;

const listeners = new Set<Listener>();

export function subscribeOrderReadyForPickup(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function emitOrderReadyForPickup(payload: OrderReadyPayload): void {
  for (const listener of listeners) {
    void Promise.resolve(listener(payload)).catch((err: unknown) => {
      console.error("[loomy] order.ready_for_pickup listener error", err);
    });
  }
}
