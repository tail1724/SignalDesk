"use client";

import { useSyncExternalStore } from "react";

// Single source of truth for "may this device mount heavy WebGL?".
// Decorative WebGL (the hero StoryWorldCanvas and the LaserFlow beams) is a
// desktop-only flourish: mobile GPUs — iOS Safari especially — choke on it
// and can throw when a context can't be created, which trips the page error
// boundary ("We hit a snag"). Phones/tablets fall back to the static CSS art.
// Gated on a fine pointer at desktop width, and off under reduced motion.
const ENABLE_QUERY = "(min-width: 1024px) and (pointer: fine)";
const REDUCE_QUERY = "(prefers-reduced-motion: reduce)";

function subscribe(callback: () => void) {
  const enable = window.matchMedia(ENABLE_QUERY);
  const reduce = window.matchMedia(REDUCE_QUERY);
  enable.addEventListener("change", callback);
  reduce.addEventListener("change", callback);
  return () => {
    enable.removeEventListener("change", callback);
    reduce.removeEventListener("change", callback);
  };
}
function getSnapshot() {
  return window.matchMedia(ENABLE_QUERY).matches && !window.matchMedia(REDUCE_QUERY).matches;
}
function getServerSnapshot() {
  // Off on the server until the client confirms it's a capable desktop.
  return false;
}

export function useDesktopGfxEnabled(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
