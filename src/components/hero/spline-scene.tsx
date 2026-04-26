"use client";

import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { Clock3, Sparkles, Store, Truck } from "lucide-react";

const Spline = dynamic(() => import("@splinetool/react-spline"), {
  ssr: false,
  loading: () => <SplineFallback />,
});

type SplineSceneProps = {
  sceneUrl?: string;
};

function SplineFallback() {
  return (
    <div className="relative h-full w-full overflow-hidden rounded-3xl border border-white/20 bg-white/10 backdrop-blur-2xl">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(248,196,113,0.35),transparent_45%),radial-gradient(circle_at_85%_22%,rgba(153,116,255,0.25),transparent_45%),radial-gradient(circle_at_50%_90%,rgba(73,165,255,0.22),transparent_45%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(110deg,rgba(255,255,255,0.06),rgba(255,255,255,0.18),rgba(255,255,255,0.06))] bg-[length:200%_100%] animate-[shimmer_3s_linear_infinite]" />

      <motion.div
        animate={{ y: [0, -10, 0], rotate: [0, 1.5, 0] }}
        transition={{ duration: 5.2, repeat: Infinity, ease: "easeInOut" }}
        className="absolute left-1/2 top-1/2 w-[66%] -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-white/30 bg-white/15 p-5 text-white shadow-[0_18px_55px_rgba(8,12,26,0.45)] backdrop-blur-3xl"
      >
        <div className="flex items-center gap-2 text-white/90">
          <Sparkles size={16} />
          <p className="text-xs font-semibold uppercase tracking-[0.22em]">LUMI Live View</p>
        </div>
        <p className="mt-3 text-2xl font-black leading-tight">Fashion Flow in Motion</p>
        <p className="mt-1 text-xs text-white/80">
          Real-time handoff between boutique and courier.
        </p>
        <div className="mt-4 grid grid-cols-3 gap-2 text-[11px]">
          <div className="rounded-xl border border-white/30 bg-white/10 px-2 py-2">
            <Store size={12} className="mb-1" />
            5 Stores
          </div>
          <div className="rounded-xl border border-white/30 bg-white/10 px-2 py-2">
            <Truck size={12} className="mb-1" />
            3 Couriers
          </div>
          <div className="rounded-xl border border-white/30 bg-white/10 px-2 py-2">
            <Clock3 size={12} className="mb-1" />
            36 min avg
          </div>
        </div>
      </motion.div>

      <motion.div
        animate={{ x: [0, 8, 0], y: [0, -6, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="absolute left-4 top-6 rounded-xl border border-white/35 bg-white/20 px-3 py-1.5 text-[11px] font-semibold text-white backdrop-blur-xl"
      >
        New order to Strom Boutique
      </motion.div>

      <motion.div
        animate={{ x: [0, -7, 0], y: [0, 7, 0] }}
        transition={{ duration: 4.8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-6 right-6 rounded-xl border border-white/35 bg-white/20 px-3 py-1.5 text-[11px] font-semibold text-white backdrop-blur-xl"
      >
        Courier ETA: 12 min
      </motion.div>
    </div>
  );
}

export function SplineScene({ sceneUrl }: SplineSceneProps) {
  if (!sceneUrl) {
    return <SplineFallback />;
  }

  return (
    <div className="h-full w-full overflow-hidden rounded-3xl border border-white/20 bg-white/10 backdrop-blur-2xl">
      <Spline scene={sceneUrl} />
    </div>
  );
}
