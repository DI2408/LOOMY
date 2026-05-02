import { headers } from "next/headers";
import { LiveMap } from "@/components/tracking/LiveMap";

type PageProps = {
  params: Promise<{ orderId: string }>;
  searchParams: Promise<{ token?: string }>;
};

export default async function TrackOrderPage({ params, searchParams }: PageProps) {
  const { orderId } = await params;
  const { token } = await searchParams;
  const expected = process.env.CUSTOMER_TRACKING_SECRET;

  if (!expected || token !== expected) {
    return (
      <main className="mx-auto max-w-lg px-4 py-16 text-center text-slate-600">
        <h1 className="text-lg font-semibold text-slate-900">LOOMY tracking</h1>
        <p className="mt-2 text-sm">Ugyldigt eller manglende token.</p>
      </main>
    );
  }

  const hdrs = await headers();
  const host = hdrs.get("x-forwarded-host") ?? hdrs.get("host");
  const proto = hdrs.get("x-forwarded-proto") ?? "http";
  const base =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ??
    (host ? `${proto}://${host}` : "");

  if (!base) {
    return (
      <main className="mx-auto max-w-lg px-4 py-16 text-sm text-amber-800">
        Kunne ikke bestemme app-URL (mangler Host-header). Sæt{" "}
        <code className="font-mono">NEXT_PUBLIC_APP_URL</code> hvis nødvendigt.
      </main>
    );
  }

  const res = await fetch(
    `${base}/api/customer/tracking/${encodeURIComponent(orderId)}?token=${encodeURIComponent(token)}`,
    { cache: "no-store" }
  );
  const data = (await res.json()) as Record<string, unknown>;

  if (!res.ok || typeof data.storeLat !== "number" || typeof data.storeLng !== "number") {
    return (
      <main className="mx-auto max-w-lg px-4 py-16 text-sm text-slate-600">
        Kunne ikke indlæse ordre eller mangler koordinater i{" "}
        <code className="font-mono">order_details</code> (storeLat/storeLng/customerLat/customerLng).
      </main>
    );
  }

  const customerLat =
    typeof data.customerLat === "number" ? data.customerLat : null;
  const customerLng =
    typeof data.customerLng === "number" ? data.customerLng : null;

  if (customerLat == null || customerLng == null) {
    return (
      <main className="mx-auto max-w-lg px-4 py-16 text-sm text-slate-600">
        Ordren mangler kundekoordinater. Tilføj{" "}
        <code className="font-mono">customerLat</code> /{" "}
        <code className="font-mono">customerLng</code> til{" "}
        <code className="font-mono">order_details</code>.
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-1 text-xl font-semibold tracking-tight text-slate-900">
        Live levering
      </h1>
      <p className="mb-6 text-sm text-slate-500">
        Ordre <span className="font-mono">{orderId}</span>
      </p>
      <LiveMap
        bootstrap={{
          orderId,
          storeLat: data.storeLat as number,
          storeLng: data.storeLng as number,
          customerLat,
          customerLng,
        }}
      />
    </main>
  );
}
