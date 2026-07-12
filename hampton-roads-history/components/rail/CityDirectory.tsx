import Link from "next/link";
import type { City } from "@/lib/supabase/types";

export function CityDirectory({ cities }: { cities: City[] }) {
  return (
    <div className="bg-surface-1 border border-line rounded-[var(--r-card)] p-5">
      <h4 className="font-mono text-[11px] tracking-wide uppercase text-ink-3 mb-3">Browse by city</h4>
      <div className="flex flex-col">
        {cities.map((c, i) => (
          <Link
            key={c.id}
            href={`/${c.slug}`}
            className={`flex items-center justify-between py-2 text-[13.5px] ${
              i < cities.length - 1 ? "border-b border-line" : ""
            } hover:text-accent-soft`}
          >
            <span>{c.name}</span>
            <span className="font-mono text-ink-3 text-[11px]">→</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
