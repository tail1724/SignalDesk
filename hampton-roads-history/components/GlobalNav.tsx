import Link from "next/link";
import type { City } from "@/lib/supabase/types";
import { OmniSearch } from "@/components/OmniSearch";
import { ThemeToggle } from "@/components/ThemeToggle";

// Feature-flagged campaign line — final master-brand naming and "America
// begins at the water" are approval gates (design-blueprint.html §10
// "Deliberately deferred"). Flip to true once legal/brand signs off.
const SHOW_CAMPAIGN_TAGLINE = false;

export function GlobalNav({ cities }: { cities: City[] }) {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-base/90 backdrop-blur-md">
      <div className="wrap grid h-[70px] grid-cols-[auto_1fr_auto] items-center gap-4 sm:grid-cols-3">
        <Link
          href="/"
          aria-label="Hampton Roads home"
          className="justify-self-start font-display text-[26px] font-black leading-none tracking-[-0.055em] sm:text-[30px]"
        >
          <span className="text-ink">Hampton</span> <span className="text-accent">Roads</span>
          {SHOW_CAMPAIGN_TAGLINE && (
            <small className="mt-0.5 block font-mono text-[7px] font-normal uppercase tracking-[.22em] text-ink-3">
              America begins at the water
            </small>
          )}
        </Link>

        <div className="hidden justify-self-center sm:block" />

        <div className="flex items-center justify-self-end gap-2.5">
          <OmniSearch />
          <ThemeToggle />
          <Link
            href="/account"
            className="hidden text-[13px] font-semibold text-ink-2 hover:text-ink sm:inline-flex"
          >
            Sign in
          </Link>
          <Link
            href="/account?join=1"
            className="inline-flex h-10 items-center rounded-full bg-accent px-4 text-[13px] font-semibold text-white hover:bg-accent-dim"
          >
            Subscribe
          </Link>
        </div>
      </div>

      <nav
        aria-label="Publication sections"
        className="flex h-10 items-center gap-6 overflow-x-auto border-t border-line px-6 [scrollbar-width:none] sm:justify-center sm:px-0"
      >
        <Link href="/" className="whitespace-nowrap text-[11px] font-bold text-ink-2 hover:text-accent">
          Today
        </Link>
        {cities.map((c) => (
          <Link
            key={c.id}
            href={`/${c.slug}`}
            className="whitespace-nowrap text-[11px] font-bold text-ink-2 hover:text-accent"
          >
            {c.name}
          </Link>
        ))}
        <Link href="/watch" className="whitespace-nowrap text-[11px] font-bold text-ink-2 hover:text-accent">
          Watch
        </Link>
      </nav>
    </header>
  );
}
