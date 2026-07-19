"use client";

import { useEffect, useRef } from "react";
import { getOrCreateSessionId } from "@/lib/hooks/useSessionId";
import { readConsentChoice, isMeasurementAllowed } from "@/lib/consent";
import { getPlacementPolicy } from "@/lib/ads/experiment";
import {
  buildEnvelope,
  classifyDevice,
  consentStateFrom,
  type RouteType,
} from "@/lib/ads/envelope";

// Epic Y (plan §07.3): the page_engagement event — the reader-attention signal
// that sits alongside the ad-serving chain in the shared envelope, so yield can
// be read against genuine engagement rather than raw pageviews. Fires once per
// page, on the first hide/unload, carrying dwell time and max scroll depth in
// cwv_context. Gated on measurement consent like every other beacon.
export function PageEngagement({
  routeType,
  contentId,
}: {
  routeType: RouteType;
  contentId?: string;
}) {
  const sentRef = useRef(false);
  const startRef = useRef(0);
  const maxScrollRef = useRef(0);

  useEffect(() => {
    startRef.current = performance.now();

    const onScroll = () => {
      const el = document.documentElement;
      const denom = el.scrollHeight - el.clientHeight;
      const pct = denom > 0 ? Math.min(1, (window.scrollY || el.scrollTop) / denom) : 0;
      if (pct > maxScrollRef.current) maxScrollRef.current = pct;
    };

    const send = () => {
      if (sentRef.current || !isMeasurementAllowed()) return;
      const sessionId = getOrCreateSessionId();
      if (!sessionId) return;
      sentRef.current = true;

      const env = buildEnvelope({
        content_id: contentId ?? null,
        // Page-level signal has no ad placement — a synthetic, queryable id.
        placement_id: `page:${routeType}`,
        opportunity_id: crypto.randomUUID(),
        session_id: sessionId,
        consent_state: consentStateFrom(readConsentChoice()),
        experiment: getPlacementPolicy(),
        device_class: classifyDevice(window.innerWidth),
        route_type: routeType,
        cwv_context: {
          dwell_ms: Math.round(performance.now() - startRef.current),
          max_scroll_pct: Math.round(maxScrollRef.current * 100),
        },
      });

      fetch("/api/ads/event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...env, event_type: "page_engagement" }),
        keepalive: true,
      }).catch(() => {});
    };

    const onHide = () => {
      if (document.visibilityState === "hidden") send();
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", send);
    return () => {
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", send);
      send(); // SPA route change — capture engagement for the page being left
    };
  }, [routeType, contentId]);

  return null;
}
