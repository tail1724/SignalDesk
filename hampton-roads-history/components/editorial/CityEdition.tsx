import Link from "next/link";
import type { City } from "@/lib/supabase/types";
import { cityCoordinate } from "@/lib/cityGeo";
import { FollowCityButton } from "@/components/editorial/FollowCityButton";

// City edition identity header + city-tabs strip — DOM mirrors
// redesign/vapornet/index.html (.section-hero + .edition-tools +
// .city-tabs). Sponsorship (rendered by the page below this component)
// never reorders these stories — design-blueprint.html §04/§05.
export function CityEdition({
  city,
  cities,
  updatedAt,
  heroImageUrl,
}: {
  city: City;
  cities: City[];
  updatedAt?: string | null;
  /** Editor-selected section hero image (media library). Optional — the
   *  identity header renders plainly when unset. */
  heroImageUrl?: string;
}) {
  const coord = cityCoordinate(city.slug);
  const updated = updatedAt
    ? new Date(updatedAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
    : null;

  return (
    <>
      <header
        className={heroImageUrl ? "section-hero has-hero-image" : "section-hero"}
        style={
          heroImageUrl
            ? {
                backgroundImage: `linear-gradient(180deg, rgba(10,29,53,0.35), rgba(10,29,53,0.74)), url(${heroImageUrl})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }
            : undefined
        }
      >
        <div>
          <span className="section-kicker">
            City edition{coord ? ` · ${coord.lat}` : ""}
          </span>
          <h1>{city.name}</h1>
          <p>Port, neighborhoods, public life and the decisions shaping {city.name}, Virginia.</p>
        </div>
        <div className="edition-tools">
          {updated && <span>Edition updated {updated}</span>}
          <FollowCityButton citySlug={city.slug} cityName={city.name} />
        </div>
      </header>
      <nav className="city-tabs" aria-label="City editions">
        {cities.map((c) => {
          const active = c.slug === city.slug;
          return (
            <Link
              key={c.id}
              href={`/${c.slug}`}
              aria-current={active ? "page" : undefined}
              className={active ? "active" : undefined}
            >
              {c.name}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
