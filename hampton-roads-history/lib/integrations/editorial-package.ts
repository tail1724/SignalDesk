import { z } from "zod";

/**
 * EditorialPackage v1 — the canonical Hunt's Pointe → SignalDesk handoff
 * contract (Quantum Newsroom integration PRD §6).
 *
 * A package is a publication-ready snapshot plus its revision lineage; it is
 * not a loose set of API fields. The schema below must stay value-identical
 * with Hunt's Pointe's copy in supabase/functions/_shared/editorial-package.ts
 * (only the zod import line differs — Deno loads zod from esm.sh).
 *
 * Field authority (PRD §3.1): everything in this package is either
 * Hunt's-Pointe-authored or shared-with-concurrency-control. Payload-only
 * fields (workflow stage, publish state, live URL, layout, placements) are
 * deliberately absent — the receiver owns them and ignores any attempt to
 * set them from outside.
 */

export const EDITORIAL_PACKAGE_CONTRACT = "editorial-package" as const;
export const EDITORIAL_PACKAGE_VERSION = 1 as const;

const trimmed = (max: number) => z.string().trim().min(1).max(max);

export const PackageActorSchema = z.object({
  id: trimmed(200),
  role: z.string().trim().max(60).optional(),
  name: z.string().trim().max(120).optional(),
});

/** Concurrency, diff, rollback, and audit lineage. */
export const PackageRevisionSchema = z.object({
  revision: z.number().int().positive(),
  parent_revision: z.number().int().nonnegative().nullable(),
  /** sha-256 (hex) over editorialChecksumInput(). */
  checksum: z.string().regex(/^[a-f0-9]{64}$/),
  created_at: z.string().trim().min(1).max(64),
  actor: PackageActorSchema,
});

export const PackageAuthorSchema = z.object({
  name: trimmed(120),
  external_id: z.string().trim().min(1).max(200).optional(),
});

export const PackageBodySchema = z.object({
  format: z.enum(["text", "markdown"]),
  value: z.string().trim().min(1).max(200_000),
});

export const PackageEditorialSchema = z.object({
  title: trimmed(300),
  dek: z.string().trim().max(500).nullish(),
  excerpt: z.string().trim().max(1_000).nullish(),
  body: PackageBodySchema,
  authors: z.array(PackageAuthorSchema).max(20),
  notes: z.string().trim().max(5_000).nullish(),
});

export const PackageTaxonomySchema = z.object({
  section: z.string().trim().max(100).nullish(),
  tags: z.array(trimmed(100)).max(100),
  audience: z.string().trim().max(200).nullish(),
  intent: z.string().trim().max(200).nullish(),
});

export const PackageSeoSchema = z.object({
  slug: z.string().trim().max(120).nullish(),
  keywords: z.array(trimmed(80)).max(25).optional(),
  meta_description: z.string().trim().max(320).nullish(),
});

export const PackageAssetSchema = z.object({
  url: z.string().url().max(2_000),
  alt: z.string().trim().max(500),
  credit: z.string().trim().max(300).optional(),
  caption: z.string().trim().max(500).optional(),
  rights: z.enum(["owned", "licensed", "review"]),
});

export const PackageProvenanceSchema = z.object({
  sources: z.array(z.unknown()).max(100),
  model: z.string().trim().max(120).optional(),
  prompt_version: z.string().trim().max(120).optional(),
  /** Set server-side from a verified identity — never client-trusted. */
  human_editor_id: z.string().trim().max(200).optional(),
  ai_assisted: z.boolean().optional(),
});

export const PackageValidationCheckSchema = z.object({
  check: trimmed(80),
  ok: z.boolean(),
  detail: z.string().trim().max(300).optional(),
});

export const PackageValidationSchema = z.object({
  word_count: z.number().int().nonnegative(),
  ready: z.boolean(),
  checks: z.array(PackageValidationCheckSchema).max(40),
});

/** A proposal only — Payload remains authoritative for publishing. */
export const PackagePublishingSchema = z.object({
  proposed_publish_at: z.string().trim().max(100).nullish(),
});

export const PackageIdentitySchema = z.object({
  package_id: z.string().uuid(),
  source_document_id: trimmed(200),
  publication_id: trimmed(100),
  /** The receiver's article id, when the sender already knows it. */
  article_id: z.string().trim().max(200).nullish(),
  source_card_id: z.string().trim().max(200).nullish(),
});

export const PackageSyncSchema = z.object({
  source: z.literal("hunts-pointe"),
  destination: z.literal("signaldesk"),
  idempotency_key: z.string().trim().min(8).max(500),
});

export const EditorialPackageSchema = z.object({
  identity: PackageIdentitySchema,
  revision: PackageRevisionSchema,
  editorial: PackageEditorialSchema,
  taxonomy: PackageTaxonomySchema,
  seo: PackageSeoSchema.optional(),
  assets: z.array(PackageAssetSchema).max(50),
  provenance: PackageProvenanceSchema,
  validation: PackageValidationSchema,
  publishing: PackagePublishingSchema.optional(),
  sync: PackageSyncSchema,
});

export const EditorialPackageEnvelopeSchema = z.object({
  contract: z.literal(EDITORIAL_PACKAGE_CONTRACT),
  contract_version: z.literal(EDITORIAL_PACKAGE_VERSION),
  package: EditorialPackageSchema,
});

export type PackageAuthor = z.infer<typeof PackageAuthorSchema>;
export type PackageAsset = z.infer<typeof PackageAssetSchema>;
export type EditorialPackage = z.infer<typeof EditorialPackageSchema>;
export type EditorialPackageEnvelope = z.infer<typeof EditorialPackageEnvelopeSchema>;

/**
 * Canonical string the revision checksum is computed over. Both sides build
 * this exact string and hash it with sha-256, so a mismatch means the
 * editorial content was altered somewhere between the two systems.
 */
export function editorialChecksumInput(
  pkg: Pick<EditorialPackage, "editorial" | "taxonomy">,
): string {
  const e = pkg.editorial;
  const t = pkg.taxonomy;
  return JSON.stringify({
    title: e.title,
    dek: e.dek ?? null,
    excerpt: e.excerpt ?? null,
    body_format: e.body.format,
    body_value: e.body.value,
    authors: e.authors.map((a) => a.name),
    notes: e.notes ?? null,
    section: t.section ?? null,
    tags: t.tags,
  });
}
