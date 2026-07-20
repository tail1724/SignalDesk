"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="wrap py-24 max-w-lg text-center">
      <div className="font-mono text-xs tracking-wide uppercase text-accent-soft mb-3">
        Something went wrong
      </div>
      <h1 className="font-display font-black text-3xl mb-4">
        We hit a snag loading this page.
      </h1>
      <p className="text-ink-2 mb-8">
        Our team has been notified. In the meantime, try reloading — most
        issues here are temporary.
      </p>
      <button
        onClick={reset}
        className="bg-accent text-white rounded-full px-5 py-2.5 text-sm font-semibold hover:bg-accent-dim transition-colors"
      >
        Try again
      </button>

      {/* TEMPORARY diagnostic: surfaces the actual client error so it can be
          captured on a real device without remote debugging. Remove once the
          mobile-loading issue is confirmed fixed. */}
      <div className="mt-8 text-left">
        <div className="font-mono text-[10px] uppercase tracking-wide text-ink-3 mb-2">
          Diagnostic details
        </div>
        <pre className="whitespace-pre-wrap break-words rounded-lg border border-line bg-surface-2 p-3 font-mono text-[11px] text-ink-2">
          {error?.name ? `${error.name}: ` : ""}
          {error?.message || "(no message)"}
          {error?.digest ? `\n\ndigest: ${error.digest}` : ""}
        </pre>
      </div>
    </main>
  );
}
