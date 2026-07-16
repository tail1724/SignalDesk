# Hunt's Pointe → SignalDesk (draft staging)

Hunt's Pointe (upstream drafting app) stages articles into SignalDesk as
**drafts**. A human editor reviews and publishes them in SignalDesk's Payload
admin. Hunt's Pointe never writes to SignalDesk's database and never publishes.

```
Hunt's Pointe                                   SignalDesk
DistributePanel "Stage in SignalDesk"
   │  authedFetch("push-signaldesk", {...})
   ▼
push-signaldesk Edge Function (Supabase)
   │  HMAC-sign body with SIGNALDESK_WEBHOOK_SECRET
   │  POST + x-webhook-signature
   ▼
POST /api/integrations/hunts-pointe  ──►  verify HMAC (WEBHOOK_SECRET)
                                          find-or-create category + author
                                          content_text → Lexical
                                          payload.create(hr_articles, _status=draft)
                                          ▼
                                     Draft in /admin → editor publishes
```

## Contract

`POST /api/integrations/hunts-pointe`, `x-webhook-signature: base64(HMAC-SHA256(rawBody, WEBHOOK_SECRET))`

Body (subset of Hunt's Pointe's export-cms shape):

```jsonc
{
  "title": "string (required)",
  "dek": "string?",
  "byline": ["string"],        // byline[0] → author (find-or-create)
  "section": "string?",         // → category (find-or-create by slug)
  "story_tags": ["string"],     // accepted, not yet stored
  "publish_at": "ISO string?",
  "content_text": "string (required)",  // → Lexical body
  "slug": "string?"             // defaults to slugify(title)
}
```

Response `201`: `{ "ok": true, "id": "<uuid>", "status": "draft" }`.
`short_id`, `slug`, `read_time_min` are generated. Unknown section/author are
auto-created so a draft always lands; the editor fixes taxonomy before publish.

## Setup

**SignalDesk** — already has `WEBHOOK_SECRET`. No extra config; the endpoint
ships in this repo.

**Hunt's Pointe** — branch `claude/push-signaldesk-integration` on
`tail1724/hunt-s-pointe`. Deploy the `push-signaldesk` Edge Function and set its
secrets (these are server-only and must never enter the browser bundle):

```
supabase secrets set \
  SIGNALDESK_INGEST_URL="https://<signaldesk-host>/api/integrations/hunts-pointe" \
  SIGNALDESK_WEBHOOK_SECRET="<same value as SignalDesk WEBHOOK_SECRET>"
supabase functions deploy push-signaldesk
```

Turn it on only after manual publishing works end-to-end in SignalDesk's admin.
