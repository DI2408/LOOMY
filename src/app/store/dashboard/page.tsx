import { headers } from "next/headers";
import { StoreOrdersDashboard } from "@/components/store/Dashboard";
import { createServiceSupabase } from "@/lib/supabase/service";
import { createSupabaseOrderManagerRepository } from "@/server/orders/orderManagerRepository";

type Search = { storeId?: string; secret?: string };

export default async function StoreDashboardPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const { storeId, secret } = await searchParams;
  const expected = process.env.STORE_DASHBOARD_SECRET;

  if (!expected || secret !== expected || !storeId?.trim()) {
    return (
      <main className="px-4 py-16 text-center text-slate-600">
        <p className="text-sm">Angiv gyldig <code className="font-mono">secret</code> og{" "}
        <code className="font-mono">storeId</code> i URL.</p>
      </main>
    );
  }

  const hdrs = await headers();
  const host = hdrs.get("x-forwarded-host") ?? hdrs.get("host");
  const proto = hdrs.get("x-forwarded-proto") ?? "http";
  const base =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ??
    (host ? `${proto}://${host}` : "");

  let orders: { id: string; status: string; updatedAt: string }[] = [];
  if (base) {
    const res = await fetch(
      `${base}/api/store/orders?storeId=${encodeURIComponent(storeId.trim())}&secret=${encodeURIComponent(secret)}`,
      { cache: "no-store" }
    );
    const data = (await res.json()) as {
      orders?: { id: string; status: string; updatedAt: string }[];
    };
    orders = data.orders ?? [];
  } else {
    const repo = createSupabaseOrderManagerRepository(createServiceSupabase());
    orders = (await repo.listPaidByStore(storeId.trim())).map((o) => ({
      id: o.id,
      status: o.status,
      updatedAt: o.updatedAt,
    }));
  }

  return (
    <StoreOrdersDashboard
      storeId={storeId.trim()}
      secret={secret}
      initialOrders={orders}
    />
  );
}
