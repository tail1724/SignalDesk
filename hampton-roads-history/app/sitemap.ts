import type { MetadataRoute } from "next";
import { getCategories, getFeedArticles } from "@/lib/data";
import { articleHref } from "@/components/ArticleCard";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://hamptonroadshistory.com";

  const [cities, articles] = await Promise.all([
    getCategories(),
    getFeedArticles(undefined, 500),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: siteUrl, changeFrequency: "hourly", priority: 1 },
    { url: `${siteUrl}/search`, changeFrequency: "weekly", priority: 0.3 },
    { url: `${siteUrl}/watch`, changeFrequency: "weekly", priority: 0.3 },
    { url: `${siteUrl}/advertise`, changeFrequency: "monthly", priority: 0.2 },
    { url: `${siteUrl}/about`, changeFrequency: "monthly", priority: 0.3 },
    { url: `${siteUrl}/editorial-standards`, changeFrequency: "monthly", priority: 0.2 },
    { url: `${siteUrl}/corrections`, changeFrequency: "monthly", priority: 0.2 },
    { url: `${siteUrl}/terms`, changeFrequency: "yearly", priority: 0.1 },
    { url: `${siteUrl}/privacy`, changeFrequency: "yearly", priority: 0.1 },
    { url: `${siteUrl}/ad-choices`, changeFrequency: "yearly", priority: 0.1 },
  ];

  const cityRoutes: MetadataRoute.Sitemap = cities.map((city) => ({
    url: `${siteUrl}/${city.slug}`,
    changeFrequency: "hourly",
    priority: 0.8,
  }));

  const articleRoutes: MetadataRoute.Sitemap = articles.map((article) => ({
    url: `${siteUrl}${articleHref(article)}`,
    lastModified: article.published_at ?? undefined,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  return [...staticRoutes, ...cityRoutes, ...articleRoutes];
}
