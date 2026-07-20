"use client";

import { useEffect, useRef, useState } from "react";
import { getOrCreateSessionId } from "@/lib/hooks/useSessionId";
import { createBrowserId } from "@/lib/browserSafe";
import { useConsent, readConsentChoice, isMeasurementAllowed } from "@/lib/consent";
import { getPlacementPolicy } from "@/lib/ads/experiment";
import { AdCreative } from "@/components/ads/AdCreative";
import {
  buildEnvelope,
  classifyDevice,
  consentStateFrom,
  routeTypeForPlacement,
  type AdEventEnvelope,
  type AdEventType,
} from "@/lib/ads/envelope";
import { ViewabilityTimer, MRC_MIN_VISIBLE_FRACTION } from "@/lib/ads/viewability";

interface DecisionCreative {
  creative_id: string | null;
  campaign_id: string | null;
  advertiser: string;
  creative_url?: string;
  creative_headline?: string;
  creative_body?: string;
  dest_url: string;
}

interface DecisionResponse {
  decision_id?: string;
  filled: boolean;
  tier?: string | null;
  creative?: DecisionCreative | null;
  hmac_token?: string;
}

export type AdSlotVariant = "leader" | "native" | "rail" | "anchor" | "minimal";

// The leader is the above-the-fold unit adjacent to the LCP hero — request it
// early (600px). Everything else requests as it nears the viewport
// (plan §07.1: "600px root margin for leader; near-viewport for inline").
function nearViewableMargin(variant: AdSlotVariant): string {
  return variant === "leader" ? "600px" : "200px";
}

// The full Epic Y serving chain for one slot. Props are unchanged from the v0
// AdSlot, so DirectSponsor / RailPlacement / PartnerStudioCard / MobileAnchor
// all carry this behaviour without edits.
export function AdSlot({
  slotId,
  articleId,
  variant = "minimal",
}: {
  slotId: string;
  articleId?: string;
  variant?: AdSlotVariant;
}) {
  const [decision, setDecision] = useState<DecisionResponse | null>(null);
  // 'pending' before request, 'collapsed' after a no-demand decision (the
  // containing .ad-frame hides itself via CSS :has), 'filled' once a creative
  // is decided.
  const status: "pending" | "collapsed" | "filled" = !decision
    ? "pending"
    : decision.filled
      ? "filled"
      : "collapsed";

  const rootRef = useRef<HTMLDivElement>(null);
  const creativeRef = useRef<HTMLAnchorElement>(null);
  const requestedRef = useRef(false); // one request per mount — never a timed refresh (plan §07.5)
  const opportunityIdRef = useRef<string>("");
  const envelopeRef = useRef<AdEventEnvelope | null>(null);
  const renderedRef = useRef(false);
  const consent = useConsent();

  // --- Beacon helper: emits a chain event with the shared envelope. Gated on
  // measurement consent (essential-only readers get contextual ads but no
  // measurement). Best-effort; failures never affect the page.
  function beacon(eventType: AdEventType, hmacToken?: string) {
    if (!isMeasurementAllowed()) return;
    const env = envelopeRef.current;
    if (!env) return;
    fetch("/api/ads/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...env, event_type: eventType, hmac_token: hmacToken }),
      keepalive: true,
    }).catch(() => {});
  }

  // --- Request: fire once the slot is near-viewable and consent is resolved.
  useEffect(() => {
    if (requestedRef.current) return;
    const sessionId = getOrCreateSessionId();
    if (!sessionId) return; // null pre-consent — no request, no session id
    const el = rootRef.current;
    if (!el) return;

    const request = () => {
      if (requestedRef.current) return;
      requestedRef.current = true;

      opportunityIdRef.current = createBrowserId();
      const consentState = consentStateFrom(readConsentChoice());
      const experiment = getPlacementPolicy();
      const deviceClass = classifyDevice(window.innerWidth);
      const routeType = routeTypeForPlacement(slotId);

      // Base envelope for pre-decision events (opportunity). decision_id and
      // creative_id are filled in after the decision returns.
      envelopeRef.current = buildEnvelope({
        content_id: articleId ?? null,
        placement_id: slotId,
        opportunity_id: opportunityIdRef.current,
        session_id: sessionId,
        consent_state: consentState,
        experiment,
        device_class: deviceClass,
        route_type: routeType,
      });

      beacon("ad_opportunity");

      fetch("/api/ads/decision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          placement_id: slotId,
          session_id: sessionId,
          opportunity_id: opportunityIdRef.current,
          route_type: routeType,
          content_id: articleId ?? null,
          experiment,
          consent_state: consentState,
          device_class: deviceClass,
        }),
      })
        .then((res) => res.json())
        .then((data: DecisionResponse) => {
          if (data.filled && data.creative) {
            // Enrich the envelope with the decision so render/viewable/click
            // all join back to it.
            envelopeRef.current = {
              ...envelopeRef.current!,
              decision_id: data.decision_id ?? null,
              creative_id: data.creative.creative_id,
              campaign_id: data.creative.campaign_id,
            };
          }
          setDecision(data);
        })
        .catch(() => setDecision({ filled: false }));
    };

    // Request when near-viewable. Wide root margin means the decision resolves
    // (and any no-demand collapse happens) before the slot reaches the screen.
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((en) => en.isIntersecting)) {
          request();
          io.disconnect();
        }
      },
      { rootMargin: nearViewableMargin(variant) }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [slotId, articleId, variant, consent]);

  // --- Render + viewability: once a creative paints, log ad_render and start
  // the MRC viewability timer.
  useEffect(() => {
    if (status !== "filled" || renderedRef.current) return;
    const token = decision?.hmac_token;
    renderedRef.current = true;
    beacon("ad_render", token);

    const el = creativeRef.current;
    if (!el) return;

    let ratio = 0;
    const timer = new ViewabilityTimer(() => {
      beacon("ad_viewable", token);
      cleanup();
    });

    const tick = () => timer.update({ visibleFraction: ratio, tabHidden: document.hidden, now: performance.now() });

    const io = new IntersectionObserver(
      (entries) => {
        ratio = entries[0]?.intersectionRatio ?? 0;
        tick();
      },
      { threshold: [0, 0.25, 0.5, 0.75, 1] }
    );
    io.observe(el);

    // A poll drives accrual while the ad sits still at >=50% with no new IO
    // events. This is measurement only — NOT an ad refresh.
    const poll = window.setInterval(() => {
      if (ratio >= MRC_MIN_VISIBLE_FRACTION && !document.hidden) tick();
    }, 250);
    const onVis = () => tick();
    document.addEventListener("visibilitychange", onVis);

    function cleanup() {
      io.disconnect();
      window.clearInterval(poll);
      document.removeEventListener("visibilitychange", onVis);
    }
    return cleanup;
  }, [status]);

  const handleClick = () => {
    const creative = decision?.creative;
    const token = decision?.hmac_token;
    // Click stays the legacy token-bound count (plan §07.3). House creatives
    // (null id) are not counted.
    if (!creative?.creative_id || !token) return;
    const sessionId = getOrCreateSessionId();
    if (!sessionId || !isMeasurementAllowed()) return;
    fetch("/api/ads/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event_type: "click",
        creative_id: creative.creative_id,
        slot_id: slotId,
        session_id: sessionId,
        hmac_token: token,
        article_id: articleId,
      }),
      keepalive: true,
    }).catch(() => {});
  };

  // Always render the root so it can be observed before a request and so a
  // no-demand result can collapse the containing frame (globals.css hides
  // .ad-frame:has([data-ad-status="collapsed"])).
  return (
    <div ref={rootRef} className="ad-slot" data-ad-status={status} style={{ width: "100%" }}>
      {status === "filled" && decision?.creative && (
        <AdCreative
          ref={creativeRef}
          variant={variant}
          onClick={handleClick}
          data={{
            advertiser: decision.creative.advertiser ?? "Hampton Roads",
            headline: decision.creative.creative_headline,
            body: decision.creative.creative_body,
            destUrl: decision.creative.dest_url,
            imageUrl: decision.creative.creative_url,
            isHouseAd: !decision.creative.creative_id,
          }}
        />
      )}
    </div>
  );
}
