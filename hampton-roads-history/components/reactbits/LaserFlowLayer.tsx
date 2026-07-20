"use client";

import dynamic from "next/dynamic";
import type { LaserFlowProps } from "./LaserFlow";
import { DecorationBoundary } from "./DecorationBoundary";
import { useDesktopGfxEnabled } from "@/lib/hooks/useDesktopGfxEnabled";

// ssr:false keeps the `three` bundle off the server render and out of the
// initial payload — it loads after the surrounding surface has painted,
// mirroring the StoryWorldPoster/StoryWorldCanvas pattern already in the repo.
const LaserFlow = dynamic(() => import("./LaserFlow").then((m) => m.LaserFlow), {
  ssr: false,
});

// Absolutely-positioned decorative laser layer for dark surfaces. The
// LaserFlow canvas is opaque black with a bright beam; `mix-blend-mode:
// screen` (set by `.rb-laser-layer` in reactbits.css) drops the black and
// composites only the beam/fog light over the surface behind it.
//
// Desktop-only: the beam is a heavy WebGL fragment-shader context. On phones
// it stacked with the hero canvas and crashed iOS Safari, so it renders only
// on capable desktop devices (see useDesktopGfxEnabled). Wrapped in a
// DecorationBoundary so even a desktop context failure degrades gracefully.
export function LaserFlowLayer({
  className = "",
  color,
  laserProps,
}: {
  className?: string;
  color: string;
  laserProps?: Omit<LaserFlowProps, "color">;
}) {
  const enabled = useDesktopGfxEnabled();

  if (!enabled) return null;

  return (
    <DecorationBoundary>
      <div className={`rb-laser-layer ${className}`} aria-hidden>
        <LaserFlow color={color} {...laserProps} />
      </div>
    </DecorationBoundary>
  );
}

export default LaserFlowLayer;
