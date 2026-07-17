"use client";

import { useEffect, useRef, useState } from "react";
import { getOrCreateSessionId } from "@/lib/hooks/useSessionId";
import { useConsent } from "@/lib/consent";

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

  const isHouseAd = !ad.creative_id;
  const advertiser = ad.advertiser ?? "Hampton Roads";

  if (ad.creative_url) {
    return (
      <a ref={containerRef} href={ad.dest_url} onClick={handleClick} className="block group">
        <img src={ad.creative_url} alt={advertiser} className="w-full rounded-[var(--r-card)]" />
      </a>
    );
  }

  if (variant === "leader") {
    return (
      <a
        ref={containerRef}
        href={ad.dest_url}
        onClick={handleClick}
        className="group flex min-h-[91px] items-center gap-4 px-5 py-3.5"
      >
        <span className="grid h-[55px] w-[55px] shrink-0 place-items-center rounded-full bg-federal font-display text-[19px] font-black text-parchment shadow-[inset_0_0_0_4px_var(--parchment),0_0_0_1px_var(--federal)]">
          {advertiser.slice(0, 2).toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          <small className="block font-mono text-[7px] uppercase tracking-[.12em] text-accent-soft">
            {isHouseAd ? "Community" : "Presented by a regional partner"}
          </small>
          <strong className="mt-1 block truncate font-display text-[20px] font-black text-ink">
            {ad.creative_headline}
          </strong>
        </div>
        <span className="ml-auto shrink-0 text-[10px] font-extrabold underline decoration-1 underline-offset-4 group-hover:text-accent-dim">
          {isHouseAd ? "Learn more" : "Meet the makers"}
        </span>
      </a>
    );
  }

  if (variant === "native") {
    return (
      <a ref={containerRef} href={ad.dest_url} onClick={handleClick} className="grid grid-cols-1 gap-5 p-4 sm:grid-cols-[185px_1fr] sm:items-center">
        <div className="grid min-h-[120px] place-items-center rounded-[2px_12px_2px_12px] bg-federal sm:min-h-[145px]">
          <span className="-rotate-3 font-display text-[26px] font-black leading-[.8] tracking-[-0.04em] text-[#f5cf7c] sm:text-[30px]">
            MADE<br />LOCAL
          </span>
        </div>
        <div>
          <small className="block font-mono text-[7px] uppercase tracking-[.08em] text-ink-3">{advertiser}</small>
          <h3 className="my-1.5 font-display text-[22px] font-black leading-[1.05] text-ink">{ad.creative_headline}</h3>
          {ad.creative_body && <p className="mb-2.5 text-[11px] leading-[1.45] text-ink-2">{ad.creative_body}</p>}
          <span className="text-[9px] font-black text-accent-dim">Explore the series →</span>
        </div>
      </a>
    );
  }

  if (variant === "rail") {
    return (
      <a
        ref={containerRef}
        href={ad.dest_url}
        onClick={handleClick}
        className="flex min-h-[414px] flex-col justify-end p-6 text-white"
        style={{
          background:
            "radial-gradient(circle at 88% 12%, #d7a74c 0 4%, transparent 4.5%), linear-gradient(160deg, transparent 0 47%, rgba(255,255,255,.2) 47% 48%, transparent 48%), var(--federal)",
        }}
      >
        <small className="text-[7px] font-mono uppercase tracking-[.1em] text-[#e8c778]">
          {isHouseAd ? "Community partner" : "Regional partner"}
        </small>
        <strong className="mt-3 font-display text-[40px] font-black leading-[.85] tracking-[-0.045em]">
          {ad.creative_headline}
        </strong>
        {ad.creative_body && <p className="my-4 text-[11px] leading-[1.45] text-[#bfccda]">{ad.creative_body}</p>}
        <span className="text-[9px] font-black underline decoration-1 underline-offset-4">Discover the series</span>
      </a>
    );
  }

  if (variant === "anchor") {
    return (
      <a
        ref={containerRef}
        href={ad.dest_url}
        onClick={handleClick}
        className="flex min-w-0 flex-1 items-center gap-1"
      >
        <div className="min-w-0">
          <span className="block font-mono text-[6px] uppercase tracking-[.1em] text-[#aebdcc]">
            {isHouseAd ? "Community" : "Advertisement"}
          </span>
          <strong className="block truncate text-[9px] text-white">{ad.creative_headline}</strong>
        </div>
        <span className="ml-auto shrink-0 text-[8px] font-black text-white">Open</span>
      </a>
    );
  }

  // minimal — small text-only unit for extra/section-local placements
  return (
    <a
      ref={containerRef}
      href={ad.dest_url}
      onClick={handleClick}
      className="flex min-h-[72px] items-center justify-between gap-5 px-5 py-4"
    >
      <strong className="font-display text-[17px] font-black text-ink">{ad.creative_headline}</strong>
      <span className="shrink-0 text-[9px] font-black text-accent-dim">Learn more →</span>
    </a>
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
