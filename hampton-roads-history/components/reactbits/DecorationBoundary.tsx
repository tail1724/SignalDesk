"use client";

import { Component, type ReactNode } from "react";

// Safety net for purely-decorative WebGL/canvas layers (the hero
// StoryWorldCanvas and the LaserFlow beams). Mobile GPUs — iOS Safari in
// particular — can throw when a WebGL context can't be created or is lost
// under memory pressure. Such a throw inside a decorative subtree must never
// take down the whole page (that's what produced the "We hit a snag" error
// boundary on phones). This boundary swallows the error, logs it once, and
// renders the optional static fallback (usually nothing — the CSS art shows
// through) so the page keeps working.
export class DecorationBoundary extends Component<
  { children: ReactNode; fallback?: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("DecorationBoundary: decorative layer failed, rendering fallback.", error);
    }
  }

  render() {
    if (this.state.failed) return this.props.fallback ?? null;
    return this.props.children;
  }
}

export default DecorationBoundary;
