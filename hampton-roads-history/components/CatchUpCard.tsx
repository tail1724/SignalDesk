import Link from "next/link";
import type { Article } from "@/lib/supabase/types";
import { articleHref } from "@/components/ArticleCard";

// "Catch up fast" rail card — DOM mirrors redesign/vapornet/index.html
// (.briefing-card: kicker, headline, numbered list, audio-brief button).
export function CatchUpCard({ articles }: { articles: Article[] }) {
  if (articles.length === 0) return null;

  return (
    <section className="briefing-card">
      <span className="section-kicker">Catch up fast</span>
      <h2>Five minutes. Full context.</h2>
      <ol>
        {articles.map((a, i) => (
          <li key={a.id}>
            <Link href={articleHref(a)}>
              <span>{i + 1}</span>
              {a.title}
            </Link>
          </li>
        ))}
      </ol>
      <button type="button" disabled title="Audio briefs are coming soon" aria-disabled>
        Play the audio brief
      </button>
    </section>
  );
}
