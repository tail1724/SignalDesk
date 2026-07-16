import { NextRequest, NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@payload-config";
import { z } from "zod";
import { verifyWebhookSignature } from "@/lib/webhook";

// Hunt's Pointe draft-ingest endpoint.
//
// Hunt's Pointe's `push-signaldesk` Edge Function POSTs an article here (the
// export-cms payload shape). We ALWAYS create a Payload DRAFT (_status=draft) —
// a human editor publishes it in /admin. Hunt's Pointe never publishes directly.
//
// Auth: HMAC-SHA256 of the raw body with WEBHOOK_SECRET, in x-webhook-signature
// (same scheme as the revalidate webhook). The shared secret lives only as an
// Edge Function secret on the Hunt's Pointe side.
//
// Unknown section/author are auto-created (find-or-create) so a draft always
// lands; the editor fixes taxonomy before publishing.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BodySchema = z.object({
  title: z.string().min(1).max(300),
  dek: z.string().max(500).nullish(),
  byline: z.array(z.string()).nullish(),
  section: z.string().max(100).nullish(),
  story_tags: z.array(z.string()).nullish(),
  publish_at: z.string().nullish(),
  content_text: z.string().min(1).max(50000),
  slug: z.string().max(120).nullish(),
});

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
}

function makeShortId(): string {
  return Math.random().toString(36).slice(2, 10);
}

function estimateReadTime(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

// Minimal Lexical editorState from plain text (paragraph per blank-line block).
function textToLexical(text: string) {
  const blocks = text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
  return {
    root: {
      type: "root",
      format: "",
      indent: 0,
      version: 1,
      direction: "ltr" as const,
      children: (blocks.length ? blocks : [""]).map((p) => ({
        type: "paragraph",
        format: "",
        indent: 0,
        version: 1,
        direction: "ltr" as const,
        textFormat: 0,
        children: [
          { type: "text", detail: 0, format: 0, mode: "normal", style: "", text: p, version: 1 },
        ],
      })),
    },
  };
}

export async function POST(req: NextRequest) {
  const raw = await req.text();
  const signature = req.headers.get("x-webhook-signature");
  if (!signature || !verifyWebhookSignature(raw, signature)) {
    return NextResponse.json({ error: "Invalid or missing signature" }, { status: 401 });
  }

  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = BodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", issues: parsed.error.issues }, { status: 400 });
  }
  const body = parsed.data;

  const payload = await getPayload({ config });

  async function findOrCreate(
    collection: "hr_categories" | "hr_authors",
    name: string
  ): Promise<string> {
    const slug = slugify(name);
    const existing = await payload.find({
      collection,
      where: { slug: { equals: slug } },
      limit: 1,
      depth: 0,
    });
    if (existing.docs[0]) return String(existing.docs[0].id);
    const created = await payload.create({ collection, data: { name, slug } });
    return String(created.id);
  }

  const sectionId = body.section ? await findOrCreate("hr_categories", body.section) : undefined;
  const authorId = body.byline?.[0] ? await findOrCreate("hr_authors", body.byline[0]) : undefined;

  const created = await payload.create({
    collection: "hr_articles",
    draft: true,
    data: {
      short_id: makeShortId(),
      title: body.title,
      dek: body.dek ?? undefined,
      slug: body.slug ? slugify(body.slug) : slugify(body.title),
      section: sectionId,
      author: authorId,
      body_lexical: textToLexical(body.content_text),
      read_time_min: estimateReadTime(body.content_text),
      publish_at: body.publish_at ?? undefined,
      _status: "draft",
    },
  });

  return NextResponse.json(
    { ok: true, id: String(created.id), status: "draft" },
    { status: 201 }
  );
}
