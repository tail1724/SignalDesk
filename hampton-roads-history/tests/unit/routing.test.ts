import { describe, expect, it } from "vitest";
import { parseShortId } from "@/lib/format";
import { articleHref } from "@/components/ArticleCard";
import type { Article } from "@/lib/supabase/types";

function makeArticle(overrides: Partial<Article> = {}): Article {
  return {
    id: "11111111-1111-1111-1111-111111111111",
    short_id: "ab12",
    title: "Test Article",
    dek: null,
    slug: "test-article",
    kicker: null,
    section_id: null,
    author_id: null,
    hero_image_url: null,
    hero_image_alt: null,
    status: "published",
    publish_at: null,
    published_at: null,
    event_date: null,
    read_time_min: null,
    is_pro: false,
    hr_categories: { id: "c1", name: "Norfolk", slug: "norfolk", order: 0, accent_hex: null },
    hr_authors: null,
    ...overrides,
  };
}

describe("parseShortId", () => {
  it("extracts the short_id segment before the first hyphen", () => {
    expect(parseShortId("ab12-the-lost-resort-of-cape-henry")).toBe("ab12");
  });

  it("returns the whole string when there is no hyphen", () => {
    expect(parseShortId("ab12")).toBe("ab12");
  });

  it("returns null for an empty segment", () => {
    expect(parseShortId("")).toBeNull();
    expect(parseShortId("-leading-hyphen")).toBeNull();
  });
});

describe("articleHref (canonical URL + stale-slug redirect basis)", () => {
  it("builds /[city]/[short_id]-[slug] from the article's own city and slug", () => {
    const article = makeArticle({ short_id: "ab12", slug: "the-lost-resort" });
    expect(articleHref(article)).toBe("/norfolk/ab12-the-lost-resort");
  });

  it("falls back to 'hampton' when hr_categories is missing", () => {
    const article = makeArticle({ hr_categories: null });
    expect(articleHref(article)).toBe("/hampton/ab12-test-article");
  });

  it("is stable regardless of what slug the request arrived with", () => {
    // This is the invariant the 301 redirect in app/(frontend)/[city]/[idSlug]/page.tsx
    // depends on: canonical() always reflects the DB row, not the request URL,
    // so a stale/renamed slug in the request never matches and always redirects.
    const article = makeArticle({ short_id: "ab12", slug: "current-slug" });
    const requestedWithStaleSlug = "/norfolk/ab12-an-old-renamed-slug";
    const canonical = articleHref(article);

    expect(canonical).not.toBe(requestedWithStaleSlug);
    expect(canonical).toBe("/norfolk/ab12-current-slug");
  });
});
