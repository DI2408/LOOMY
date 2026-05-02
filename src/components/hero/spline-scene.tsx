"use client";

import dynamic from "next/dynamic";
import { HeroVisualLuxe } from "@/components/hero/hero-visual-luxe";

const Spline = dynamic(() => import("@splinetool/react-spline"), {
  ssr: false,
  loading: () => <HeroVisualLuxe />,
});

type SplineSceneProps = {
  sceneUrl?: string;
};

export function SplineScene({ sceneUrl }: SplineSceneProps) {
  if (!sceneUrl) {
    return <HeroVisualLuxe />;
  }

  return (
    <div className="h-full w-full overflow-hidden rounded-3xl border border-white/20 bg-white/10 backdrop-blur-2xl">
      <Spline scene={sceneUrl} />
    </div>
  );
}
