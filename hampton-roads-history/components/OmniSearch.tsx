"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function OmniSearch() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");

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

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (q.trim()) router.push(`/search?q=${encodeURIComponent(q.trim())}`);
        setOpen(false);
      }}
      className="flex items-center"
    >
      <input
        autoFocus
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onBlur={() => setOpen(false)}
        placeholder="Search Hampton Roads history…"
        className="font-mono text-xs bg-surface-2 border border-line-strong rounded-full px-4 py-2 w-56 outline-none"
      />
    </form>
  );
}
