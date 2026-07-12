import Link from "next/link";
import type { City } from "@/lib/supabase/types";
import { OmniSearch } from "@/components/OmniSearch";

export function GlobalNav({ cities }: { cities: City[] }) {
  return (
    <nav className="sticky top-0 z-40 bg-base/90 backdrop-blur-md border-b border-line">
      <div className="wrap flex items-center gap-6 h-16">
        <Link href="/" className="font-display font-extrabold text-lg tracking-tight leading-tight shrink-0">
          Hampton Roads <span className="text-accent">History</span>
        </Link>
        <div className="hidden lg:flex items-center gap-1 text-[13px] font-medium text-ink-2 overflow-x-auto">
          {cities.map((c) => (
            <Link
              key={c.id}
              href={`/${c.slug}`}
              className="px-3 py-2 rounded-full hover:bg-surface-2 hover:text-ink transition-colors whitespace-nowrap"
            >
              {c.name}
            </Link>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-3 shrink-0">
          <OmniSearch />
          <Link
            href="/account"
            className="hidden sm:inline-flex px-4 py-2 rounded-full border border-line-strong text-[13px] font-semibold hover:bg-surface-2 transition-colors"
          >
            Sign in
          </Link>
          <Link
            href="/account?join=1"
            className="inline-flex px-4 py-2 rounded-full bg-accent text-white text-[13px] font-semibold hover:bg-accent-dim transition-colors"
          >
            Join free
          </Link>
        </div>
      </div>
    </nav>
  );
}
