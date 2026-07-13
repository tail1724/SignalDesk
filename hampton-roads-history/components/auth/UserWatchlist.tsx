"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import Link from "next/link";

interface Article {
  id: string;
  title: string;
  excerpt: string;
  city: string;
  slug: string;
  published_at: string;
}

interface WatchlistItem {
  article_id: string;
  saved_at: string;
}

export function UserWatchlist() {
  const { user } = useAuth();
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [articles, setArticles] = useState<Record<string, Article>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    async function loadWatchlist() {
      setLoading(true);
      try {
        const res = await fetch("/api/watchlist");
        if (res.ok) {
          const { watchlist } = await res.json();
          setWatchlist(watchlist);
        }
      } finally {
        setLoading(false);
      }
    }

    loadWatchlist();
  }, [user]);

  if (loading) {
    return <p className="text-ink-2">Loading your watchlist...</p>;
  }

  if (watchlist.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-ink-2 mb-4">You haven&apos;t saved any articles yet.</p>
        <Link href="/" className="text-accent hover:text-accent-dim font-semibold">
          Browse articles
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-ink-3">
        {watchlist.length} saved article{watchlist.length !== 1 ? "s" : ""}
      </p>
      {/* TODO: Fetch article details and render as cards once article queries are optimized */}
    </div>
  );
}
