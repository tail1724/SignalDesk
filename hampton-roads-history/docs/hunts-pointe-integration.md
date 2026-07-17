# Seed Refiner → SignalDesk draft staging

Seed Refiner (the Hunt's Pointe writing application) can stage high-quality
article drafts in SignalDesk. It cannot publish, create production taxonomy,
approve source or media rights, or satisfy the editorial quality gate.

```text
Seed Refiner UI
  → server-side sender / Edge Function
  → HMAC-signed POST + Idempotency-Key
  → SignalDesk ingestion receipt
  → Payload article with _status=draft and workflow_stage=intake
  → human reporting, copy edit, rights review, disclosure, and publish
```

The Payload Admin header and dashboard link back to
`https://seed-refiner.lovable.app/`. The button is a destination shortcut; the
actual transfer remains server-to-server so the shared secret never enters a
browser bundle.

## Receiver

`POST /api/integrations/hunts-pointe`

Required headers:

```http
Content-Type: application/json
Idempotency-Key: seed-refiner:<document-id>:<version>
x-webhook-signature: <base64 HMAC-SHA256 of the exact raw body>
```

The HMAC key is SignalDesk's `WEBHOOK_SECRET`. Use the same value only in the
sender's server-side secret store. Never place it in Vite, Next public,
`localStorage`, or client-visible source.

### Request contract

```jsonc
{
  "source_document_id": "seed-document-uuid",
  "source_version": 4,
  "title": "Required; 1–300 characters",
  "dek": "Optional; up to 500 characters",
  "byline": ["Legacy author form"],
  "authors": [
    { "name": "Jordan Ellis", "external_id": "author-17" }
  ],
  "section": "Suggested external section",
  "story_tags": ["ports", "resilience"],
  "tags": ["Additional alias accepted for compatibility"],
  "publish_at": "2026-07-20T13:00:00.000Z",
  "content_text": "Required plain text. Blank lines become Lexical paragraphs.",
  "slug": "optional-suggested-slug",
  "media": [
    {
      "url": "https://example.com/image.jpg",
      "alt": "Required accessibility description",
      "credit": "Optional credit",
      "rights": "owned"
    }
  ],
  "provenance": {
    "model": "model identifier",
    "prompt_version": "editorial-prompt-v4",
    "sources": [{ "url": "https://example.com/source" }],
    "safety_results": {},
    "human_editor_id": "optional upstream reviewer"
  }
}
```

`media[].rights` is one of `owned`, `licensed`, or `review`. The transfer only
records media provenance; an editor must still verify rights and deliberately
select/upload the production hero asset.

### Responses

| Status | Meaning |
|---|---|
| `201` | A new draft was staged. |
| `200` | The same completed request was replayed; the existing draft is returned. |
| `202` | A request with this key is already processing. Poll or retry with backoff. |
| `400` | Invalid JSON or contract validation failure. |
| `401` | Missing or invalid HMAC signature. |
| `409` | The idempotency key was reused for different content. Generate a new version/key. |
| `500` | SignalDesk could not stage the draft. Retry the same body and key with backoff. |

Successful responses include an editor deep link:

```json
{
  "ok": true,
  "id": "article-uuid",
  "status": "draft",
  "replayed": false,
  "admin_path": "/admin/collections/hr_articles/article-uuid"
}
```

## Taxonomy and identity rules

- Known sections and the first known author are linked by normalized slug.
- Unknown sections are stored in `suggested_section`; they are not silently
  promoted into the site's navigation or editorial taxonomy.
- All upstream author names/IDs remain in `bylines`, even when no production
  author relation exists.
- Tags, AI/source provenance, media rights metadata, upstream document ID and
  version are preserved on the draft.
- `ingest_key` and `hr_integration_receipts.idempotency_key` are unique. A
  crash after article creation is recovered by looking up the article before
  another draft can be created.

## Sender example

The sender must sign the exact string it transmits:

```ts
const body = JSON.stringify(exportedArticle)
const signature = createHmac('sha256', SIGNALDESK_WEBHOOK_SECRET)
  .update(body)
  .digest('base64')

await fetch(`${SIGNALDESK_ORIGIN}/api/integrations/hunts-pointe`, {
  method: 'POST',
  headers: {
    'content-type': 'application/json',
    'idempotency-key': `seed-refiner:${documentId}:${version}`,
    'x-webhook-signature': signature,
  },
  body,
})
```

## Release check

1. Configure `WEBHOOK_SECRET` in both server environments and
   `SEED_REFINER_ORIGIN` in SignalDesk.
2. Run the additive Payload migration.
3. Send one signed fixture twice with the same key. Expect `201`, then `200`,
   and exactly one draft.
4. Send changed content with the same key. Expect `409`.
5. Confirm the draft is private, its workflow stage is Intake, all four quality
   checks are false, and Publish is rejected for non-managing roles.
6. Rotate the secret after any suspected exposure.
