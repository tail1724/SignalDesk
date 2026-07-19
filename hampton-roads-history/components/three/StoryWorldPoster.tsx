"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import dynamic from "next/dynamic";
import { DecorationBoundary } from "@/components/reactbits/DecorationBoundary";

// ssr:false is only valid inside a Client Component — mirrors the
// OceanBackground.tsx pattern so the `three` bundle loads after the poster
// (the LCP element) has already painted.
const StoryWorldCanvas = dynamic(
  () => import("./StoryWorldCanvas").then((m) => m.StoryWorldCanvas),
  { ssr: false }
);

function subscribeMotion(callback: () => void) {
  const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
  mql.addEventListener("change", callback);
  return () => mql.removeEventListener("change", callback);
}
function getMotionSnapshot() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
function getMotionServerSnapshot() {
  return true;
}

// Cinematic-hero art layers — DOM mirrors redesign/vapornet/index.html
// (.hero-art + .hero-gridlines + .hero-orbit ×2 + .hero-shade); all styling
// comes from the verbatim vapornet.css. Keeps the prototype's pointer
// parallax (prototype.js "VFX lens") and mounts the Three.js scene after
// the poster paints, motion permitting.
//
// The .hero-art background image resolves to
// /public/vapornet/americana-city-inspiration.webp — drop the commissioned,
// region-accurate artwork there (redesign/vapornet/README.md).
export function StoryWorldPoster({ posterSrc }: { posterSrc?: string }) {
  const prefersReducedMotion = useSyncExternalStore(
    subscribeMotion,
    getMotionSnapshot,
    getMotionServerSnapshot
  );
  const artRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef(0);

  useEffect(() => {
    const art = artRef.current;
    const root = art?.parentElement; // the .cinematic-hero section
    if (!root || !art || prefersReducedMotion) return;

    const canParallax = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    if (!canParallax) return;

    function onMove(event: PointerEvent) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = requestAnimationFrame(() => {
        if (!root || !art) return;
        const rect = root.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width - 0.5) * 8;
        const y = ((event.clientY - rect.top) / rect.height - 0.5) * 5;
        art.style.transform = `scale(1.045) translate(${x}px, ${y}px)`;
      });
    }
    function onLeave() {
      if (art) art.style.transform = "";
    }

    root.addEventListener("pointermove", onMove as EventListener);
    root.addEventListener("pointerleave", onLeave);
    return () => {
      cancelAnimationFrame(frameRef.current);
      root.removeEventListener("pointermove", onMove as EventListener);
      root.removeEventListener("pointerleave", onLeave);
    };
  }, [prefersReducedMotion]);

  return (
    <>
      <div
        ref={artRef}
        className="hero-art"
        aria-hidden
        style={posterSrc ? { backgroundImage: `url(${posterSrc})` } : undefined}
      >
        <div className="hero-gridlines" />
        <div className="hero-orbit orbit-one" />
        <div className="hero-orbit orbit-two" />
        {!prefersReducedMotion && (
          <DecorationBoundary>
            <StoryWorldCanvas />
          </DecorationBoundary>
        )}
      </div>
      <div className="hero-shade" aria-hidden />
    </>
  );
}
