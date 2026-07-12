import Link from "next/link";

// TODO: once Supabase Auth is wired in the UI, branch on session state and
// read hr_watchlists for the signed-in user instead of always showing the CTA.
export function WatchlistWidget() {
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
