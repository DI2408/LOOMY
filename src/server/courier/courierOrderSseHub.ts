import { TextEncoder } from "node:util";

const encoder = new TextEncoder();
type SseSender = (chunk: Uint8Array) => void;
const channels = new Map<string, Set<SseSender>>();

export function subscribeCourierOrderSse(
  courierId: string,
  send: SseSender
): () => void {
  let set = channels.get(courierId);
  if (!set) {
    set = new Set();
    channels.set(courierId, set);
  }
  set.add(send);
  return () => {
    set!.delete(send);
    if (set!.size === 0) channels.delete(courierId);
  };
}

export function publishCourierOrderEvent(
  courierId: string,
  eventName: string,
  data: unknown
): void {
  const set = channels.get(courierId);
  if (!set?.size) return;
  const payload = JSON.stringify(data);
  const frame = `event: ${eventName}\ndata: ${payload}\n\n`;
  const bytes = encoder.encode(frame);
  for (const send of set) {
    try {
      send(bytes);
    } catch {
      // disconnected
    }
  }
}
