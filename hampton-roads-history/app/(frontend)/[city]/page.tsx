import { notFound } from "next/navigation";
import { getCategories, getFeedArticles } from "@/lib/data";
import { CityEdition } from "@/components/editorial/CityEdition";
import { StoryCard } from "@/components/editorial/StoryCard";
import { NewsletterBand } from "@/components/NewsletterBand";
import { AdFrame } from "@/components/ads/AdFrame";
import { AdSlot } from "@/components/AdSlot";
import { RailPlacement } from "@/components/ads/RailPlacement";
import { PageViewTracker } from "@/components/PageViewTracker";
import type { Metadata } from "next";

// Rendered dynamically per-request rather than pre-built with
// generateStaticParams, so the build itself never needs Supabase access
// (useful in sandboxed CI where outbound egress is restricted).
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ city: string }>;
}): Promise<Metadata> {
  const { city } = await params;
  const cities = await getCategories();
  const current = cities.find((c) => c.slug === city);
  if (!current) return {};

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://hamptonroadshistory.com";
  const title = `${current.name} — Hampton Roads History`;
  const description = `Deeply reported local history from ${current.name}, Virginia — part of Hampton Roads History's coverage of the seven cities.`;

  return {
    title,
    description,
    alternates: { canonical: `${siteUrl}/${city}` },
    openGraph: { title, description, url: `${siteUrl}/${city}` },
    twitter: { card: "summary", title, description },
  };
}

export default async function CityPage({ params }: { params: Promise<{ city: string }> }) {
  const { city } = await params;
  const cities = await getCategories();
  const current = cities.find((c) => c.slug === city);
  if (!current) notFound();

  const articles = await getFeedArticles(city, 20);
  const [lead, ...rest] = articles;

  return (
    <main className="shell py-8">
      <PageViewTracker citySlug={city} />
      <CityEdition city={current} cities={cities} />

      {articles.length === 0 ? (
        <p className="text-ink-3">No stories here yet — check back soon.</p>
      ) : (
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_290px]">
          <div className="flex flex-col">
            {lead && (
              <div className="border-b border-line pb-7">
                <StoryCard article={lead} variant="feature" />
              </div>
            )}

            <div className="my-7">
              <AdFrame label="Advertisement" minHeight={90}>
                <AdSlot slotId="section-local-01" variant="minimal" />
              </AdFrame>
            </div>

            {rest.length > 0 && (
              <>
                <header className="mb-1 flex items-end justify-between gap-5 border-b-2 border-federal pb-3">
                  <div>
                    <span className="mb-1 block font-mono text-[8px] uppercase tracking-[.14em] text-accent-soft">
                      Latest from {current.name}
                    </span>
                    <h2 className="font-display text-[26px] font-black tracking-[-0.02em] text-ink">
                      The city desk
                    </h2>
                  </div>
                </header>
                {rest.map((a, i) => (
                  <StoryCard key={a.id} article={a} variant="row" index={i + 1} />
                ))}
              </>
            )}

            <div className="mt-8">
              <NewsletterBand
                title={`${current.name}, in your inbox`}
                copy="Follow the Morning Dispatch — pick the cities you care about at signup."
                source={`city-band-${city}`}
              />
            </div>
          </div>

          <aside className="flex flex-col gap-6">
            <section className="rounded-[2px_16px_2px_16px] bg-surface-2 p-6">
              <span className="mb-1 block font-mono text-[8px] uppercase tracking-[.14em] text-accent-soft">
                {current.name} at a glance
              </span>
              <div className="flex items-baseline justify-between border-b border-line py-3">
                <strong className="font-display text-[31px] font-black text-ink">
                  {articles.length}
                </strong>
                <span className="text-[9px] text-ink-3">
                  {articles.length === 1 ? "story published" : "stories published"}
                </span>
              </div>
            </section>
            <RailPlacement slotId="section-rail-01" />
          </aside>
        </div>
      )}
    </main>
  );
}
