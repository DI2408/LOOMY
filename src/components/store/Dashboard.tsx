"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import {
  markOrderReadyForPickup,
  type StoreDashboardActionState,
} from "@/app/store/dashboard/actions";

type PaidOrder = {
  id: string;
  status: string;
  updatedAt: string;
};

export function StoreOrdersDashboard(props: {
  storeId: string;
  secret: string;
  initialOrders: PaidOrder[];
}) {
  const { storeId, secret, initialOrders } = props;

  const [readyState, readyAction, readyPending] = useActionState<
    StoreDashboardActionState,
    FormData
  >(markOrderReadyForPickup, {});

  return (
    <div className="mx-auto max-w-lg space-y-6 px-4 py-8">
      <header>
        <h1 className="text-xl font-semibold text-slate-900">LOOMY — Butik</h1>
        <p className="mt-1 text-sm text-slate-500">
          Ordrer med status <strong>paid</strong> — marker som klar til afhentning.
        </p>
        <p className="mt-1 font-mono text-xs text-slate-400">{storeId}</p>
      </header>

      {readyState.error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {readyState.error}
        </p>
      )}

      {readyState.ok && (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          Opdateret.
        </p>
      )}

      <ul className="space-y-3">
        {initialOrders.length === 0 ? (
          <li className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-600">
            Ingen betalte ordrer lige nu.
          </li>
        ) : (
          initialOrders.map((o) => (
            <li
              key={o.id}
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <p className="font-mono text-sm font-semibold text-slate-900">{o.id}</p>
              <p className="text-xs text-slate-500">
                Opdateret: {new Date(o.updatedAt).toLocaleString("da-DK")}
              </p>
              <form action={readyAction} className="mt-3">
                <input type="hidden" name="secret" value={secret} />
                <input type="hidden" name="storeId" value={storeId} />
                <input type="hidden" name="orderId" value={o.id} />
                <button
                  type="submit"
                  disabled={readyPending}
                  className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 active:scale-95 disabled:opacity-50"
                >
                  {readyPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  ) : null}
                  Klar til afhentning
                </button>
              </form>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
