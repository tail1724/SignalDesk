import { getFeedArticles } from "@/lib/data";
import { articleHref } from "@/components/ArticleCard";

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://hamptonroadshistory.com";
  const articles = await getFeedArticles(undefined, 50);

  const items = articles
    .map((article) => {
      const url = `${siteUrl}${articleHref(article)}`;
      const pubDate = article.published_at ? new Date(article.published_at).toUTCString() : undefined;

      return `
    <item>
      <title>${escapeXml(article.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      ${pubDate ? `<pubDate>${pubDate}</pubDate>` : ""}
      ${article.dek ? `<description>${escapeXml(article.dek)}</description>` : ""}
      ${article.hr_categories?.name ? `<category>${escapeXml(article.hr_categories.name)}</category>` : ""}
      ${article.hr_authors?.name ? `<author>${escapeXml(article.hr_authors.name)}</author>` : ""}
    </item>`;
    })
    .join("");

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Hampton Roads History</title>
    <link>${siteUrl}</link>
    <description>Warm, deeply reported local history for Hampton, Newport News, Norfolk, Virginia Beach, Chesapeake, Portsmouth, and Suffolk.</description>
    <language>en-us</language>
    <atom:link href="${siteUrl}/rss.xml" rel="self" type="application/rss+xml" />${items}
  </channel>
</rss>`;

  return new Response(rss, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600",
    },
  });
}
