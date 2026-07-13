"use client";

import { useEffect, useRef, useState } from "react";

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

function getOrCreateSessionId(): string {
  const key = "hr_session_id";
  let id = sessionStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem(key, id);
  }
  return id;
}

export function AdSlot({ slotId, articleId }: { slotId: string; articleId?: string }) {
  const [ad, setAd] = useState<AdResponse | null>(null);
  const impressionSent = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sessionId = getOrCreateSessionId();

    fetch(`/api/ads/slot/${slotId}`, {
      headers: { "x-session-id": sessionId },
    })
      .then((res) => res.json())
      .then((data: AdResponse) => setAd(data))
      .catch(() => setAd(null));
  }, [slotId]);

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

  const isHouseAd = !ad.creative_id;

  return (
    <div
      ref={containerRef}
      className="bg-surface-1 border border-line rounded-[var(--r-card)] p-5"
      data-slot-id={slotId}
    >
      <div className="font-mono text-[10px] tracking-wide uppercase text-ink-3 mb-2">
        {isHouseAd ? "Community" : "Advertisement"}
      </div>
      <a href={ad.dest_url} onClick={handleClick} className="block group">
        {ad.creative_url ? (
          <img
            src={ad.creative_url}
            alt={ad.advertiser ?? "Advertisement"}
            className="w-full rounded-lg mb-2"
          />
        ) : (
          <>
            <h4 className="font-display font-bold text-sm mb-1 group-hover:text-accent transition-colors">
              {ad.creative_headline}
            </h4>
            {ad.creative_body && (
              <p className="text-[13px] text-ink-2 leading-relaxed">{ad.creative_body}</p>
            )}
          </>
        )}
      </a>
    </div>
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
