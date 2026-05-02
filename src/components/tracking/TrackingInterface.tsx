"use client";

import { LiveMap, type LiveMapBootstrap } from "./LiveMap";

/** @deprecated Brug `LiveMap` — beholdes for bagudkompatibilitet. */
export type TrackingBootstrap = LiveMapBootstrap;

/** @deprecated Brug `LiveMap`. */
export function TrackingInterface({ bootstrap }: { bootstrap: LiveMapBootstrap }) {
  return <LiveMap bootstrap={bootstrap} />;
}
