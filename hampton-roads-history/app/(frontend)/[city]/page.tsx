import { notFound } from "next/navigation";
import Link from "next/link";
import { getCategories, getFeedArticles } from "@/lib/data";
import { CityEdition } from "@/components/editorial/CityEdition";
import { StoryCard } from "@/components/editorial/StoryCard";
import { NewsletterBand } from "@/components/NewsletterBand";
import { AdFrame } from "@/components/ads/AdFrame";
import { AdSlot } from "@/components/AdSlot";
import { RailPlacement } from "@/components/ads/RailPlacement";
import { PageViewTracker } from "@/components/PageViewTracker";
import { timeAgo } from "@/lib/format";
import { articleHref } from "@/components/ArticleCard";
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

  // DOM mirrors redesign/vapornet/index.html's section screen:
  // .section-page > section-hero + city-tabs + .section-layout
  // (lead + section-ad + city desk rows | .section-rail).
  return (
    <div className="section-page">
      <PageViewTracker citySlug={city} />
      <CityEdition city={current} cities={cities} updatedAt={lead?.published_at ?? null} />

      {articles.length === 0 ? (
        <p style={{ color: "var(--ink-3)" }}>No stories here yet — check back soon.</p>
      ) : (
        <div className="section-layout">
          <div>
            {lead && (
              <article className="section-lead">
                <Link href={articleHref(lead)} className="section-lead-art" aria-label={lead.title}>
                  <span className="map-lines" aria-hidden />
                  <span className="city-coordinate">{current.name}</span>
                </Link>
                <div>
                  <div className="eyebrow">
                    <span>{lead.kicker ?? "Lead story"}</span>
                    <span>{current.name}</span>
                  </div>
                  <h2 style={{ margin: "0 0 10px", font: "900 clamp(26px,3vw,36px)/1.02 var(--display)", letterSpacing: "-.03em" }}>
                    <Link href={articleHref(lead)}>{lead.title}</Link>
                  </h2>
                  {lead.dek && <p style={{ margin: 0, color: "var(--ink-2)", fontSize: 14, lineHeight: 1.55 }}>{lead.dek}</p>}
                  <div className="byline" style={{ marginTop: 12 }}>
                    By {lead.hr_authors?.name ?? "Staff"} · Updated {timeAgo(lead.published_at)}
                  </div>
                  <Link href={articleHref(lead)} className="text-link">
                    Read the full briefing
                  </Link>
                </div>
              </article>
            )}

            <AdFrame label="Advertisement" variant="section-ad" minHeight={90}>
              <AdSlot slotId="section-local-01" variant="minimal" />
            </AdFrame>

            {rest.length > 0 && (
              <>
                <header className="section-heading">
                  <div>
                    <span className="section-kicker">Latest from {current.name}</span>
                    <h2>The city desk</h2>
                  </div>
                  <span>Newest first</span>
                </header>
                {rest.map((a, i) => (
                  <StoryCard key={a.id} article={a} variant="row" index={i + 1} />
                ))}
              </>
            )}

            <NewsletterBand
              title={`${current.name}, in your inbox`}
              copy="Follow the Morning Tide — pick the cities you care about at signup."
              source={`city-band-${city}`}
            />
          </div>

          <aside className="section-rail">
            <section className="data-card">
              <span className="section-kicker">{current.name} at a glance</span>
              <div className="stat">
                <strong>{articles.length}</strong>
                <span>{articles.length === 1 ? "story published" : "stories published"}</span>
              </div>
              <div className="stat">
                <strong>{rest.length}</strong>
                <span>on the city desk</span>
              </div>
              <small>Counts reflect currently published stories.</small>
            </section>
            <RailPlacement slotId="section-rail-01" />
          </aside>
        </div>
      )}
    </div>
  );
}
