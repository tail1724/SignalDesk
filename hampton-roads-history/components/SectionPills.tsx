"use client";

import { useRouter, usePathname } from "next/navigation";
import type { City } from "@/lib/supabase/types";

export function SectionPills({ cities, active }: { cities: City[]; active?: string }) {
  const router = useRouter();
  const pathname = usePathname();

  function go(slug?: string) {
    router.push(slug ? `/${slug}` : "/");
  }

  const items = [{ slug: undefined, name: "All cities" }, ...cities];

  return (
    <div
      role="tablist"
      aria-label="Filter by city"
      className="flex gap-1 overflow-x-auto border-b border-line"
    >
      {items.map((c) => {
        const isActive = c.slug === active || (!c.slug && pathname === "/");
        return (
          <button
            key={c.slug ?? "all"}
            role="tab"
            aria-selected={isActive}
            onClick={() => go(c.slug)}
            className={`text-[14px] font-semibold whitespace-nowrap px-3.5 py-2.5 border-b-2 -mb-px transition-colors ${
              isActive
                ? "text-ink border-accent"
                : "text-ink-3 border-transparent hover:text-ink"
            }`}
          >
            {c.name}
          </button>
        );
      })}
    </div>
  );
}
