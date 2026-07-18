"use client";

import { useState } from "react";
import Link from "next/link";
import { useBreakingBanner } from "@/lib/hooks/useBreakingBanner";

// Developing-story ribbon — DOM mirrors redesign/vapornet/index.html
// (.breaking-ribbon: DEVELOPING pill, headline, underlined CTA). The
// civic strip that used to live here moved into GlobalNav where the
// prototype's .news-header places it.
export function LiveRibbon() {
  const { banner } = useBreakingBanner();
  const [dismissed, setDismissed] = useState(false);

  if (!banner || dismissed) return null;

  return (
    <div className="breaking-ribbon" role="status">
      <strong>Developing</strong>
      <span>{banner.headline}</span>
      <Link href="/watch">See the live brief</Link>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label="Dismiss"
        style={{ background: "transparent", border: 0, color: "inherit", cursor: "pointer" }}
      >
        ✕
      </button>
    </div>
  );
}
