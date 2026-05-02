import { subscribeCourierOrderSse } from "@/server/courier/courierOrderSseHub";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function unauthorized(): Response {
  return new Response("Unauthorized", { status: 401 });
}

function validateSecret(request: Request): boolean {
  const expected = process.env.COURIER_DISPATCH_SECRET;
  if (!expected) return false;
  const url = new URL(request.url);
  return url.searchParams.get("secret") === expected;
}

export async function GET(request: Request): Promise<Response> {
  if (!validateSecret(request)) {
    return unauthorized();
  }

  const url = new URL(request.url);
  const courierId = url.searchParams.get("courierId")?.trim();
  if (!courierId) {
    return new Response("Missing courierId", { status: 400 });
  }

  const encoder = new TextEncoder();
  let cleanup: (() => void) | null = null;

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const send = (chunk: Uint8Array) => controller.enqueue(chunk);
      const preamble =
        "event: connected\ndata: " +
        JSON.stringify({ courierId, ts: new Date().toISOString() }) +
        "\n\n";
      controller.enqueue(encoder.encode(preamble));
      cleanup = subscribeCourierOrderSse(courierId, send);
    },
    cancel() {
      cleanup?.();
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
