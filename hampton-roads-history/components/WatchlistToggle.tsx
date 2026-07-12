"use client";

import { useState } from "react";

// TODO: wire to Supabase Auth session + hr_watchlists once the sign-in UI
// exists. Currently a local-only toggle so the interaction can be tested.
export function WatchlistToggle({ articleId }: { articleId: string }) {
  const [saved, setSaved] = useState(false);

  return (
    <button
      onClick={() => setSaved((s) => !s)}
      aria-pressed={saved}
      data-article-id={articleId}
      className={`font-mono text-[11px] uppercase tracking-wide rounded-full px-3 py-1.5 border transition-colors ${
        saved ? "bg-accent border-accent text-white" : "border-line-strong text-ink-2 hover:text-ink"
      }`}
    >
      {saved ? "Saved" : "Save"}
    </button>
  );
}
