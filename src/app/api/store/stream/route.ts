import { storePresence } from "@/server/store/storePresence";
import { subscribeStoreChannel } from "@/server/store/storeChannelHub";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function unauthorized(): Response {
  return new Response("Unauthorized", { status: 401 });
}

function validateSecret(request: Request): boolean {
  const expected = process.env.STORE_DASHBOARD_SECRET;
  if (!expected) return false;
  const url = new URL(request.url);
  return url.searchParams.get("secret") === expected;
}

export async function GET(request: Request): Promise<Response> {
  if (!validateSecret(request)) {
    return unauthorized();
  }

  const url = new URL(request.url);
  const storeId = url.searchParams.get("storeId")?.trim();
  if (!storeId) {
    return new Response("Missing storeId", { status: 400 });
  }

  const encoder = new TextEncoder();
  let cleanup: (() => void) | null = null;

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const send = (chunk: Uint8Array) => controller.enqueue(chunk);
      const preamble =
        "event: connected\ndata: " +
        JSON.stringify({ storeId, ts: new Date().toISOString() }) +
        "\n\n";
      controller.enqueue(encoder.encode(preamble));
      storePresence.markOnline(storeId);
      cleanup = subscribeStoreChannel(storeId, send);
    },
    cancel() {
      cleanup?.();
      storePresence.markOffline(storeId);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
