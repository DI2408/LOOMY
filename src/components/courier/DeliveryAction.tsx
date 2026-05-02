"use client";

import { useActionState, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import {
  checkCanCompleteDelivery,
  completeDelivery,
  type DeliveryActionState,
} from "@/app/courier/delivery/actions";

type Props = {
  orderId: string;
  courierId: string;
  secret: string;
};

/**
 * Bud: geofence-check, afleveringsvalg og "Leveret".
 */
export function DeliveryAction({ orderId, courierId, secret }: Props) {
  const [lat, setLat] = useState<number | "">("");
  const [lng, setLng] = useState<number | "">("");
  const [handoff, setHandoff] = useState("");
  const [proofFileName, setProofFileName] = useState<string | null>(null);
  const [proofImageBase64, setProofImageBase64] = useState("");

  const [checkState, checkAction, checkPending] = useActionState<
    DeliveryActionState,
    FormData
  >(checkCanCompleteDelivery, {});

  const [completeState, completeAction, completePending] = useActionState<
    DeliveryActionState,
    FormData
  >(completeDelivery, {});

  useEffect(() => {
    if (!navigator.geolocation) return;
    // DOM PositionOptions has no distanceFilter (unlike some native SDKs); throttle ~20 m in userland.
    const minMoveM = 20;
    const last = { lat: null as number | null, lng: null as number | null };

    const id = navigator.geolocation.watchPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        if (last.lat != null && last.lng != null) {
          const dLat = lat - last.lat;
          const dLng = lng - last.lng;
          const cosLat = Math.cos((lat * Math.PI) / 180);
          const approxM = Math.hypot(dLat * 111_320, dLng * 111_320 * cosLat);
          if (approxM < minMoveM) return;
        }
        last.lat = lat;
        last.lng = lng;
        setLat(lat);
        setLng(lng);
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 10_000 }
    );
    return () => navigator.geolocation.clearWatch(id);
  }, []);

  useEffect(() => {
    const t = window.setInterval(() => {
      if (typeof lat !== "number" || typeof lng !== "number") return;
      const fd = new FormData();
      fd.set("secret", secret);
      fd.set("orderId", orderId);
      fd.set("courierId", courierId);
      fd.set("courierLat", String(lat));
      fd.set("courierLng", String(lng));
      void checkAction(fd);
    }, 8000);
    return () => window.clearInterval(t);
  }, [lat, lng, orderId, courierId, secret, checkAction]);

  const canPress =
    checkState.canDeliver === true &&
    typeof lat === "number" &&
    typeof lng === "number";

  function onProofFile(f: File | null) {
    setProofImageBase64("");
    setProofFileName(null);
    if (!f) return;
    setProofFileName(f.name);
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result ?? "");
      const base64 = dataUrl.includes(",") ? dataUrl.split(",")[1] ?? "" : dataUrl;
      setProofImageBase64(base64);
    };
    reader.readAsDataURL(f.slice(0, Math.min(f.size, 2_000_000)));
  }

  return (
    <div className="mx-auto max-w-md space-y-4 px-4 py-8">
      <h1 className="text-lg font-semibold text-slate-900">Afslut levering</h1>
      <p className="font-mono text-xs text-slate-500">{orderId}</p>

      <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm shadow-sm">
        <p className="text-slate-600">
          Afstand til kunde:{" "}
          <span className="font-semibold tabular-nums text-slate-900">
            {checkState.distanceMeters != null
              ? `${Math.round(checkState.distanceMeters)} m`
              : "—"}
          </span>
          {checkState.radiusMeters != null && (
            <span className="text-slate-500">
              {" "}
              (max {checkState.radiusMeters} m)
            </span>
          )}
        </p>
        <p className="mt-1 text-xs text-slate-500">
          Geofence:{" "}
          {checkState.canDeliver ? (
            <span className="font-medium text-emerald-700">OK — kan levere</span>
          ) : (
            <span className="font-medium text-amber-700">Ikke inden for zone</span>
          )}
        </p>
      </div>

      <div className="grid gap-2 text-sm">
        <label className="text-slate-600">
          Lat (manuel hvis GPS mangler)
          <input
            type="number"
            step="any"
            value={lat === "" ? "" : lat}
            onChange={(e) =>
              setLat(e.target.value === "" ? "" : Number(e.target.value))
            }
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </label>
        <label className="text-slate-600">
          Lng
          <input
            type="number"
            step="any"
            value={lng === "" ? "" : lng}
            onChange={(e) =>
              setLng(e.target.value === "" ? "" : Number(e.target.value))
            }
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </label>
      </div>

      <form action={checkAction} className="flex gap-2">
        <input type="hidden" name="secret" value={secret} />
        <input type="hidden" name="orderId" value={orderId} />
        <input type="hidden" name="courierId" value={courierId} />
        <input
          type="hidden"
          name="courierLat"
          value={typeof lat === "number" ? lat : ""}
        />
        <input
          type="hidden"
          name="courierLng"
          value={typeof lng === "number" ? lng : ""}
        />
        <button
          type="submit"
          disabled={checkPending}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold active:scale-95 disabled:opacity-50"
        >
          {checkPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Opdater zone"}
        </button>
      </form>

      {(checkState.error ?? completeState.error) && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {checkState.error ?? completeState.error}
        </p>
      )}

      {completeState.ok && (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          Levering registreret.
        </p>
      )}

      <form action={completeAction} className="space-y-4 rounded-xl border border-slate-200 bg-slate-50/80 p-4">
        <input type="hidden" name="secret" value={secret} />
        <input type="hidden" name="orderId" value={orderId} />
        <input type="hidden" name="courierId" value={courierId} />
        <input
          type="hidden"
          name="courierLat"
          value={typeof lat === "number" ? lat : ""}
        />
        <input
          type="hidden"
          name="courierLng"
          value={typeof lng === "number" ? lng : ""}
        />

        <fieldset className="space-y-2">
          <legend className="text-sm font-medium text-slate-800">Aflevering</legend>
          <label className="flex items-center gap-2 text-sm">
            <input type="radio" name="mode" value="handed_to_customer" defaultChecked />
            Afleveret personligt (4-cifret kode)
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="radio" name="mode" value="left_at_door" />
            Efterladt ved dør (foto)
          </label>
        </fieldset>

        <label className="block text-sm text-slate-600">
          Kundens kode
          <input
            name="customerHandoffCode"
            value={handoff}
            onChange={(e) => setHandoff(e.target.value)}
            maxLength={4}
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder="1234"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </label>

        <label className="block text-sm text-slate-600">
          Bevis (ved dør)
          <input
            type="file"
            accept="image/*"
            capture="environment"
            onChange={(e) => void onProofFile(e.target.files?.[0] ?? null)}
            className="mt-1 w-full text-xs"
          />
          {proofFileName && (
            <span className="mt-1 block text-xs text-slate-500">{proofFileName}</span>
          )}
        </label>
        <input type="hidden" name="proofImageBase64" value={proofImageBase64} />

        <button
          type="submit"
          disabled={!canPress || completePending}
          className="w-full rounded-xl bg-slate-900 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 active:scale-95 disabled:opacity-40"
        >
          {completePending ? (
            <span className="inline-flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Sender…
            </span>
          ) : (
            "Leveret"
          )}
        </button>
      </form>
    </div>
  );
}
