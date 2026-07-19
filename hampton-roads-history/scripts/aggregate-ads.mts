// Epic Y (plan §07.3, §10.4): nightly ad-events aggregation. Rolls the raw
// hr_ad_events chain up into hr_ad_daily at the (day, placement_id, experiment)
// grain — the reporting surface the admin YieldHealth panel and the launch gate
// (§12: "viewability >=70% overall, no placement <55%") read cheaply.
//
// Metrics come from the serving chain in hr_ad_events (opportunities, decisions,
// renders, viewables, and viewability_rate = viewables / renders). Clicks are
// token-bound in hr_ad_impressions and carry no experiment dimension, so they
// are intentionally left at 0 here; CTR reporting joins that table separately.
// (Follow-up: dual-log ad_click into hr_ad_events to make clicks arm-attributable.)
//
// Defaults to a dry run (computes and prints the rollup, writes nothing). Pass
// --execute to upsert. Aggregates yesterday (UTC) by default; --day=YYYY-MM-DD
// targets a specific day (e.g. for a backfill).
//
// Usage:
//   node --import tsx scripts/aggregate-ads.mts                 # dry run, yesterday
//   node --import tsx scripts/aggregate-ads.mts --execute        # write
//   node --import tsx scripts/aggregate-ads.mts --day=2026-07-18 --execute
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { loadEnvConfig } = require("@next/env") as typeof import("@next/env");
loadEnvConfig(process.cwd(), true);

const execute = process.argv.includes("--execute");
const dayArg = process.argv.find((a) => a.startsWith("--day="))?.slice("--day=".length);

const { createServiceSupabase } = await import("@/lib/supabase/service");

const PAGE_SIZE = 1000;

function targetDay(): string {
  if (dayArg) return dayArg;
  const d = new Date(Date.now() - 86_400_000); // yesterday UTC
  return d.toISOString().slice(0, 10);
}

type Row = {
  day: string;
  placement_id: string;
  experiment: string;
  route_type: string | null;
  opportunities: number;
  decisions: number;
  renders: number;
  viewables: number;
  clicks: number;
  viewability_rate: number | null;
  updated_at: string;
};

const EVENT_TO_METRIC: Record<string, keyof Row> = {
  ad_opportunity: "opportunities",
  ad_decision: "decisions",
  ad_render: "renders",
  ad_viewable: "viewables",
};

async function main() {
  const day = targetDay();
  const startISO = `${day}T00:00:00.000Z`;
  const endISO = `${day}T23:59:59.999Z`;
  const supabase = createServiceSupabase();

  const rows = new Map<string, Row>();
  let from = 0;
  let scanned = 0;

  // Page through the day's events. page_engagement is a page-level signal with
  // no placement metric column of its own, so it is skipped in this rollup.
  for (;;) {
    const { data, error } = await supabase
      .from("hr_ad_events")
      .select("event_type, placement_id, experiment, route_type")
      .gte("created_at", startISO)
      .lte("created_at", endISO)
      .range(from, from + PAGE_SIZE - 1);

    if (error) {
      console.error(`Aggregation failed reading hr_ad_events: ${error.message}`);
      process.exit(1);
    }
    if (!data || data.length === 0) break;
    scanned += data.length;

    for (const e of data) {
      const metric = EVENT_TO_METRIC[e.event_type as string];
      if (!metric) continue; // page_engagement / unknown
      const experiment = (e.experiment as string) ?? "standard";
      const placement_id = e.placement_id as string;
      if (!placement_id) continue;
      const key = `${placement_id}|${experiment}`;
      let row = rows.get(key);
      if (!row) {
        row = {
          day,
          placement_id,
          experiment,
          route_type: (e.route_type as string) ?? null,
          opportunities: 0,
          decisions: 0,
          renders: 0,
          viewables: 0,
          clicks: 0,
          viewability_rate: null,
          updated_at: new Date().toISOString(),
        };
        rows.set(key, row);
      }
      (row[metric] as number) += 1;
    }

    if (data.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  const rollup = [...rows.values()].map((r) => ({
    ...r,
    viewability_rate: r.renders > 0 ? Number((r.viewables / r.renders).toFixed(4)) : null,
  }));

  console.log(`\nAd aggregation — ${execute ? "EXECUTE" : "DRY RUN"} — day ${day} — ${new Date().toISOString()}`);
  console.log(`  scanned ${scanned} events → ${rollup.length} (placement × experiment) rows\n`);
  for (const r of rollup) {
    console.log(
      `  ${r.placement_id.padEnd(20)} ${r.experiment.padEnd(10)} ` +
        `opp ${r.opportunities}  dec ${r.decisions}  render ${r.renders}  view ${r.viewables}  ` +
        `viewability ${r.viewability_rate == null ? "n/a" : `${Math.round(r.viewability_rate * 100)}%`}`
    );
  }

  if (!execute) {
    console.log("\nDry run — nothing written. Re-run with --execute to upsert into hr_ad_daily.");
    process.exit(0);
  }

  if (rollup.length === 0) {
    console.log("\nNo events for this day — nothing to upsert.");
    process.exit(0);
  }

  const { error } = await supabase
    .from("hr_ad_daily")
    .upsert(rollup, { onConflict: "day,placement_id,experiment" });
  if (error) {
    console.error(`Upsert into hr_ad_daily failed: ${error.message}`);
    process.exit(1);
  }
  console.log(`\nUpserted ${rollup.length} rows into hr_ad_daily.`);
  process.exit(0);
}

await main();
