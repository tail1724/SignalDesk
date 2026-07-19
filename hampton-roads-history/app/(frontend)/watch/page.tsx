import type { Metadata } from "next";
import { getCategories } from "@/lib/data";
import { BentoGrid, BentoCard } from "@/components/reactbits/MagicBento";
import { WatchlistWidget } from "@/components/rail/WatchlistWidget";
import { WeatherCard } from "@/components/rail/WeatherCard";
import { NewsletterWidget } from "@/components/rail/NewsletterWidget";
import { CityDirectory } from "@/components/rail/CityDirectory";
import { TrendingArticles } from "@/components/TrendingArticles";

export const metadata: Metadata = {
  title: "The Live Desk — Hampton Roads History",
  description:
    "Your Hampton Roads command board: saved stories, what's trending across the seven cities, the local forecast, and the morning briefing.",
};

// Categories are read per request (Supabase egress is dynamic-only here).
export const dynamic = "force-dynamic";

// Surface 4 — the "live desk" as a MagicBento command board. Cards share a
// cursor-tracked spotlight and masked border-glow (signal red); no tilt or
// magnetism so the links inside each cell stay easy to hit. Cells whose child
// widget carries its own card chrome use the bare `--bare` frame.
const RED = "201, 61, 55";

export default async function WatchPage() {
  const cities = await getCategories().catch(() => []);

  return (
    <main className="watch-board">
      <header className="watch-board-head">
        <span className="section-kicker">The live desk</span>
        <h1>Your Hampton Roads command board</h1>
        <p>
          Saved stories, what&apos;s trending across the seven cities, the local
          forecast, and the morning briefing — one place to keep an eye on the
          region.
        </p>
      </header>

      <BentoGrid className="watch-bento" glowColor={RED} spotlightRadius={340} aria-label="Live desk">
        <BentoCard glowColor={RED} className="watch-cell--bare watch-cell--wide">
          <WatchlistWidget />
        </BentoCard>

        <BentoCard glowColor={RED} className="watch-cell--bare">
          <WeatherCard />
        </BentoCard>

        <BentoCard glowColor={RED} className="watch-cell">
          <TrendingArticles limit={5} />
        </BentoCard>

        <BentoCard glowColor={RED} className="watch-cell">
          <h4 className="watch-cell-title">The Morning Tide</h4>
          <p className="mb-3 text-[13px] text-ink-2">
            Five things Hampton Roads needs to know, weekday mornings at 6:30.
          </p>
          <NewsletterWidget source="watch-board" variant="stacked" />
        </BentoCard>

        {cities.length > 0 && (
          <BentoCard glowColor={RED} className="watch-cell--bare">
            <CityDirectory cities={cities} />
          </BentoCard>
        )}
      </BentoGrid>
    </main>
  );
}
