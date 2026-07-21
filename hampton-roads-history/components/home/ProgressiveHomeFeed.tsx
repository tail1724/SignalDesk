"use client";

import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Article } from "@/lib/supabase/types";
import { StoryCard } from "@/components/editorial/StoryCard";
import { NonCriticalBoundary } from "@/components/NonCriticalBoundary";
import { AdFrame } from "@/components/ads/AdFrame";
import { AdSlot } from "@/components/AdSlot";

const EXTRA_AD_EVERY = 5;
const BATCH_SIZE = 6;

type Cursor = { published_at: string | null; id: string };

function cursorFor(article: Article | undefined): string | null {
  if (!article) return null;
  return encodeURIComponent(JSON.stringify({ published_at: article.published_at, id: article.id } satisfies Cursor));
}

export function ProgressiveHomeFeed({ initialRows, startIndex = 4 }: { initialRows: Article[]; startIndex?: number }) {
  const [rows, setRows] = useState(initialRows);
  const [nextCursor, setNextCursor] = useState(() => cursorFor(initialRows.at(-1)));
  const [hasMore, setHasMore] = useState(initialRows.length >= BATCH_SIZE);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore || !nextCursor) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/home-feed?cursor=${nextCursor}&limit=${BATCH_SIZE}`);
      if (!res.ok) throw new Error("Unable to load more stories");
      const data = (await res.json()) as { articles?: Article[]; nextCursor?: string | null; hasMore?: boolean };
      const articles = data.articles ?? [];
      setRows((current) => [...current, ...articles]);
      setNextCursor(data.nextCursor ?? null);
      setHasMore(Boolean(data.hasMore && data.nextCursor));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load more stories");
    } finally {
      setLoading(false);
    }
  }, [hasMore, loading, nextCursor]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) void loadMore();
      },
      { root: null, rootMargin: "900px 0px", threshold: 0 }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loadMore]);

  const renderedRows = useMemo(
    () =>
      rows.map((a, i) => {
        const absoluteRow = i + 1;
        const storyNumber = startIndex + i;
        return (
          <Fragment key={a.id}>
            <div className={i >= BATCH_SIZE ? "lazy-feed-batch" : undefined}>
              <StoryCard article={a} variant="row" index={storyNumber} />
            </div>
            {absoluteRow % EXTRA_AD_EVERY === 0 && (
              <NonCriticalBoundary label="Home feed ad">
                <AdFrame variant="extra-ad" minHeight={97}>
                  <AdSlot slotId="home-feed" variant="minimal" />
                </AdFrame>
              </NonCriticalBoundary>
            )}
          </Fragment>
        );
      }),
    [rows, startIndex]
  );

  return (
    <>
      {renderedRows}
      <div ref={sentinelRef} className="home-feed-sentinel" aria-hidden />
      {error && <p className="feed-load-status" role="status">{error}</p>}
      {hasMore && (
        <button className="feed-load-more" type="button" onClick={() => void loadMore()} disabled={loading}>
          {loading ? "Loading more…" : "Load more stories"}
        </button>
      )}
    </>
  );
}
