"use client";

import type { City } from "@/lib/supabase/types";
import { BentoGrid, BentoCard } from "./MagicBento";

// Surface 3 — "Choose your home view". Replaces the flat pill cloud on the
// cities band with a MagicBento grid: each city is a glowing tile with the
// cursor-tracked spotlight, masked border-glow, and a click ripple. Gold glow
// reads premium on the signal-red band. Whole-tile navigation via the
// stretched overlay link; effects self-disable on touch / reduced motion.
const GOLD = "242, 214, 147";

export function CityBento({ cities }: { cities: City[] }) {
  return (
    <BentoGrid className="city-bento" glowColor={GOLD} spotlightRadius={340} aria-label="Choose your city edition">
      {cities.map((city, i) => (
        <BentoCard
          key={city.id}
          href={`/${city.slug}`}
          ariaLabel={`${city.name} edition`}
          glowColor={GOLD}
          className="city-bento-card"
          clickEffect
        >
          <span className="city-index">{String(i + 1).padStart(2, "0")}</span>
          <span className="city-name">{city.name}</span>
          <span className="city-tag">Local edition</span>
        </BentoCard>
      ))}
    </BentoGrid>
  );
}

export default CityBento;
