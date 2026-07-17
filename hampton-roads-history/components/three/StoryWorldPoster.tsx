"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import dynamic from "next/dynamic";

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

// PRODUCTION TODO: this is placeholder art direction (CSS gridlines + orbit
// rings over a federal-navy field), not the commissioned Hampton Roads scene.
// Pass `posterSrc` once the real, region-accurate artwork lands in
// /public/brand/ — see redesign/vapornet/README.md and design-blueprint.html
// §03 "Motion and VFX budget".
export function StoryWorldPoster({ posterSrc }: { posterSrc?: string }) {
  const prefersReducedMotion = useSyncExternalStore(
    subscribeMotion,
    getMotionSnapshot,
    getMotionServerSnapshot
  );
  const artRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef(0);

  useEffect(() => {
    const root = rootRef.current;
    const art = artRef.current;
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

    root.addEventListener("pointermove", onMove);
    root.addEventListener("pointerleave", onLeave);
    return () => {
      cancelAnimationFrame(frameRef.current);
      root.removeEventListener("pointermove", onMove);
      root.removeEventListener("pointerleave", onLeave);
    };
  }, [prefersReducedMotion]);

  return (
    <div ref={rootRef} className="absolute inset-0 overflow-hidden bg-[#10243b]" aria-hidden>
      <div
        ref={artRef}
        className="absolute inset-0 scale-[1.025] bg-cover bg-[52%_center] transition-transform duration-[1200ms] ease-[cubic-bezier(.2,.7,.2,1)]"
        style={posterSrc ? { backgroundImage: `url(${posterSrc})` } : undefined}
      >
        <div
          className="absolute inset-0 opacity-[.23] [mask-image:linear-gradient(90deg,#000,transparent_70%)]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.18) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.18) 1px, transparent 1px)",
            backgroundSize: "58px 58px",
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(90deg, rgba(4,15,29,.96) 0%, rgba(4,15,29,.68) 42%, rgba(4,15,29,.12) 78%), linear-gradient(0deg, rgba(4,15,29,.8), transparent 48%)",
          }}
        />
      </div>
      <div
        className="vn-orbit hidden sm:block"
        style={{ width: 460, height: 460, right: -90, top: -210, animationDuration: "18s" }}
      />
      <div
        className="vn-orbit hidden sm:block"
        style={{
          width: 680,
          height: 680,
          right: -140,
          bottom: -510,
          animationDuration: "26s",
          animationDirection: "reverse",
        }}
      />
      <div
        className="absolute inset-0 -z-10"
        style={{
          background: "radial-gradient(circle at 55% 25%, rgba(201,154,66,.18), transparent 23%)",
        }}
      />
      {!prefersReducedMotion && <StoryWorldCanvas />}
    </div>
  );
}
