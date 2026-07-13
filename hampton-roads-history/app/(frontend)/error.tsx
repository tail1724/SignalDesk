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
    </main>
  );
}
