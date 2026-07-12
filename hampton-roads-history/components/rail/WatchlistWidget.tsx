"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/hooks/useAuth";

interface WatchlistItem {
  article_id: string;
  created_at: string;
  title?: string;
  excerpt?: string;
}

export function WatchlistWidget() {
  const { user, loading } = useAuth();
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    if (!user || loading) return;

    async function loadWatchlist() {
      setFetching(true);
      try {
        const res = await fetch("/api/watchlist");
        if (res.ok) {
          const { watchlist } = await res.json();
          setWatchlist(watchlist);
        }
      } finally {
        setFetching(false);
      }
    }

    loadWatchlist();
  }, [user, loading]);

  if (loading) {
    return (
      <div className="bg-surface-1 border border-line rounded-[var(--r-card)] p-5 opacity-50">
        <h4 className="font-mono text-[11px] tracking-wide uppercase text-ink-3 mb-2">Your reading list</h4>
        <p className="text-[13px] text-ink-2">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="bg-surface-1 border border-line rounded-[var(--r-card)] p-5">
        <h4 className="font-mono text-[11px] tracking-wide uppercase text-ink-3 mb-2">Your reading list</h4>
        <p className="text-[13px] text-ink-2 mb-3">
          Create a free account to save stories and pick up where you left off, on any device.
        </p>
        <Link
          href="/account?join=1"
          className="block text-center bg-accent text-white rounded-full py-2.5 text-[13px] font-semibold hover:bg-accent-dim transition-colors"
        >
          Create free account
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-surface-1 border border-line rounded-[var(--r-card)] p-5">
      <h4 className="font-mono text-[11px] tracking-wide uppercase text-ink-3 mb-3">Your reading list</h4>
      {fetching ? (
        <p className="text-[13px] text-ink-2">Loading...</p>
      ) : watchlist.length === 0 ? (
        <p className="text-[13px] text-ink-2">No saved articles yet. Start adding them using the save button!</p>
      ) : (
        <div className="space-y-2">
          <p className="text-[11px] text-ink-3 font-mono uppercase tracking-wide">
            {watchlist.length} saved
          </p>
          <Link
            href="/account"
            className="block text-center text-[13px] font-semibold text-accent hover:text-accent-dim"
          >
            View all →
          </Link>
        </div>
      )}
    </div>
  );
}
