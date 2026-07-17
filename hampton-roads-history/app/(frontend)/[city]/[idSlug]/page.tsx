import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";
import Link from "next/link";
import Image from "next/image";
import { getArticleByShortId, getRelatedArticles } from "@/lib/data";
import { articleHref } from "@/components/ArticleCard";
import { timeAgo, thumbGradient, parseShortId } from "@/lib/format";
import { lexicalWordCount } from "@/lib/lexical";
import { WatchlistToggle } from "@/components/WatchlistToggle";
import { ShareBar } from "@/components/ShareBar";
import { ArticleBody } from "@/components/ArticleBody";
import { NewsletterBand } from "@/components/NewsletterBand";
import { PageViewTracker } from "@/components/PageViewTracker";
import { CorrectionsLog } from "@/components/editorial/CorrectionsLog";
import { SourceNotes } from "@/components/editorial/SourceNotes";
import { ContextRail } from "@/components/editorial/ContextRail";
import { SmartBrief } from "@/components/editorial/SmartBrief";
import { ReadingProgress } from "@/components/editorial/ReadingProgress";
import { DirectSponsor } from "@/components/ads/DirectSponsor";
import { RailPlacement } from "@/components/ads/RailPlacement";
import { MobileAnchor } from "@/components/ads/MobileAnchor";
import { getHeroImageUrl, articleHeroSrc, articleHeroAlt } from "@/lib/images";
import type { Metadata } from "next";

type Props = { params: Promise<{ city: string; idSlug: string }> };

// Required for CSP nonce support (the nonce is minted per-request in proxy.ts)
export const dynamic = "force-dynamic";

// Density rule (design-blueprint.html §05): no inline unit under 600 words.
const INLINE_AD_MIN_WORDS = 600;

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

  return (
    <>
      <ReadingProgress targetId="article-wrap" />
      <main id="article-wrap" className="reading py-10">
        <PageViewTracker articleId={article.id} articleShortId={article.short_id} citySlug={city} />
        <script
          type="application/ld+json"
          nonce={nonce}
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <div className="mb-3 font-mono text-[12px] font-semibold uppercase tracking-wider text-accent">
          <Link href={`/${city}`} className="hover:underline">
            {article.hr_categories?.name}
          </Link>
          {article.kicker ? <span className="text-ink-3"> · {article.kicker}</span> : ""}
        </div>
        <h1 className="mb-4 font-display text-[clamp(30px,4.5vw,54px)] font-black leading-[0.98] tracking-[-0.03em] text-ink">
          {article.title}
        </h1>
        {article.dek && (
          <p className="mb-5 font-display text-[19px] font-medium leading-relaxed text-ink-2">
            {article.dek}
          </p>
        )}

        <div className="mb-8 flex items-center justify-between gap-4 border-y border-line py-3">
          <div className="text-[13px] text-ink-3">
            By <span className="font-medium text-ink-2">{article.hr_authors?.name ?? "Staff"}</span> ·{" "}
            {timeAgo(article.published_at)}
            {article.read_time_min ? ` · ${article.read_time_min} min read` : ""}
          </div>
          <div className="flex items-center gap-3">
            <WatchlistToggle articleId={article.id} />
            <ShareBar title={article.title} />
          </div>
        </div>

        {articleHeroSrc(article) ? (
          <figure className="mb-8">
            <div className="aspect-[16/9] overflow-hidden rounded-[var(--r-card)]">
              <Image
                src={articleHeroSrc(article)!}
                alt={articleHeroAlt(article)}
                width={1200}
                height={630}
                priority
                className="h-full w-full object-cover"
              />
            </div>
            {articleHeroAlt(article) && (
              <figcaption className="mt-2 font-mono text-[10px] text-ink-3">
                {articleHeroAlt(article)}
              </figcaption>
            )}
          </figure>
        ) : (
          <div
            className={`aspect-[16/9] rounded-[var(--r-card)] bg-gradient-to-br ${thumbGradient(article.id)} mb-8`}
            aria-hidden
          />
        )}

        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,1fr)_280px]">
          <article className="min-w-0">
            {briefItems.length > 0 && <SmartBrief items={briefItems} />}

            <div className="max-w-none text-ink-2 leading-relaxed">
              <ArticleBody body={article.body_lexical} title={article.title} />
            </div>

            {wordCount >= INLINE_AD_MIN_WORDS && (
              <div className="my-9">
                <DirectSponsor slotId="article-inline-01" articleId={article.id} />
              </div>
            )}

            <SourceNotes articleId={article.id} />
            <ContextRail articles={related} />

            <div className="mt-10">
              <NewsletterBand
                title="Get the next story before everyone else"
                copy="The Morning Dispatch — one flagship story, weekday mornings."
                source="article-footer"
              />
            </div>

            <CorrectionsLog articleId={article.id} />
          </article>

          <aside className="hidden lg:block">
            <div className="sticky top-[92px] flex flex-col gap-6">
              <section className="rounded-[2px_16px_2px_16px] border border-line bg-surface-1 p-6 shadow-[var(--shadow-sm)]">
                <span className="mb-1 block font-mono text-[8px] uppercase tracking-[.14em] text-accent-soft">
                  Track this story
                </span>
                <h3 className="mb-2 font-display text-[20px] font-black text-ink">{article.title}</h3>
                <p className="mb-3 text-[11px] leading-[1.45] text-ink-2">
                  Save it to your reading list to find it again or come back for updates.
                </p>
                <WatchlistToggle articleId={article.id} />
              </section>
              <RailPlacement slotId="article-rail-01" />
            </div>
          </aside>
        </div>
      </main>

      <MobileAnchor slotId="mobile-anchor-01" />
    </>
  );
}
