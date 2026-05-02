import { escapeHtml } from "@/server/store/dashboardHtml";

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
    return new Response("Missing storeId query parameter", { status: 400 });
  }

  const secret = url.searchParams.get("secret") ?? "";
  const base = url.origin;

  const html = `<!DOCTYPE html>
<html lang="da">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>LOOMY — Butiksordrer</title>
  <style>
    :root { font-family: system-ui, sans-serif; color: #0f172a; background: #f8fafc; }
    body { margin: 0; padding: 1.5rem; max-width: 720px; margin-inline: auto; }
    h1 { font-size: 1.25rem; margin-bottom: 0.5rem; }
    p.meta { color: #64748b; font-size: 0.875rem; margin-top: 0; }
    ul { list-style: none; padding: 0; margin: 0; display: grid; gap: 0.75rem; }
    li { border: 1px solid #e2e8f0; border-radius: 12px; padding: 1rem; background: #fff; }
    .row { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 0.5rem; }
    code { font-size: 0.8rem; background: #f1f5f9; padding: 0.15rem 0.35rem; border-radius: 6px; }
    button { cursor: pointer; border: none; border-radius: 10px; padding: 0.5rem 1rem; font-weight: 600;
      background: #0f172a; color: #fff; transition: transform 0.12s; }
    button:active { transform: scale(0.96); }
    button:disabled { opacity: 0.5; cursor: not-allowed; }
    .live { font-size: 0.75rem; padding: 0.25rem 0.5rem; border-radius: 999px; background: #ecfdf5; color: #047857; }
    .offline { background: #fef3c7; color: #92400e; }
    pre { font-size: 0.7rem; overflow: auto; max-height: 120px; margin: 0.5rem 0 0; }
    #status { margin-top: 1rem; font-size: 0.875rem; }
  </style>
</head>
<body>
  <h1>LOOMY — Ordrer (betalt)</h1>
  <p class="meta">Butik: <strong>${escapeHtml(storeId)}</strong></p>
  <p class="meta"><span id="conn" class="live offline">Forbinder til realtime…</span></p>
  <ul id="orders"></ul>
  <p id="status"></p>
  <script>
    const storeId = ${JSON.stringify(storeId)};
    const secret = ${JSON.stringify(secret)};
    const base = ${JSON.stringify(base)};

    const ordersEl = document.getElementById("orders");
    const statusEl = document.getElementById("status");
    const connEl = document.getElementById("conn");

    function setStatus(msg) {
      statusEl.textContent = msg;
    }

    async function loadOrders() {
      const res = await fetch(base + "/api/store/orders?storeId=" + encodeURIComponent(storeId) + "&secret=" + encodeURIComponent(secret));
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Kunne ikke hente ordrer");
      renderOrders(data.orders || []);
    }

    function renderOrders(orders) {
      ordersEl.innerHTML = "";
      if (!orders.length) {
        ordersEl.innerHTML = "<li>Ingen betalte ordrer lige nu.</li>";
        return;
      }
      for (const o of orders) {
        const li = document.createElement("li");
        const details = typeof o.orderDetails === "object" && o.orderDetails !== null
          ? JSON.stringify(o.orderDetails, null, 2)
          : String(o.orderDetails);
        li.innerHTML =
          '<div class="row">' +
          '<div><div><strong>Ordre</strong> <code>' + o.id + '</code></div>' +
          '<div style="font-size:0.75rem;color:#64748b;margin-top:0.25rem">' + (o.offlinePushQueued ? "Offline push i kø" : "") + '</div></div>' +
          '<button type="button" data-order="' + o.id + '">Klar til afhentning</button></div>' +
          '<pre>' + details.replace(/</g, "&lt;") + '</pre>';
        const btn = li.querySelector("button");
        btn.addEventListener("click", () => markReady(o.id, btn));
        ordersEl.appendChild(li);
      }
    }

    async function markReady(orderId, btn) {
      btn.disabled = true;
      setStatus("Opdaterer…");
      try {
        const res = await fetch(base + "/api/store/orders/mark-ready", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId, storeId, secret }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Fejl");
        setStatus("Ordre " + orderId + " er markeret klar til afhentning.");
        await loadOrders();
      } catch (e) {
        setStatus(e.message || "Fejl");
        btn.disabled = false;
      }
    }

    const es = new EventSource(
      base + "/api/store/stream?storeId=" + encodeURIComponent(storeId) + "&secret=" + encodeURIComponent(secret)
    );
    es.addEventListener("open", () => {
      connEl.textContent = "Realtime: online (SSE)";
      connEl.className = "live";
    });
    es.addEventListener("order.paid", () => {
      setStatus("Ny betalt ordre — opdaterer liste…");
      loadOrders().catch((e) => setStatus(e.message));
    });
    es.onerror = () => {
      connEl.textContent = "Realtime: afbrudt (genindlæs siden)";
      connEl.className = "live offline";
    };

    loadOrders().catch((e) => setStatus(e.message));
  </script>
</body>
</html>`;

  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
