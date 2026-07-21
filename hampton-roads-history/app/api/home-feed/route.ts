import { getFeedArticlesPage } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(Math.max(Number(searchParams.get("limit") ?? 6), 1), 12);
  const cursorParam = searchParams.get("cursor");
  let cursor: { published_at: string | null; id: string } | undefined;

  if (cursorParam) {
    try {
      cursor = JSON.parse(decodeURIComponent(cursorParam));
    } catch {
      return Response.json({ error: "Invalid cursor" }, { status: 400 });
    }
  }

  const articles = await getFeedArticlesPage({ limit: limit + 1, cursor });
  const page = articles.slice(0, limit);
  const last = page.at(-1);
  return Response.json({
    articles: page,
    hasMore: articles.length > limit,
    nextCursor: last ? encodeURIComponent(JSON.stringify({ published_at: last.published_at, id: last.id })) : null,
  });
}
