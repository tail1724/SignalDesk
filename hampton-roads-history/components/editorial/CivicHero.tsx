import Link from "next/link";
import type { Article } from "@/lib/supabase/types";
import { articleHref } from "@/components/ArticleCard";
import { StoryWorldPoster } from "@/components/three/StoryWorldPoster";
import { SmartBrief } from "@/components/editorial/SmartBrief";

// Cinematic homepage lead: poster (LCP element) + headline overlay + a
// compact "why it matters" brief. Replaces the old FeedHero placeholder
// gradient — see design-blueprint.html §04 (Homepage) and §02 decision 3
// ("atmosphere carries the brand hero; article pages stay evidence-first").
export function CivicHero({ article }: { article: Article }) {
  const href = articleHref(article);
  const briefItems = article.dek ? [{ term: "Why it matters", description: article.dek }] : [];

  return (
    <section
      aria-labelledby="home-lead-title"
      className="relative isolate grid min-h-[420px] gap-8 overflow-hidden px-6 py-10 sm:min-h-[520px] sm:px-10 sm:py-14 lg:grid-cols-[1.45fr_0.55fr] lg:items-end lg:gap-9 lg:px-16 lg:py-16"
    >
      <StoryWorldPoster />

      <div className="relative z-[1] max-w-[45ch] text-white">
        <div className="mb-2.5 flex flex-wrap gap-x-3 gap-y-1.5 font-mono text-[9px] uppercase tracking-[.08em] text-[#f2d693]">
          <span>{article.hr_categories?.name ?? "Hampton Roads"}</span>
          {article.kicker && <span>{article.kicker}</span>}
          {article.read_time_min && <span>{article.read_time_min} min</span>}
        </div>
        <h1
          id="home-lead-title"
          className="max-w-[12ch] text-balance font-display text-[clamp(34px,6vw,72px)] font-black leading-[.94] tracking-[-0.05em]"
        >
          <Link href={href} className="hover:text-[#f2d693]">
            {article.title}
          </Link>
        </h1>
        {article.dek && (
          <p className="mt-4 max-w-[55ch] text-[15px] leading-[1.5] text-white/80 sm:text-[18px]">
            {article.dek}
          </p>
        )}
        <div className="mt-6 flex flex-wrap gap-2.5">
          <Link
            href={href}
            className="inline-flex min-h-[44px] items-center rounded-full bg-white px-5 text-[13px] font-black text-federal shadow-[0_10px_28px_rgba(0,0,0,.24)]"
          >
            Read the story
          </Link>
          <button
            type="button"
            disabled
            title="Audio briefs are coming soon"
            className="inline-flex min-h-[44px] cursor-not-allowed items-center rounded-full border border-white/35 bg-white/[.08] px-4 text-[13px] font-bold text-white/60 backdrop-blur-md"
          >
            Listen · coming soon
          </button>
        </div>
      </div>

      {briefItems.length > 0 && (
        <div className="relative z-[1] self-end lg:max-w-[300px]">
          <SmartBrief variant="hero" items={briefItems} />
        </div>
      )}
    </section>
  );
}
