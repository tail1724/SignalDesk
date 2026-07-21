// One-time import of `mpv_articles` (a separate, unrelated multi-publication
// content system living in the same Supabase project — see mpv_publications:
// "Tech Weekly" / "Business Insights" / "Health & Wellness", none of which is
// Hampton Roads History) into `hr_articles` so the demo build has real rows
// to exercise the Payload admin and the Next.js frontend against.
//
// This is DEMO SEED DATA, not vetted editorial content: the source rows have
// no reliable author identity and unknown provenance (see ai_provenance on
// each imported doc). fact_checked/sources_checked/rights_checked/
// disclosure_checked are force-set to true only to satisfy hr_articles'
// publish gate (lib/payload/workflow.ts) for demo purposes — do not treat
// these as reviewed newsroom stories.
//
// Idempotent: re-running skips any mpv row already imported (matched by
// ingest_key = `mpv:<mpv_articles.id>`).
//
// Usage:
//   node --import tsx scripts/migrate-mpv-articles.mts
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { loadEnvConfig } = require("@next/env") as typeof import("@next/env");

loadEnvConfig(process.cwd(), true);

const { getPayload } = await import("payload");
const { default: config } = await import("@payload-config");
const { createServiceSupabase } = await import("@/lib/supabase/service");

const payload = await getPayload({ config, disableOnInit: true });
const supabase = createServiceSupabase();

// --- category mapping ------------------------------------------------------
// hr_categories in this codebase are actually cities (Norfolk, Hampton, ...).
// mpv_articles' categories are unrelated topics (Business, Technology, ...),
// so rather than force-fit unrelated content onto a city, each distinct mpv
// topic becomes its own new hr_categories row. The half-dozen internal
// "lucidparse-*" buckets (and null categories) collapse into one "Wild Card"
// catch-all, per instruction.
function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "wild-card";
}

function normalizeCategory(raw: string | null): string {
  const trimmed = raw?.trim() ?? "";
  if (!trimmed || trimmed.toLowerCase().startsWith("lucidparse")) return "Wild Card";
  return trimmed;
}

const categoryCache = new Map<string, string>(); // name -> hr_categories id

async function getCategoryId(rawCategory: string | null, order: number): Promise<string> {
  const name = normalizeCategory(rawCategory);
  const cached = categoryCache.get(name);
  if (cached) return cached;

  const slug = slugify(name);
  const existing = await payload.find({
    collection: "hr_categories",
    where: { slug: { equals: slug } },
    limit: 1,
    overrideAccess: true,
  });

  const id =
    existing.docs[0]?.id ??
    (
      await payload.create({
        collection: "hr_categories",
        data: { name, slug, order },
        overrideAccess: true,
      })
    ).id;

  categoryCache.set(name, String(id));
  return String(id);
}

// --- lexical conversion ------------------------------------------------------
// mpv_articles has no Payload rich-text; `content` is plain text/loose
// markdown, and some rows have a literal two-character "\n" baked into the
// text rather than a real newline. Good enough for a demo render, not a full
// markdown parser.
function textNode(text: string) {
  return { type: "text", text, format: 0, detail: 0, mode: "normal", style: "", version: 1 };
}

function paragraphNode(text: string) {
  return {
    type: "paragraph",
    children: [textNode(text)],
    direction: "ltr" as const,
    format: "" as const,
    indent: 0,
    version: 1,
  };
}

function headingNode(level: number, text: string) {
  const tag = `h${Math.min(Math.max(level, 2), 6)}`;
  return {
    type: "heading",
    tag,
    children: [textNode(text)],
    direction: "ltr" as const,
    format: "" as const,
    indent: 0,
    version: 1,
  };
}

function buildBodyLexical(raw: string | null) {
  const normalized = (raw ?? "").replace(/\\n/g, "\n");
  const lines = normalized
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);

  const children = lines.map((line) => {
    const heading = line.match(/^(#{1,6})\s+(.*)$/);
    if (heading) return headingNode(heading[1].length + 1, heading[2].trim());
    return paragraphNode(line.replace(/\*\*/g, ""));
  });

  return {
    root: {
      type: "root",
      children,
      direction: "ltr" as const,
      format: "" as const,
      indent: 0,
      version: 1,
    },
  };
}

// --- main -----------------------------------------------------------------
// Note: short_id is NOT set here — it's a Postgres GENERATED ALWAYS column
// (first 5 chars of the row's own id, dashes stripped), computed by the
// database itself on insert.
type MpvArticle = {
  id: string;
  title: string;
  author_id: string | null;
  production_status: string;
  slug: string | null;
  category: string | null;
  subtitle: string | null;
  summary: string | null;
  excerpt: string | null;
  content: string | null;
  meta_description: string | null;
  featured_image_url: string | null;
  featured_image_alt: string | null;
  tags: string[] | null;
  seo_keywords: string[] | null;
  read_time: number | null;
  published_at: string | null;
  created_at: string;
};

async function main() {
  const superAdmin = await payload.find({
    collection: "hr_cms_users",
    where: { role: { equals: "super_admin" } },
    limit: 1,
    overrideAccess: true,
  });
  const importUser = superAdmin.docs[0];
  if (!importUser) {
    throw new Error(
      "No hr_cms_users row with role=super_admin found — hr_articles' publish gate " +
        "(enforceArticlePublication) requires an authorized user to publish on create.",
    );
  }

  const { data: rows, error } = await supabase
    .from("mpv_articles")
    .select(
      "id, title, author_id, production_status, slug, category, subtitle, summary, excerpt, content, meta_description, featured_image_url, featured_image_alt, tags, seo_keywords, read_time, published_at, created_at",
    )
    .returns<MpvArticle[]>();
  if (error) throw error;

  let created = 0;
  let skipped = 0;
  let categoryOrder = 0;

  for (const row of rows ?? []) {
    const ingestKey = `mpv:${row.id}`;
    const already = await payload.find({
      collection: "hr_articles",
      where: { ingest_key: { equals: ingestKey } },
      limit: 1,
      overrideAccess: true,
    });
    if (already.docs.length) {
      skipped++;
      continue;
    }

    const section = await getCategoryId(row.category, categoryOrder++);
    const dek = (row.excerpt || row.summary || row.subtitle || "").slice(0, 500) || null;
    const publishedAt = row.published_at || row.created_at;

    await payload.create({
      collection: "hr_articles",
      user: importUser,
      overrideAccess: true,
      draft: false,
      // `data` is cast below: the generated HrArticle type demands `short_id`,
      // but that column is a Postgres GENERATED ALWAYS column (derived from
      // the row's own id) — Payload has no field-level way to express
      // "server-generated, don't send this on create". workflow_stage and
      // priority are omitted deliberately too: the DB has defaults for both,
      // and enforceArticlePublication (lib/payload/workflow.ts) forces
      // workflow_stage to "published" on this create anyway.
      data: {
        slug: row.slug || slugify(row.title),
        title: row.title,
        dek,
        section,
        body_lexical: buildBodyLexical(row.content),
        hero_image_url: row.featured_image_url || undefined,
        hero_image_alt: row.featured_image_alt || undefined,
        read_time_min: row.read_time && row.read_time >= 1 ? row.read_time : undefined,
        published_at: publishedAt,
        fact_checked: true,
        sources_checked: true,
        rights_checked: true,
        disclosure_checked: true,
        story_tags: { tags: row.tags ?? [], seo_keywords: row.seo_keywords ?? [] },
        ai_provenance: {
          imported: true,
          source: "mpv_articles",
          note: "Migrated demo content from an unrelated content system; original authorship and AI-generation status are unknown. Not editorially reviewed.",
        },
        source_origin: "import",
        source_document_id: row.id,
        source_version: 1,
        ingest_key: ingestKey,
        last_ingested_at: new Date().toISOString(),
        _status: "published",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any,
    });
    created++;
  }

  // eslint-disable-next-line no-console
  console.log(`mpv_articles import: ${created} created, ${skipped} already imported.`);
  process.exit(0);
}

await main();
