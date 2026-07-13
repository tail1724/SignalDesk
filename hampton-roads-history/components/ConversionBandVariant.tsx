"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { NewsletterWidget } from "@/components/rail/NewsletterWidget";
import { getOrCreateSessionId } from "@/lib/hooks/useSessionId";

// Exposure + click-through are tracked via hr_page_events (event_type
// encodes the variant, since the events table has no generic metadata
// column for arbitrary experiment data).
function track(eventType: string) {
  fetch("/api/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ event_type: eventType, session_id: getOrCreateSessionId() }),
    keepalive: true,
  }).catch(() => {
    // Best-effort — analytics failures should never affect the page
  });
}

export function ConversionBandVariant({ variant }: { variant: "a" | "b" }) {
  const exposureFired = useRef(false);

  useEffect(() => {
    if (exposureFired.current) return;
    exposureFired.current = true;
    track(`ab_exposure_${variant}`);
  }, [variant]);

  if (variant === "b") {
    return (
      <section className="my-14 rounded-[var(--r-card)] border border-line-strong p-6 flex flex-col sm:flex-row items-center gap-4 bg-surface-1">
        <h2 className="font-display font-bold text-lg flex-1 text-center sm:text-left">
          Get one great Hampton Roads story a week.
        </h2>
        <div className="w-full sm:w-56">
          <NewsletterWidget
            source="conversion-band-b"
            onSuccess={() => track("ab_conversion_b")}
          />
        </div>
      </section>
    );
  }

  return (
    <section className="my-14 rounded-[var(--r-card)] border border-line-strong p-8 md:p-10 grid grid-cols-1 md:grid-cols-[1fr_auto] gap-6 items-center bg-gradient-to-br from-surface-2 to-surface-1">
      <div>
        <h2 className="font-display font-black text-2xl md:text-3xl tracking-tight mb-2">
          Seven cities. Four centuries. One friendly dispatch.
        </h2>
        <p className="text-ink-2 max-w-[52ch] mb-4">
          Hampton Roads is one of the most storied places in America. We bring
          you the good stuff — well-researched, warmly told — a few mornings
          a week.
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
