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

// The LaserFlow beam is an opt-in *desktop* flourish. It spins up a heavy
// WebGL fragment-shader context, and the home hero already runs one WebGL
// context (StoryWorldCanvas). Stacking two more of these on a phone GPU
// froze iOS Safari and tripped "too many active WebGL contexts", so the beam
// only renders on capable pointer devices at desktop width — phones fall back
// to the static navy surface. Also gated off under reduced motion.
const ENABLE_QUERY = "(min-width: 1024px) and (pointer: fine)";
const REDUCE_QUERY = "(prefers-reduced-motion: reduce)";

function subscribeMotion(callback: () => void) {
  const enable = window.matchMedia(ENABLE_QUERY);
  const reduce = window.matchMedia(REDUCE_QUERY);
  enable.addEventListener("change", callback);
  reduce.addEventListener("change", callback);
  return () => {
    enable.removeEventListener("change", callback);
    reduce.removeEventListener("change", callback);
  };
}
function getMotionSnapshot() {
  // `true` = suppress the beam (mobile / coarse pointer / reduced motion).
  const capable = window.matchMedia(ENABLE_QUERY).matches;
  const reduced = window.matchMedia(REDUCE_QUERY).matches;
  return !capable || reduced;
}
function getMotionServerSnapshot() {
  // Suppress on the server until the client confirms it's a capable desktop.
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
  const suppressed = useSyncExternalStore(
    subscribeMotion,
    getMotionSnapshot,
    getMotionServerSnapshot
  );

  if (suppressed) return null;

  return (
    <div className={`rb-laser-layer ${className}`} aria-hidden>
      <LaserFlow color={color} {...laserProps} />
    </div>
  );
}

export default LaserFlowLayer;
