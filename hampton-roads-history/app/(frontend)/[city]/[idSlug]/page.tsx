import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";
import Link from "next/link";
import Image from "next/image";
import { getArticleByShortId, getRelatedArticles } from "@/lib/data";
import { articleHref } from "@/components/ArticleCard";
import { parseShortId } from "@/lib/format";
import { lexicalWordCount } from "@/lib/lexical";
import { WatchlistToggle } from "@/components/WatchlistToggle";
import { ShareBar } from "@/components/ShareBar";
import { ArticleBody } from "@/components/ArticleBody";
import { NewsletterBand } from "@/components/NewsletterBand";
import { PageViewTracker } from "@/components/PageViewTracker";
import { NonCriticalBoundary } from "@/components/NonCriticalBoundary";
import { CorrectionsLog } from "@/components/editorial/CorrectionsLog";
import { SourceNotes } from "@/components/editorial/SourceNotes";
import { ContextRail } from "@/components/editorial/ContextRail";
import { SmartBrief } from "@/components/editorial/SmartBrief";
import { ReadingProgress } from "@/components/editorial/ReadingProgress";
import { DirectSponsor } from "@/components/ads/DirectSponsor";
import { RailPlacement } from "@/components/ads/RailPlacement";
import { MobileAnchor } from "@/components/ads/MobileAnchor";
import { RevenueInlineAd } from "@/components/ads/RevenueInlineAd";
import { PageEngagement } from "@/components/ads/PageEngagement";
import { canShowFirstInline, INLINE_AD_MIN_WORDS } from "@/lib/ads/density";
import { getHeroImageUrl, articleHeroSrc, articleHeroAlt } from "@/lib/images";
import type { Metadata } from "next";

type Props = { params: Promise<{ city: string; idSlug: string }> };

// Required for CSP nonce support (the nonce is minted per-request in proxy.ts)
export const dynamic = "force-dynamic";

// Density rules (design-blueprint.html §05) live in lib/ads/density.ts as pure,
// unit-tested functions — imported above so there is one source of truth for
// the 600 / 1400 / 450-word boundaries.

async function resolveArticle(idSlug: string) {
  const shortId = parseShortId(idSlug);
  if (!shortId) return null;
  return getArticleByShortId(shortId);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { idSlug } = await params;
  const article = await resolveArticle(idSlug);
  if (!article) return {};

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://hamptonroadshistory.com";
  const url = `${siteUrl}${articleHref(article)}`;
  // Every article gets a valid 1200x630 share image, even without a hero
  // photo: the hero (if present) for stories that have one, otherwise the
  // branded dynamic OG generator at /api/og/[idSlug].
  const ogImage = article.hero_image_url
    ? getHeroImageUrl(article.hero_image_url)
    : `${siteUrl}/api/og/${idSlug}`;

  return {
    title: `${article.title} — Hampton Roads History`,
    description: article.dek ?? undefined,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      title: article.title,
      description: article.dek ?? undefined,
      url,
      publishedTime: article.published_at ?? undefined,
      authors: article.hr_authors?.name ? [article.hr_authors.name] : undefined,
      images: [{ url: ogImage, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description: article.dek ?? undefined,
      images: [ogImage],
    },
  };
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function formatUpdated(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric" }) +
    " at " +
    d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

export default async function ArticlePage({ params }: Props) {
  const { city, idSlug } = await params;
  const article = await resolveArticle(idSlug);
  if (!article) notFound();

  const canonical = articleHref(article);
  const requested = `/${city}/${idSlug}`;
  if (requested !== canonical) {
    redirect(canonical);
  }

  const related = await getRelatedArticles(city, article.id, 3, article.kicker);
  const nonce = (await headers()).get("x-nonce") ?? undefined;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://hamptonroadshistory.com";
  const articleUrl = `${siteUrl}${canonical}`;
  const heroImage = article.hero_image_url
    ? getHeroImageUrl(article.hero_image_url)
    : `${siteUrl}/api/og/${idSlug}`;
  const wordCount = lexicalWordCount(article.body_lexical);
  const briefItems = article.dek ? [{ term: "Why it matters", description: article.dek }] : [];
  const authorName = article.hr_authors?.name ?? "Staff";
  const heroSrc = articleHeroSrc(article);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: article.title,
    description: article.dek ?? undefined,
    image: [heroImage],
    datePublished: article.published_at ?? undefined,
    dateModified: article.published_at ?? undefined,
    author: article.hr_authors?.name
      ? { "@type": "Person", name: article.hr_authors.name }
      : undefined,
    publisher: {
      "@type": "Organization",
      name: "Hampton Roads History",
      logo: { "@type": "ImageObject", url: `${siteUrl}/favicon.ico` },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": articleUrl },
  };

  // DOM mirrors redesign/vapornet/index.html's article screen:
  // .article-wrap > .article-header + figure.article-hero + .article-grid
  // (.article-body + .article-rail > .rail-sticky). Styling: vapornet.css.
  return (
    <>
      <ReadingProgress targetId="article-wrap" />
      <main id="article-wrap" className="article-wrap">
        <NonCriticalBoundary label="PageViewTracker">
          <PageViewTracker articleId={article.id} articleShortId={article.short_id} citySlug={city} />
        </NonCriticalBoundary>
        <script
          type="application/ld+json"
          nonce={nonce}
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />

        <header className="article-header">
          <div className="eyebrow">
            {article.kicker && <span>{article.kicker}</span>}
            {article.hr_categories?.name && (
              <span>
                <Link href={`/${city}`}>{article.hr_categories.name}</Link>
              </span>
            )}
          </div>
          <h1>{article.title}</h1>
          {article.dek && <p className="dek">{article.dek}</p>}
          <div className="article-meta">
            <div className="author-avatar">{initials(authorName)}</div>
            <div>
              <strong>{authorName}</strong>
              <span>
                Updated {formatUpdated(article.published_at)}
                {article.read_time_min ? ` · ${article.read_time_min} min read` : ""}
              </span>
            </div>
            <div className="article-actions">
              <WatchlistToggle articleId={article.id} bare />
              <ShareBar title={article.title} bare />
              <button type="button" disabled title="Audio versions are coming soon">
                Listen
              </button>
            </div>
          </div>
        </header>

        <figure className="article-hero">
          <div className="article-hero-art">
            {heroSrc && (
              <Image
                src={heroSrc}
                alt={articleHeroAlt(article)}
                fill
                priority
                sizes="(min-width: 1120px) 1064px, 100vw"
                className="object-cover"
              />
            )}
          </div>
          <figcaption>
            <span>{articleHeroAlt(article) || article.title}</span>
            <span>{article.hero_image_url ? "Photograph" : "Illustration"} · Hampton Roads</span>
          </figcaption>
        </figure>

        <div className="article-grid">
          <article className="article-body">
            {briefItems.length > 0 && <SmartBrief heading="What you need to know" items={briefItems} />}

            <ArticleBody body={article.body_lexical} title={article.title} />

            {canShowFirstInline(wordCount) && (
              <NonCriticalBoundary label="Article inline ad">
                <DirectSponsor slotId="article-inline-01" articleId={article.id} variant="article-inline-ad" />
              </NonCriticalBoundary>
            )}

            <SourceNotes articleId={article.id} />

            {/* Revenue-arm-only second inline unit (client-gated for cache
                isolation). Renders nothing for standard-arm readers. */}
            <RevenueInlineAd placementId="article-inline-02" articleId={article.id} wordCount={wordCount} />

            <ContextRail articles={related} />

            <NewsletterBand
              title="Get the next story before everyone else"
              copy="The Morning Tide — one flagship story, weekday mornings."
              source="article-footer"
            />

            <CorrectionsLog articleId={article.id} />
          </article>

          <aside className="article-rail">
            <div className="rail-sticky">
              <section className="key-people">
                <span className="section-kicker">Track this story</span>
                <h3>{article.kicker ?? article.title}</h3>
                <p>Save it to your reading list to find it again or come back for updates.</p>
                <WatchlistToggle
                  articleId={article.id}
                  bare
                  labels={{ save: "Follow updates", saved: "Following" }}
                />
              </section>
              <NonCriticalBoundary label="Article rail ad">
                <RailPlacement slotId="article-rail-01" />
              </NonCriticalBoundary>
            </div>
          </aside>
        </div>
      </main>

      <NonCriticalBoundary label="Mobile anchor ad">
        <MobileAnchor slotId="mobile-anchor-01" />
      </NonCriticalBoundary>
      <NonCriticalBoundary label="PageEngagement">
        <PageEngagement routeType="article" contentId={article.id} />
      </NonCriticalBoundary>
    </>
  );
}
