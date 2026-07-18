"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { useRouter } from "next/navigation";

export function WatchlistToggle({
  articleId,
  bare = false,
  labels = { save: "Save", saved: "Saved" },
}: {
  articleId: string;
  /** bare: no utility styling — the parent context (e.g. the prototype's
      .article-actions / .key-people) styles the button. */
  bare?: boolean;
  labels?: { save: string; saved: string };
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [saved, setSaved] = useState(false);
  const [toggling, setToggling] = useState(false);

  // Fetch initial watchlist state. Rendering guards on `user` separately
  // (see `displaySaved` below), so there's nothing to reset here on logout.
  useEffect(() => {
    if (!user) return;

    async function checkWatchlist() {
      const res = await fetch("/api/watchlist");
      if (res.ok) {
        const { watchlist } = await res.json();
        setSaved(watchlist.some((w: { article_id: string }) => w.article_id === articleId));
      }
    }

    checkWatchlist();
  }, [user, articleId]);

  const handleToggle = async () => {
    if (!user) {
      router.push("/account");
      return;
    }

    setToggling(true);
    try {
      if (saved) {
        const res = await fetch(`/api/watchlist/${articleId}`, {
          method: "DELETE",
        });
        if (res.ok) {
          setSaved(false);
        }
      } else {
        const res = await fetch("/api/watchlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ articleId }),
        });
        if (res.ok) {
          setSaved(true);
        }
      }
    } finally {
      setToggling(false);
    }
  };

  const displaySaved = user ? saved : false;

  return (
    <button
      onClick={handleToggle}
      disabled={loading || toggling}
      aria-pressed={displaySaved}
      data-article-id={articleId}
      className={
        bare
          ? undefined
          : `font-mono text-[11px] uppercase tracking-wide rounded-full px-3 py-1.5 border transition-colors disabled:opacity-50 ${
              displaySaved ? "bg-accent border-accent text-white" : "border-line-strong text-ink-2 hover:text-ink"
            }`
      }
    >
      {toggling ? "..." : displaySaved ? labels.saved : labels.save}
    </button>
  );
}
