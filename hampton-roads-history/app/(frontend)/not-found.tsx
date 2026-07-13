import Link from "next/link";

export default function NotFound() {
  return (
    <main className="wrap py-24 max-w-lg text-center">
      <div className="font-mono text-xs tracking-wide uppercase text-accent-soft mb-3">
        404
      </div>
      <h1 className="font-display font-black text-3xl mb-4">
        This page didn&apos;t make it into the archive.
      </h1>
      <p className="text-ink-2 mb-8">
        The story you&apos;re looking for may have moved, or never existed.
        Try the homepage, or search for what you had in mind.
      </p>
      <div className="flex items-center justify-center gap-3">
        <Link
          href="/"
          className="bg-accent text-white rounded-full px-5 py-2.5 text-sm font-semibold hover:bg-accent-dim transition-colors"
        >
          Back to homepage
        </Link>
        <Link
          href="/search"
          className="border border-line-strong rounded-full px-5 py-2.5 text-sm font-semibold text-ink-2 hover:text-ink transition-colors"
        >
          Search stories
        </Link>
      </div>
    </main>
  );
}
