import { TextEncoder } from "node:util";

const encoder = new TextEncoder();
type SseSender = (chunk: Uint8Array) => void;
const channels = new Map<string, Set<SseSender>>();

export function subscribeStoreChannel(
  storeId: string,
  send: SseSender
): () => void {
  let set = channels.get(storeId);
  if (!set) {
    set = new Set();
    channels.set(storeId, set);
  }
  set.add(send);
  return () => {
    set!.delete(send);
    if (set!.size === 0) channels.delete(storeId);
  };
}

export function publishStoreChannel(
  storeId: string,
  eventName: string,
  data: unknown
): void {
  const set = channels.get(storeId);
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
