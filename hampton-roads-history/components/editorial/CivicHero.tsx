import Link from "next/link";
import type { Article } from "@/lib/supabase/types";
import { articleHref } from "@/components/ArticleCard";
import { StoryWorldPoster } from "@/components/three/StoryWorldPoster";
import { SmartBrief, type BriefItem } from "@/components/editorial/SmartBrief";
import { LaserFlowLayer } from "@/components/reactbits/LaserFlowLayer";

// Cinematic homepage lead — DOM mirrors redesign/vapornet/index.html
// (.cinematic-hero > .hero-art/.hero-shade + .hero-copy + .hero-brief +
// .hero-caption). All styling from the verbatim vapornet.css.
export function CivicHero({
  article,
  brief,
  caption,
  heroImageUrl,
}: {
  article: Article;
  /** Hero brief rows; defaults to a single "Why it matters" from the dek. */
  brief?: BriefItem[];
  caption?: string;
  /** Editor-selected homepage hero image (media library). Falls back to the
   *  default cinematic poster art when unset. */
  heroImageUrl?: string;
}) {
  const href = articleHref(article);
  const briefItems: BriefItem[] =
    brief ?? (article.dek ? [{ term: "Why it matters", description: article.dek }] : []);

  return (
    <section className="cinematic-hero" aria-labelledby="home-lead-title">
    <section className="cinematic-hero" aria-labelledby="home-lead-title">
      <StoryWorldPoster posterSrc={heroImageUrl} />
      {/* Surface 1 — gold LaserFlow beam … */}
      <LaserFlowLayer
        color="#c99a42"
        laserProps={{
          horizontalBeamOffset: 0.34,
          verticalBeamOffset: -0.08,
          flowSpeed: 0.4,
          fogIntensity: 0.4,
          wispDensity: 1,
          wispIntensity: 4,
          mouseTiltStrength: 1,
          verticalSizing: 2.1,
        }}
      />
      <div className="hero-copy">
      …
      <div className="hero-copy">
        <div className="eyebrow light">
          {article.kicker && <span>{article.kicker}</span>}
          <span>{article.hr_categories?.name ?? "Hampton Roads"}</span>
          {article.read_time_min != null && <span>{article.read_time_min} min</span>}
        </div>
        <h1 id="home-lead-title">
          <Link href={href}>{article.title}</Link>
        </h1>
        {article.dek && <p>{article.dek}</p>}
        <div className="hero-actions">
          <Link href={href} className="primary-button inverse">
            Read the briefing
          </Link>
          <button type="button" className="glass-button" disabled title="Audio briefs are coming soon">
            Listen · soon
          </button>
        </div>
      </div>
      {briefItems.length > 0 && <SmartBrief variant="hero" number="01" items={briefItems} />}
      {caption && <div className="hero-caption">{caption}</div>}
    </section>
  );
}
