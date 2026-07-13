import { NextRequest, NextResponse } from "next/server";
import { searchArticles } from "@/lib/search";
import { articleHref } from "@/components/ArticleCard";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") ?? "";

  if (!q.trim()) {
    return NextResponse.json({ results: [] });
  }

  const articles = await searchArticles(q, 8);

  const results = articles.map((a) => ({
    id: a.id,
    title: a.title,
    kicker: a.kicker,
    city: a.hr_categories?.name ?? null,
    href: articleHref(a),
  }));

  return NextResponse.json({ results });
}
