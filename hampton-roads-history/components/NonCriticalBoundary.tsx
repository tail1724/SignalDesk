"use client";

import { Component, type ReactNode } from "react";

// Safety net for optional client-only experiences (ads, analytics, decorative
// enhancements). These should never replace the article/page content with the
// route error boundary on mobile devices or embedded browsers.
export class NonCriticalBoundary extends Component<
  { children: ReactNode; fallback?: ReactNode; label?: string },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(`${this.props.label ?? "NonCriticalBoundary"}: optional client subtree failed.`, error);
    }
  }

  render() {
    if (this.state.failed) return this.props.fallback ?? null;
    return this.props.children;
  }
}
