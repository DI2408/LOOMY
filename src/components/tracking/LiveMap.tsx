"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Map, { Layer, Marker, Source } from "react-map-gl/mapbox";
import { io, type Socket } from "socket.io-client";
import { Store, UserRound, Bike } from "lucide-react";
import {
  distanceKmClient,
  estimateEtaMinutesClient,
} from "@/lib/tracking/etaClient";

import "mapbox-gl/dist/mapbox-gl.css";

export type LiveMapBootstrap = {
  orderId: string;
  storeLat: number;
  storeLng: number;
  customerLat: number;
  customerLng: number;
};

type LocationUpdate = {
  courierId: string;
  lat: number;
  lng: number;
  ts: string;
  etaPhrase?: string;
};

const ETA_POLL_MS = 60_000;
const ETA_MOVE_KM = 0.25;

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Kunde: live tracking, Mapbox-rute, bud-markør med interpolation og ETA.
 */
export function LiveMap({ bootstrap }: { bootstrap: LiveMapBootstrap }) {
  const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
  const [socket, setSocket] = useState<Socket | null>(null);

  const [displayCourier, setDisplayCourier] = useState({
    lat: bootstrap.storeLat,
    lng: bootstrap.storeLng,
  });
  const targetRef = useRef({
    lat: bootstrap.storeLat,
    lng: bootstrap.storeLng,
  });
  const rafRef = useRef<number | null>(null);

  const center = useMemo(
    () => ({
      lat: (bootstrap.storeLat + bootstrap.customerLat) / 2,
      lng: (bootstrap.storeLng + bootstrap.customerLng) / 2,
    }),
    [bootstrap]
  );

  const routeGeoJson = useMemo(
    () =>
      ({
        type: "Feature" as const,
        properties: {},
        geometry: {
          type: "LineString" as const,
          coordinates: [
            [bootstrap.storeLng, bootstrap.storeLat],
            [bootstrap.customerLng, bootstrap.customerLat],
          ],
        },
      }),
    [bootstrap]
  );

  const [etaMinutes, setEtaMinutes] = useState<number | null>(null);
  const [etaPhrase, setEtaPhrase] = useState<string | null>(null);
  const lastEtaCourierRef = useRef<{ lat: number; lng: number } | null>(null);
  const lastEtaFetchAtRef = useRef(0);

  const tickInterpolation = useCallback(() => {
    setDisplayCourier((prev) => {
      const target = targetRef.current;
      const nextLat = lerp(prev.lat, target.lat, 0.12);
      const nextLng = lerp(prev.lng, target.lng, 0.12);
      const dist =
        Math.abs(nextLat - target.lat) + Math.abs(nextLng - target.lng);
      if (dist < 0.00002) {
        return { lat: target.lat, lng: target.lng };
      }
      return { lat: nextLat, lng: nextLng };
    });
    rafRef.current = requestAnimationFrame(tickInterpolation);
  }, []);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(tickInterpolation);
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, [tickInterpolation]);

  useEffect(() => {
    setEtaMinutes(
      estimateEtaMinutesClient(displayCourier, {
        lat: bootstrap.customerLat,
        lng: bootstrap.customerLng,
      })
    );
  }, [displayCourier, bootstrap.customerLat, bootstrap.customerLng]);

  const fetchEtaFromServer = useCallback(
    async (courier: { lat: number; lng: number }, force: boolean) => {
      const urlToken =
        typeof window !== "undefined"
          ? new URLSearchParams(window.location.search).get("token")
          : null;
      if (!urlToken) return;

      const now = Date.now();
      const prev = lastEtaCourierRef.current;
      const movedKm = prev
        ? distanceKmClient(prev, courier)
        : ETA_MOVE_KM + 1;
      const timeOk = now - lastEtaFetchAtRef.current >= ETA_POLL_MS;
      if (!force && !timeOk && movedKm < ETA_MOVE_KM) {
        return;
      }

      lastEtaCourierRef.current = { ...courier };
      lastEtaFetchAtRef.current = now;

      try {
        const res = await fetch("/api/customer/eta", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId: bootstrap.orderId,
            courierLat: courier.lat,
            courierLng: courier.lng,
            token: urlToken,
          }),
        });
        const data = (await res.json()) as { etaPhrase?: string };
        if (res.ok && data.etaPhrase) {
          setEtaPhrase(data.etaPhrase);
        }
      } catch {
        // keep previous
      }
    },
    [bootstrap.orderId]
  );

  useEffect(() => {
    const id = window.setInterval(() => {
      void fetchEtaFromServer(displayCourier, true);
    }, ETA_POLL_MS);
    return () => window.clearInterval(id);
  }, [displayCourier, fetchEtaFromServer]);

  useEffect(() => {
    void fetchEtaFromServer(displayCourier, false);
  }, [displayCourier, fetchEtaFromServer]);

  useEffect(() => {
    if (!token) return;
    const origin =
      typeof window !== "undefined" ? window.location.origin : "";
    const s = io(origin, { path: "/socket.io", transports: ["websocket"] });
    setSocket(s);
    s.on("connect", () => {
      s.emit("join_order", bootstrap.orderId);
    });
    s.on("location_update", (payload: LocationUpdate) => {
      if (
        typeof payload?.lat === "number" &&
        typeof payload?.lng === "number"
      ) {
        targetRef.current = { lat: payload.lat, lng: payload.lng };
        if (typeof payload.etaPhrase === "string" && payload.etaPhrase.length) {
          setEtaPhrase(payload.etaPhrase);
        }
      }
    });
    return () => {
      s.disconnect();
    };
  }, [bootstrap.orderId, token]);

  if (!token) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">
        Sæt <code className="font-mono">NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN</code> for at vise kortet.
        Opret en nøgle hos{" "}
        <a
          className="font-semibold underline"
          href="https://account.mapbox.com/"
          target="_blank"
          rel="noreferrer"
        >
          Mapbox
        </a>
        .
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm">
        <div className="space-y-1">
          <p className="text-sm font-medium text-slate-800">
            {etaPhrase ?? "Beregner ankomsttid…"}
          </p>
          <p className="text-xs text-slate-500">
            Grov ETA:{" "}
            <span className="font-semibold tabular-nums text-slate-700">
              {etaMinutes != null ? `ca. ${etaMinutes} min` : "—"}
            </span>{" "}
            (fallback)
          </p>
        </div>
        <p className="text-xs text-slate-500">
          Socket: {socket?.connected ? "forbundet" : "forbinder…"}
        </p>
      </div>

      <div className="h-[min(70vh,520px)] w-full overflow-hidden rounded-2xl border border-slate-200 shadow-md">
        <Map
          mapboxAccessToken={token}
          initialViewState={{
            longitude: center.lng,
            latitude: center.lat,
            zoom: 12,
          }}
          style={{ width: "100%", height: "100%" }}
          mapStyle="mapbox://styles/mapbox/light-v11"
        >
          <Source id="route" type="geojson" data={routeGeoJson}>
            <Layer
              id="route-line"
              type="line"
              paint={{
                "line-color": "#0f172a",
                "line-width": 3,
                "line-opacity": 0.55,
              }}
            />
          </Source>

          <Marker
            longitude={bootstrap.storeLng}
            latitude={bootstrap.storeLat}
            anchor="bottom"
          >
            <div className="flex flex-col items-center gap-0.5 text-indigo-700">
              <span className="rounded-full bg-white p-1 shadow ring-1 ring-indigo-200">
                <Store className="h-5 w-5" aria-hidden />
              </span>
              <span className="rounded bg-white/90 px-1.5 text-[10px] font-semibold shadow">
                Butik
              </span>
            </div>
          </Marker>

          <Marker
            longitude={bootstrap.customerLng}
            latitude={bootstrap.customerLat}
            anchor="bottom"
          >
            <div className="flex flex-col items-center gap-0.5 text-emerald-700">
              <span className="rounded-full bg-white p-1 shadow ring-1 ring-emerald-200">
                <UserRound className="h-5 w-5" aria-hidden />
              </span>
              <span className="rounded bg-white/90 px-1.5 text-[10px] font-semibold shadow">
                Dig
              </span>
            </div>
          </Marker>

          <Marker
            longitude={displayCourier.lng}
            latitude={displayCourier.lat}
            anchor="center"
          >
            <div className="flex flex-col items-center text-cyan-700">
              <span className="rounded-full bg-white p-1.5 shadow ring-2 ring-cyan-300">
                <Bike className="h-6 w-6" aria-hidden />
              </span>
            </div>
          </Marker>
        </Map>
      </div>
    </div>
  );
}
