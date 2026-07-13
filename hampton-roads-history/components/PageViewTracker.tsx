"use client";

import { useEffect, useRef } from "react";
import { getOrCreateSessionId } from "@/lib/hooks/useSessionId";

const SCROLL_THRESHOLDS = [25, 50, 75, 100] as const;

interface Props {
  articleId?: string;
  articleShortId?: string;
  citySlug?: string;
}

function sendEvent(eventType: string, extra: Props) {
  fetch("/api/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      event_type: eventType,
      session_id: getOrCreateSessionId(),
      article_id: extra.articleId,
      article_short_id: extra.articleShortId,
      city_slug: extra.citySlug,
    }),
    keepalive: true,
  }).catch(() => {
    // Best-effort — analytics failures should never affect the page
  });
}

// Fires exactly once per page load: a pageview on mount, and each scroll
// depth threshold the first time it's crossed. This is the client-side half
// of the bronze -> silver -> gold analytics pipeline — without it,
// hr_page_events never accumulates real signal for HR_aggregate_silver()
// and the trending system has nothing to rank beyond recency.
export function PageViewTracker(props: Props) {
  const firedThresholds = useRef<Set<number>>(new Set());
  const pageviewFired = useRef(false);

  useEffect(() => {
    if (!pageviewFired.current) {
      pageviewFired.current = true;
      sendEvent("pageview", props);
    }

    function handleScroll() {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight <= 0) return;

      const scrolledPercent = (scrollTop / docHeight) * 100;

      for (const threshold of SCROLL_THRESHOLDS) {
        if (scrolledPercent >= threshold && !firedThresholds.current.has(threshold)) {
          firedThresholds.current.add(threshold);
          sendEvent(`scroll_${threshold}`, props);
        }
      }
    }

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll(); // catch pages shorter than the viewport (already "100%")
    return () => window.removeEventListener("scroll", handleScroll);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
