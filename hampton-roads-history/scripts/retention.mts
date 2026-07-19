// Epic G retention job (design-blueprint.html §07 governance table):
//   raw reader/ad events            30 days
//   pseudonymous session rollups    90 days   (silver tier; nearest existing
//                                              analogue to "opportunity/
//                                              decision logs" — Epic Y hasn't
//                                              shipped those tables yet)
//   audit/security logs             24 months
// Aggregated reporting (hr_gold_trending) is a continuously-recomputed
// current-state table, not an append log, so no age-based purge applies to
// it — deleting "old" rows there would just delete live rankings.
//
// Defaults to a dry run (counts only, nothing deleted). Pass --execute to
// actually delete. Every execution — dry run or real — writes an audit
// event summarizing what ran.
//
// Usage:
//   node --import tsx scripts/retention.mts            # dry run
//   node --import tsx scripts/retention.mts --execute   # deletes
//
// Column names for the Supabase-managed tables (hr_page_events,
// hr_ad_impressions, hr_silver_article_sessions) are inferred from this
// repo's established created_at/timestamptz convention (every Payload-
// managed table uses it) — these three tables' DDL isn't checked into this
// repo (see docs/rls-audit.md), so confirm the column name against the live
// schema before the first --execute run in production.
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { loadEnvConfig } = require("@next/env") as typeof import("@next/env");

loadEnvConfig(process.cwd(), true);

const execute = process.argv.includes("--execute");

const { createServiceSupabase } = await import("@/lib/supabase/service");
const { getPayload } = await import("payload");
const { default: config } = await import("@payload-config");

const DAY_MS = 86_400_000;

type SupabaseTarget = {
  kind: "supabase";
  table: string;
  timestampColumn: string;
  retentionDays: number;
  label: string;
  // When set, only rows whose event_type is in this list are purged — lets one
  // table hold two retention classes (Epic Y: hr_ad_events keeps raw
  // render/viewable/engagement for 30d but opportunity/decision logs for 90d).
  eventTypeFilter?: string[];
};

const SUPABASE_TARGETS: SupabaseTarget[] = [
  { kind: "supabase", table: "hr_page_events", timestampColumn: "created_at", retentionDays: 30, label: "Raw reader events" },
  { kind: "supabase", table: "hr_ad_impressions", timestampColumn: "created_at", retentionDays: 30, label: "Raw ad events" },
  { kind: "supabase", table: "hr_silver_article_sessions", timestampColumn: "created_at", retentionDays: 90, label: "Pseudonymous session rollups" },
  // Epic Y event chain (plan §06.3): raw serving/engagement events at 30 days,
  // the opportunity/decision decision-logs at 90, the daily rollup at 13 months.
  {
    kind: "supabase",
    table: "hr_ad_events",
    timestampColumn: "created_at",
    retentionDays: 30,
    label: "Raw ad chain events",
    eventTypeFilter: ["ad_render", "ad_viewable", "page_engagement"],
  },
  {
    kind: "supabase",
    table: "hr_ad_events",
    timestampColumn: "created_at",
    retentionDays: 90,
    label: "Opportunity/decision logs",
    eventTypeFilter: ["ad_opportunity", "ad_decision"],
  },
  { kind: "supabase", table: "hr_ad_daily", timestampColumn: "updated_at", retentionDays: 13 * 30, label: "Ad reporting rollup" },
];

const AUDIT_RETENTION_DAYS = 24 * 30; // 24 months, treated as 30-day months like the plan's other month-denominated windows

async function runSupabaseTarget(target: SupabaseTarget) {
  const cutoff = new Date(Date.now() - target.retentionDays * DAY_MS).toISOString();

  try {
    const supabase = createServiceSupabase();

    let countQuery = supabase
      .from(target.table)
      .select("*", { count: "exact", head: true })
      .lt(target.timestampColumn, cutoff);
    if (target.eventTypeFilter) countQuery = countQuery.in("event_type", target.eventTypeFilter);
    const { count, error: countError } = await countQuery;

    if (countError) {
      return { ...target, cutoff, matched: null, deleted: false, error: countError.message };
    }

    if (!execute) {
      return { ...target, cutoff, matched: count ?? 0, deleted: false, error: null };
    }

    let deleteQuery = supabase.from(target.table).delete().lt(target.timestampColumn, cutoff);
    if (target.eventTypeFilter) deleteQuery = deleteQuery.in("event_type", target.eventTypeFilter);
    const { error: deleteError } = await deleteQuery;
    return { ...target, cutoff, matched: count ?? 0, deleted: !deleteError, error: deleteError?.message ?? null };
  } catch (error) {
    return { ...target, cutoff, matched: null, deleted: false, error: error instanceof Error ? error.message : String(error) };
  }
}

async function runAuditRetention() {
  const cutoff = new Date(Date.now() - AUDIT_RETENTION_DAYS * DAY_MS).toISOString();
  const base = { label: "Audit/security logs", table: "hr_audit_events", cutoff };

  try {
    const payload = await getPayload({ config, disableOnInit: true });
    const matched = await payload.count({
      collection: "hr_audit_events",
      overrideAccess: true,
      where: { createdAt: { less_than: cutoff } },
    });

    if (!execute) {
      return { ...base, matched: matched.totalDocs, deleted: false, error: null };
    }

    const result = await payload.delete({
      collection: "hr_audit_events",
      overrideAccess: true,
      where: { createdAt: { less_than: cutoff } },
    });
    const deletedCount = Array.isArray(result.docs) ? result.docs.length : matched.totalDocs;
    return { ...base, matched: deletedCount, deleted: true, error: null };
  } catch (error) {
    return { ...base, matched: null, deleted: false, error: error instanceof Error ? error.message : String(error) };
  }
}

async function main() {
  const results = [];
  for (const target of SUPABASE_TARGETS) {
    results.push(await runSupabaseTarget(target));
  }
  results.push(await runAuditRetention());

  // eslint-disable-next-line no-console
  console.log(`\nRetention job — ${execute ? "EXECUTE" : "DRY RUN"} — ${new Date().toISOString()}\n`);
  for (const r of results) {
    const status = r.error ? `ERROR: ${r.error}` : execute ? `deleted ${r.matched}` : `would delete ${r.matched}`;
    // eslint-disable-next-line no-console
    console.log(`  ${r.label.padEnd(32)} ${r.table.padEnd(28)} cutoff ${r.cutoff}  ${status}`);
  }

  // Audit trail for the run itself — a privileged, off-band process, exactly
  // the kind of action the append-only audit log exists to record.
  try {
    const payload = await getPayload({ config, disableOnInit: true });
    await payload.create({
      collection: "hr_audit_events",
      overrideAccess: true,
      data: {
        action: execute ? "retention.executed" : "retention.dry_run",
        actor_email: "system",
        actor_role: "system",
        object_type: "retention_job",
        metadata: { results },
      },
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Failed to record retention audit event:", error);
  }

  const failed = results.some((r) => r.error);
  process.exit(failed ? 1 : 0);
}

await main();
