"use client";

import { useState } from "react";
import Link from "next/link";
import { useBreakingBanner } from "@/lib/hooks/useBreakingBanner";

export function BreakingBanner() {
  const { banner } = useBreakingBanner();
  const [dismissed, setDismissed] = useState(false);

  if (!banner || dismissed) return null;

  const href = banner.article_id
    ? `/[city]/[idSlug]?id=${banner.article_id}`
    : undefined;

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="bg-accent text-white px-5 py-2.5 flex items-center gap-3 text-sm font-medium"
    >
      <span className="bg-white text-accent rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wide uppercase shrink-0">
        Breaking
      </span>
      <div className="flex-1">
        {href ? (
          <Link href={href} className="hover:underline">
            {banner.headline}
          </Link>
        ) : (
          <span>{banner.headline}</span>
        )}
        {banner.description && (
          <p className="text-xs opacity-90 mt-0.5">{banner.description}</p>
        )}
      </div>
      <button
        onClick={() => setDismissed(true)}
        aria-label="Dismiss"
        className="opacity-80 hover:opacity-100 shrink-0"
      >
        ✕
      </button>
    </div>
  );
}
