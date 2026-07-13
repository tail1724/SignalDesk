"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

interface SearchResult {
  id: string;
  title: string;
  kicker: string | null;
  city: string | null;
  href: string;
}

const RECENT_KEY = "hr_recent_searches";
const MAX_RECENT = 5;

function getRecentSearches(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function addRecentSearch(query: string) {
  if (typeof window === "undefined") return;
  const recent = getRecentSearches().filter((q) => q !== query);
  recent.unshift(query);
  localStorage.setItem(RECENT_KEY, JSON.stringify(recent.slice(0, MAX_RECENT)));
}

export function OmniSearch() {
  const [open, setOpen] = useState(false);

  // Global Cmd+K / Ctrl+K to open
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === "Escape") {
        setOpen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        aria-label="Search the site"
        className="font-mono text-xs text-ink-2 bg-surface-2 border border-line rounded-full px-4 py-2 hover:border-line-strong transition-colors"
      >
        Find a story ⌘K
      </button>
    );
  }

  // Rendered fresh each time `open` flips true, so query/results/recent all
  // start clean without needing an effect to reset them.
  return <SearchDialog onClose={() => setOpen(false)} />;
}

function SearchDialog({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [recent] = useState<string[]>(() => getRecentSearches());
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Debounced live search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const trimmed = query.trim();
    if (!trimmed) {
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}`);
        const data = await res.json();
        setResults(data.results ?? []);
        setActiveIndex(0);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 150);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const displayResults = query.trim() ? results : [];

  const navigateToResult = useCallback(
    (result: SearchResult) => {
      addRecentSearch(query.trim());
      onClose();
      router.push(result.href);
    },
    [query, router, onClose]
  );

  const submitQuery = useCallback(
    (q: string) => {
      if (!q.trim()) return;
      addRecentSearch(q.trim());
      onClose();
      router.push(`/search?q=${encodeURIComponent(q.trim())}`);
    },
    [router, onClose]
  );

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, Math.max(displayResults.length - 1, 0)));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (displayResults[activeIndex]) {
        navigateToResult(displayResults[activeIndex]);
      } else {
        submitQuery(query);
      }
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] bg-black/40"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search"
        className="w-full max-w-lg bg-surface-1 border border-line-strong rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center border-b border-line px-4">
          <span className="text-ink-3 font-mono text-sm mr-2">⌘K</span>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search Hampton Roads history…"
            aria-label="Search query"
            className="flex-1 bg-transparent py-3.5 text-sm outline-none text-ink placeholder:text-ink-3"
          />
          <button
            onClick={onClose}
            aria-label="Close search"
            className="text-ink-3 hover:text-ink text-xs font-mono"
          >
            esc
          </button>
        </div>

        <div className="max-h-80 overflow-y-auto py-2">
          {loading && (
            <div className="px-4 py-3 text-sm text-ink-3">Searching…</div>
          )}

          {!loading && query.trim() && displayResults.length === 0 && (
            <div className="px-4 py-3 text-sm text-ink-3">
              No stories matched. Press Enter to see full search results.
            </div>
          )}

          {!loading &&
            displayResults.map((result, i) => (
              <button
                key={result.id}
                onClick={() => navigateToResult(result)}
                onMouseEnter={() => setActiveIndex(i)}
                className={`w-full text-left px-4 py-2.5 flex flex-col gap-0.5 transition-colors ${
                  i === activeIndex ? "bg-surface-2" : ""
                }`}
              >
                <span className="text-sm font-semibold text-ink line-clamp-1">
                  {result.title}
                </span>
                <span className="font-mono text-[11px] text-ink-3 uppercase tracking-wide">
                  {result.city ?? "Hampton Roads"}
                  {result.kicker ? ` · ${result.kicker}` : ""}
                </span>
              </button>
            ))}

          {!query.trim() && recent.length > 0 && (
            <div>
              <div className="px-4 py-1.5 font-mono text-[10px] uppercase tracking-wide text-ink-3">
                Recent
              </div>
              {recent.map((q) => (
                <button
                  key={q}
                  onClick={() => submitQuery(q)}
                  className="w-full text-left px-4 py-2 text-sm text-ink-2 hover:bg-surface-2 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
