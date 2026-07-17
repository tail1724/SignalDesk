# Payload newsroom control plane

## Outcome

This redesign turns Payload from a generic CMS into a high-throughput newsroom
control plane for Hampton Roads reporting. It combines a restrained American
civic identity with explicit workflow ownership, fast queues, source
provenance, human publishing authority, advertiser separation, and operational
governance.

The visual direction is “American civic institution, not campaign branding”:
deep federal navy, harbor blue, signal red, aged-paper neutrals, restrained
brass, editorial serif display type, compact utility typography, grid texture,
and clipped/asymmetric corners. It is designed to feel authoritative and
regionally specific without using flags as decoration or overwhelming daily
publishing work.

## Information architecture

| Admin group | Purpose | Primary users |
|---|---|---|
| Editorial | Articles, media, authors, categories | Managing editor, copy editor, reporter |
| Live desk | Breaking-news banner | Managing editor, copy editor, reporter |
| Standards | Corrections and public accountability | Managing editor, copy editor, reporter |
| Revenue | Creative intake, scan state, human approval | Ad operations, super administrator |
| Governance | Integration receipts and audit history | Leadership, ad operations, analyst |
| People & access | Accounts, roles, desk assignment, deactivation | Super administrator, managing editor |

The dashboard leads with open drafts, the review queue, urgent work, ingestion
receipts, recently changed stories, and launch-gate status. Dense collection
views use predictable default columns, list-search fields, 25–250 row page
sizes, and database indexes aligned with the queues editors actually use.

## Editorial state machine

`_status` is the only public/draft boundary. `workflow_stage` expresses what the
newsroom needs to do next; it never overrides publication state.

```text
Intake → Reporting → Draft → Copy edit → Legal review → Ready → Scheduled → Published
                       ↖──────── Changes requested ────────┘
```

Rules:

- Seed Refiner always enters at `Intake` with `_status=draft`.
- Priority is independent: `standard`, `urgent`, or `breaking`.
- An assignee and desk make ownership visible without embedding workflow in
  free-form notes.
- Only a managing editor or super administrator may make the first transition
  to `_status=published`.
- First publication is rejected unless fact, source, rights, and disclosure
  checks are all true.
- The publish hook sets `workflow_stage=published` and `published_at`.
- AI provenance supports recommendations and traceability. It does not grant
  publishing authority, rewrite editorial policy, or optimize editorial
  decisions solely for estimated CPM.

## Role matrix

| Capability | Super admin | Managing editor | Copy editor | Reporter | Ad ops | Analyst | AI service |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| Enter admin | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Create a draft | ✓ | ✓ | ✓ | ✓ | — | — | service only |
| Edit newsroom content | ✓ | ✓ | ✓ | ✓ | — | — | — |
| First publish | ✓ | ✓ | — | — | — | — | — |
| Manage taxonomy/delete content | ✓ | ✓ | — | — | — | — | — |
| Manage users | ✓ | ✓ | — | — | — | — | — |
| Create/delete users | ✓ | — | — | — | — | — | — |
| Operate ad creatives | ✓ | — | — | — | ✓ | — | — |
| Read governance records | ✓ | ✓ | — | — | ✓ | ✓ | — |

Deactivated accounts lose their role capabilities. The additive migration
assigns every account that existed before roles were introduced to
`super_admin`, preventing owner lockout; every account created afterward
defaults to `reporter` and should be assigned deliberately.

## Governance built into the model

- **Consent enforcement:** production must not mark this launch gate ready
  until the consent manager is deployed and `CONSENT_ENFORCEMENT=enabled`.
- **Retention:** production must schedule and monitor deletion/aggregation jobs
  before setting `RETENTION_JOBS_ENABLED=true`. Retain raw event/session data
  only for the approved period; retain aggregates without stable identifiers.
- **RBAC:** deny-by-default role boundaries protect editorial, revenue, people,
  and governance collections. AI service accounts cannot publish or operate ads.
- **Advertiser separation:** editorial roles cannot access creative operations;
  ad operations cannot mutate newsroom content.
- **Creative trust:** every creative begins `pending` and untrusted. Serving
  requires a passed scan plus separate human approval. The database rejects a
  trusted flag that does not satisfy both conditions, and the migration
  quarantines all existing creatives for re-review.
- **Audit history:** article and creative mutations write actor/object records
  with before/after SHA-256 hashes. Governance collections disallow normal
  client mutation.
- **Supply chain:** `ADS_TXT_CONTENT` and `SELLERS_JSON_CONTENT` are explicit
  launch gates. Their production values must match the authorized sellers and
  exchanges; never copy a generic declaration from another property.
- **Editorial independence:** revenue estimates are not article fields and are
  not exposed to newsroom roles. Automated imports remain drafts.

The dashboard intentionally says `Configure` instead of presenting false
assurance when an operator-owned control is missing.

## Performance and volume design

The first release improves the hot editorial path without adding a new service:

- compound indexes cover workflow/priority recency and source document lookup;
- unique ingest keys make retries cheap and safe;
- dashboard counts and the recent-story query run concurrently;
- collection lists select only operational columns and use bounded pagination;
- image binaries stay in S3-compatible object storage instead of the app node;
- external plain text becomes Lexical once at ingestion, not on every render;
- the integration caps payload size, authors, tags, provenance sources, and media;
- article versions preserve accountability while the main row stays queryable.

Production operating targets:

| Signal | Target / alert |
|---|---|
| Admin p75 navigation | under 1.5 s on newsroom broadband |
| Draft-ingest p95 | under 1 s excluding upstream media transfer |
| Ingest error rate | alert above 1% over 15 minutes |
| Receipt stuck in `processing` | alert after 5 minutes |
| Review queue age | desk-specific SLA, visible in operations reporting |
| Database pool saturation | alert above 80% sustained |
| Largest article payload | reject above contract limit; do not silently truncate |

At materially higher scale, move slow scanning, media pulls, embeddings, and
notifications to Payload jobs/worker processes. Do not make the synchronous
draft-ingest response wait on those tasks.

## Deployment sequence

1. Rotate any credential that has appeared in chat, logs, screenshots, or a
   client bundle. Create a distinct `WEBHOOK_SECRET` and `AD_HMAC_SECRET`.
2. Back up the production database and verify restore access.
3. Deploy code with `SEED_REFINER_ORIGIN`, supply-chain declarations, and the
   governance flags set to their truthful current states.
4. Run `npm run migrate` as a pre-deploy job. The migration is additive: it
   creates new enums/tables/indexes, extends current rows and article versions,
   bootstraps existing users, and quarantines creatives.
5. Start one app instance and smoke-test login, dashboard, article edit, media,
   role visibility, creative visibility, and an HMAC-signed Seed Refiner draft.
6. Verify a reporter cannot publish, ad ops cannot open articles, and an AI
   service cannot read draft/governance/revenue data.
7. Scale app instances only after the migration and smoke test pass. Monitor DB
   connections because every instance owns a pool.
8. Enable the Seed Refiner sender button only after duplicate/retry behavior is
   proven with the release check in `docs/hunts-pointe-integration.md`.

## Rollback

- **Code rollback:** deploy the previous application build. Additive columns and
  tables are ignored by the old code.
- **Integration stop:** disable the sender or rotate `WEBHOOK_SECRET`; staged
  drafts and receipts remain available for review.
- **Schema rollback:** use the generated down migration only after exporting new
  receipt, audit, workflow, and provenance data. Down migration is destructive
  to those new fields/tables and should not be the first response to an app bug.
- **Creative safety:** do not bulk restore `is_trusted`. Re-scan and re-approve.

## Verification gate

No code is ready to ship unless all of these pass on Node 22:

```bash
npm ci
npm run prebuild
npx tsc --noEmit
npm test
npm run lint
npm run build
```

Then execute the role, publish, ingestion replay, governance, migration, and
rollback smoke tests above in staging. A green build does not waive an
unconfigured governance launch gate.

