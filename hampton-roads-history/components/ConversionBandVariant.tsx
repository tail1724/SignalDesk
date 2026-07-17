"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { NewsletterWidget } from "@/components/rail/NewsletterWidget";
import { getOrCreateSessionId } from "@/lib/hooks/useSessionId";
import { isMeasurementAllowed, useConsent } from "@/lib/consent";

// Exposure + click-through are tracked via hr_page_events (event_type
// encodes the variant, since the events table has no generic metadata
// column for arbitrary experiment data). Audience-measurement consent gates
// this — no beacon before the reader resolves that choice.
function track(eventType: string) {
  if (!isMeasurementAllowed()) return;
  const sessionId = getOrCreateSessionId();
  if (!sessionId) return;

  fetch("/api/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ event_type: eventType, session_id: sessionId }),
    keepalive: true,
  }).catch(() => {
    // Best-effort — analytics failures should never affect the page
  });
}

export function ConversionBandVariant({ variant }: { variant: "a" | "b" }) {
  const exposureFired = useRef(false);
  const consent = useConsent();

  useEffect(() => {
    if (exposureFired.current || !isMeasurementAllowed()) return;
    exposureFired.current = true;
    track(`ab_exposure_${variant}`);
  }, [variant, consent]);

  if (variant === "b") {
    return (
      <section className="rounded-xl border border-line bg-band p-6 flex flex-col sm:flex-row items-center gap-4">
        <h2 className="font-display font-bold text-lg flex-1 text-center sm:text-left">
          Get one great Hampton Roads story a week.
        </h2>
        <div className="w-full sm:w-64">
          <NewsletterWidget
            source="conversion-band-b"
            onSuccess={() => track("ab_conversion_b")}
          />
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-line bg-band p-7 md:p-9 grid grid-cols-1 md:grid-cols-[1fr_auto] gap-6 items-center">
      <div>
        <h2 className="font-display font-black text-2xl md:text-3xl tracking-[-0.02em] mb-2">
          Seven cities. Four centuries. Two minutes a day.
        </h2>
        <p className="text-ink-2 max-w-[52ch] mb-4">
          Don&apos;t come find the news — we&apos;ll bring it to you. Well-researched,
          warmly told, a few mornings a week.
        </p>
        <Link
          href="/search"
          onClick={() => track("ab_conversion_a")}
          className="text-sm font-semibold text-accent hover:text-accent-dim transition-colors"
        >
          Explore the archive →
        </Link>
      </div>
      <div className="w-full md:w-64">
        <NewsletterWidget
          source="conversion-band-a"
          onSuccess={() => track("ab_conversion_a")}
        />
      </div>
    </section>
  );
}
