"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import type { City } from "@/lib/supabase/types";

export function SectionPills({ cities, active }: { cities: City[]; active?: string }) {
  const router = useRouter();
  const pathname = usePathname();

  function go(slug?: string) {
    router.push(slug ? `/${slug}` : "/");
  }

  const items = [{ slug: undefined, name: "All cities" }, ...cities];

  return (
    <div role="tablist" aria-label="Filter by city" className="flex flex-wrap gap-2">
      {items.map((c) => {
        const isActive = c.slug === active || (!c.slug && pathname === "/");
        return (
          <button
            key={c.slug ?? "all"}
            role="tab"
            aria-selected={isActive}
            onClick={() => go(c.slug)}
            className={`font-mono text-[11px] tracking-wide uppercase px-4 py-2 rounded-full border transition-colors ${
              isActive
                ? "bg-accent-blue border-accent-blue text-white"
                : "border-line-strong text-ink-2 hover:bg-surface-2"
            }`}
          >
            {c.name}
          </button>
        );
      })}
    </div>
  );
}
