"use client";

import { useEffect, useRef, useState } from "react";
import { getOrCreateSessionId } from "@/lib/hooks/useSessionId";
import { useConsent } from "@/lib/consent";
import { AdCreative } from "@/components/ads/AdCreative";

interface AdResponse {
  slot_id: string;
  creative_id: string | null;
  advertiser?: string;
  creative_headline?: string;
  creative_body?: string;
  creative_url?: string;
  dest_url: string;
  hmac_token?: string;
  layout_variant?: string;
}

export type AdSlotVariant = "leader" | "native" | "rail" | "anchor" | "minimal";

// Renders only the creative itself — no label, no border, no reserved-size
// chrome. Callers reserve geometry and render the "Advertisement" label via
// AdFrame (components/ads/AdFrame.tsx) so the label always sits outside the
// creative markup, matching the VaporNet ad system spec.
export function AdSlot({
  slotId,
  articleId,
  variant = "minimal",
}: {
  slotId: string;
  articleId?: string;
  variant?: AdSlotVariant;
}) {
  const [ad, setAd] = useState<AdResponse | null>(null);
  const impressionSent = useRef(false);
  const containerRef = useRef<HTMLAnchorElement>(null);
  // Reactive: re-fires once the reader resolves consent (accept or
  // essential-only) so a slot mounted before that moment still serves —
  // no ad request goes out before resolution either way.
  const consent = useConsent();

  useEffect(() => {
    const sessionId = getOrCreateSessionId();
    if (!sessionId) return;

    fetch(`/api/ads/slot/${slotId}`, {
      headers: { "x-session-id": sessionId },
    })
      .then((res) => res.json())
      .then((data: AdResponse) => setAd(data))
      .catch(() => setAd(null));
  }, [slotId, consent]);

  // Fire impression once, when the slot scrolls into view
  useEffect(() => {
    if (!ad || !ad.creative_id || !ad.hmac_token || impressionSent.current) return;
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !impressionSent.current) {
          impressionSent.current = true;
          recordAdEvent(ad, slotId, articleId, "impression");
          observer.disconnect();
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [ad, slotId, articleId]);

  const handleClick = () => {
    if (ad?.creative_id && ad.hmac_token) {
      recordAdEvent(ad, slotId, articleId, "click");
    }
  };

  if (!ad) return null;

  // Creative markup lives in AdCreative (shared with the visual fixtures);
  // styling comes from the verbatim classes in vapornet.css.
  return (
    <AdCreative
      ref={containerRef}
      variant={variant}
      onClick={handleClick}
      data={{
        advertiser: ad.advertiser ?? "Hampton Roads",
        headline: ad.creative_headline,
        body: ad.creative_body,
        destUrl: ad.dest_url,
        imageUrl: ad.creative_url,
        isHouseAd: !ad.creative_id,
      }}
    />
  );
}

function recordAdEvent(
  ad: AdResponse,
  slotId: string,
  articleId: string | undefined,
  eventType: "impression" | "click"
) {
  if (!ad.creative_id || !ad.hmac_token) return;

  const sessionId = getOrCreateSessionId();
  if (!sessionId) return;

  fetch("/api/ads/event", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      creative_id: ad.creative_id,
      slot_id: slotId,
      session_id: sessionId,
      hmac_token: ad.hmac_token,
      event_type: eventType,
      article_id: articleId,
    }),
    keepalive: true,
  }).catch(() => {
    // Best-effort — ad tracking failures should never break the page
  });
}
