"use client";

import { useSyncExternalStore } from "react";
import dynamic from "next/dynamic";

// ssr:false is only valid inside a Client Component (see Next.js's own
// lazy-loading docs) — this thin wrapper exists so HeroBentoGrid itself can
// stay a Server Component while still lazy-loading the `three` bundle.
const OceanCanvas = dynamic(() => import("./OceanCanvas").then((m) => m.OceanCanvas), {
  ssr: false,
});

function subscribe(callback: () => void) {
  const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
  mql.addEventListener("change", callback);
  return () => mql.removeEventListener("change", callback);
}

function getSnapshot() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

// This is decorative, not load-bearing content, so default to "off" for the
// server-rendered/pre-hydration pass rather than risk animating before the
// real client preference is known.
function getServerSnapshot() {
  return true;
}

function usePrefersReducedMotion() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function OceanBackground() {
  const prefersReducedMotion = usePrefersReducedMotion();
  if (prefersReducedMotion) return null;
  return <OceanCanvas />;
}
