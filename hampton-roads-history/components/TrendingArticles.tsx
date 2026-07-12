import { getTrendingArticles } from "@/lib/trending";
import { ArticleCard, articleHref } from "@/components/ArticleCard";

export async function TrendingArticles({ limit = 5 }: { limit?: number }) {
  try {
    const articles = await getTrendingArticles(limit);

    if (articles.length === 0) {
      return null;
    }

    return (
      <section className="space-y-3">
        <h4 className="font-display font-bold text-sm mb-4">Trending now</h4>
        <div className="space-y-3">
          {articles.map((article) => (
            <article
              key={article.id}
              className="flex gap-3 bg-surface-1 border border-line rounded-lg p-3 hover:border-line-strong transition-colors group"
            >
              <div className="text-ink-3 font-mono text-xs font-bold min-w-6">
                {articles.indexOf(article) + 1}
              </div>
              <div className="flex-1 min-w-0">
                <a
                  href={articleHref(article)}
                  className="block text-sm font-semibold text-ink hover:text-accent line-clamp-2 mb-1 transition-colors"
                >
                  {article.title}
                </a>
                <p className="text-xs text-ink-3 line-clamp-1">
                  {article.hr_categories?.name ?? "News"}
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>
    );
  } catch (err) {
    console.error("Error loading trending articles:", err);
    return null;
  }
}
