import Link from "next/link";
import type { City } from "@/lib/supabase/types";
import { cityCoordinate } from "@/lib/cityGeo";
import { FollowCityButton } from "@/components/editorial/FollowCityButton";

// Section/city edition identity header + the city-tabs strip. Sponsorship
// (rendered by the page below this component) never reorders these stories —
// see design-blueprint.html §04/§05.
export function CityEdition({ city, cities }: { city: City; cities: City[] }) {
  const coord = cityCoordinate(city.slug);

  return (
    <div className="mb-7">
      <header
        className="flex min-h-[210px] flex-col justify-end gap-6 overflow-hidden rounded-[2px_24px_2px_24px] p-6 text-white sm:flex-row sm:items-end sm:justify-between sm:p-9"
        style={{
          background:
            "radial-gradient(circle at 80% 15%, rgba(232,190,102,.35), transparent 16%), linear-gradient(110deg, #0a1d35, #17466a)",
        }}
      >
        <div>
          <span className="mb-1.5 block font-mono text-[8px] uppercase tracking-[.14em] text-[#e8c778]">
            City edition{coord ? ` · ${coord.lat} ${coord.lon}` : ""}
          </span>
          <h1 className="font-display text-[44px] font-black leading-[.85] tracking-[-0.055em] sm:text-[64px]">
            {city.name}
          </h1>
          <p className="mt-3 max-w-[560px] text-[13px] text-[#c5d2dc] sm:text-[14px]">
            Port, neighborhoods, public life and the decisions shaping {city.name}, Virginia.
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-start gap-2.5 sm:items-end">
          <FollowCityButton citySlug={city.slug} cityName={city.name} />
        </div>
      </header>

      <nav
        aria-label="City editions"
        className="mt-4 flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none]"
      >
        {cities.map((c) => {
          const active = c.slug === city.slug;
          return (
            <Link
              key={c.id}
              href={`/${c.slug}`}
              aria-current={active ? "page" : undefined}
              className={`shrink-0 whitespace-nowrap rounded-full border px-3 py-2 text-[9px] font-black ${
                active
                  ? "border-accent bg-accent text-white"
                  : "border-line text-ink-2 hover:border-line-strong"
              }`}
            >
              {c.name}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
