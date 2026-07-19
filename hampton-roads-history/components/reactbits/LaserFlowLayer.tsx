"use client";

import { useSyncExternalStore } from "react";
import dynamic from "next/dynamic";
import type { LaserFlowProps } from "./LaserFlow";

// ssr:false keeps the `three` bundle off the server render and out of the
// initial payload — it loads after the surrounding surface has painted,
// mirroring the StoryWorldPoster/StoryWorldCanvas pattern already in the repo.
const LaserFlow = dynamic(() => import("./LaserFlow").then((m) => m.LaserFlow), {
  ssr: false,
});

function subscribeMotion(callback: () => void) {
  const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
  mql.addEventListener("change", callback);
  return () => mql.removeEventListener("change", callback);
}
function getMotionSnapshot() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
function getMotionServerSnapshot() {
  // Assume reduced motion on the server so nothing WebGL renders until the
  // client confirms the user's preference.
  return true;
}

// Absolutely-positioned decorative laser layer for dark surfaces. The
// LaserFlow canvas is opaque black with a bright beam; `mix-blend-mode:
// screen` (set by `.rb-laser-layer` in reactbits.css) drops the black and
// composites only the beam/fog light over the surface behind it. Renders
// nothing when the user prefers reduced motion.
export function LaserFlowLayer({
  className = "",
  color,
  laserProps,
}: {
  className?: string;
  color: string;
  laserProps?: Omit<LaserFlowProps, "color">;
}) {
  const prefersReducedMotion = useSyncExternalStore(
    subscribeMotion,
    getMotionSnapshot,
    getMotionServerSnapshot
  );

  if (prefersReducedMotion) return null;

  return (
    <div className={`rb-laser-layer ${className}`} aria-hidden>
      <LaserFlow color={color} {...laserProps} />
    </div>
  );
}

export default LaserFlowLayer;
