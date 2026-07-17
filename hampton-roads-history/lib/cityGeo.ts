// Public, verifiable coordinates for the seven Hampton Roads cities — used
// only for the CityEdition masthead's civic-coordinate label. Falls back to
// no coordinate for any slug outside this set rather than guessing.
const CITY_COORDS: Record<string, { lat: string; lon: string }> = {
  norfolk: { lat: "36°51′N", lon: "76°17′W" },
  "virginia-beach": { lat: "36°51′N", lon: "75°59′W" },
  hampton: { lat: "37°02′N", lon: "76°21′W" },
  "newport-news": { lat: "37°05′N", lon: "76°28′W" },
  chesapeake: { lat: "36°46′N", lon: "76°17′W" },
  portsmouth: { lat: "36°50′N", lon: "76°18′W" },
  suffolk: { lat: "36°44′N", lon: "76°35′W" },
};

export function cityCoordinate(slug: string): { lat: string; lon: string } | null {
  return CITY_COORDS[slug] ?? null;
}
