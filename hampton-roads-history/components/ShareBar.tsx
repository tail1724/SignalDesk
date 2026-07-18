"use client";

export function ShareBar({ title, bare = false }: { title: string; bare?: boolean }) {
  async function share() {
    if (navigator.share) {
      try {
        await navigator.share({ title, url: window.location.href });
      } catch {
        // user cancelled — nothing to do
      }
    } else {
      await navigator.clipboard.writeText(window.location.href);
    }
  }

  return (
    <button
      onClick={share}
      className={
        bare
          ? undefined
          : "font-mono text-[11px] uppercase tracking-wide text-ink-2 hover:text-ink border border-line-strong rounded-full px-3 py-1.5"
      }
    >
      Share
    </button>
  );
}
