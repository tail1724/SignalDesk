import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getArticleByShortId, getRelatedArticles } from "@/lib/data";
import { articleHref } from "@/components/ArticleCard";
import { timeAgo, thumbGradient } from "@/lib/format";
import { WatchlistToggle } from "@/components/WatchlistToggle";
import { ShareBar } from "@/components/ShareBar";
import { AdSlot } from "@/components/AdSlot";
import { getHeroImageUrl } from "@/lib/images";
import type { Metadata } from "next";

type Props = { params: Promise<{ city: string; idSlug: string }> };

async function resolveArticle(idSlug: string) {
  const [shortId] = idSlug.split("-");
  if (!shortId) return null;
  return getArticleByShortId(shortId);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { idSlug } = await params;
  const article = await resolveArticle(idSlug);
  if (!article) return {};
  return {
    title: `${article.title} — Hampton Roads History`,
    description: article.dek ?? undefined,
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

  const related = await getRelatedArticles(city, article.id, 3);

  return (
    <main className="wrap py-10 max-w-3xl">
      <div className="font-mono text-xs tracking-wide uppercase text-accent-soft mb-3">
        <Link href={`/${city}`} className="hover:underline">
          {article.hr_categories?.name}
        </Link>
        {article.kicker ? ` · ${article.kicker}` : ""}
      </div>
      <h1 className="font-display font-black text-[clamp(28px,4vw,42px)] leading-[1.05] tracking-tight mb-4">
        {article.title}
      </h1>
      {article.dek && <p className="text-ink-2 text-lg mb-5 max-w-[58ch]">{article.dek}</p>}

      <div className="flex items-center justify-between border-y border-line py-3 mb-8">
        <div className="font-mono text-[11px] text-ink-3">
          By {article.hr_authors?.name ?? "Staff"} · {timeAgo(article.published_at)}
          {article.read_time_min ? ` · ${article.read_time_min} min read` : ""}
        </div>
        <div className="flex items-center gap-3">
          <WatchlistToggle articleId={article.id} />
          <ShareBar title={article.title} />
        </div>
      </div>

      {article.hero_image_url ? (
        <div className="aspect-[16/9] rounded-[var(--r-card)] overflow-hidden mb-8">
          <Image
            src={getHeroImageUrl(article.hero_image_url)}
            alt={article.hero_image_alt || article.title}
            width={1200}
            height={630}
            priority
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div
          className={`aspect-[16/9] rounded-[var(--r-card)] bg-gradient-to-br ${thumbGradient(article.id)} mb-8`}
          aria-hidden
        />
      )}

      <article className="prose-hr max-w-none text-ink-2 leading-relaxed space-y-4">
        <p>
          This story is still being written up in full — the editorial team
          is finishing the deep-dive draft. Check back soon for the complete
          account of {article.title.toLowerCase()}.
        </p>
      </article>

      <div className="my-10">
        <AdSlot slotId="article-inline" articleId={article.id} />
      </div>

      {related.length > 0 && (
        <section className="mt-14">
          <h2 className="font-mono text-[11px] tracking-wide uppercase text-ink-3 mb-4">
            More from {article.hr_categories?.name}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {related.map((r) => (
              <Link
                key={r.id}
                href={articleHref(r)}
                className="rounded-2xl border border-line p-4 hover:border-line-strong transition-colors"
              >
                <h3 className="font-display font-bold text-sm leading-snug">{r.title}</h3>
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
