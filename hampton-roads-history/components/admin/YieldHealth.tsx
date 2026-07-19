import type { ServerProps } from "payload";
import { hasRole } from "@/lib/payload/access";
import { createServiceSupabase } from "@/lib/supabase/service";
import styles from "./AdminPanels.module.css";

// Epic A (plan §08): revenue/viewability health from the Epic Y reporting
// rollup (hr_ad_daily, produced nightly by scripts/aggregate-ads.mts). Analyst
// / Ad Ops / super admin only. The launch gate (§12) is viewability >= 70%
// overall with no placement < 55%, so those thresholds drive the badges.
const LAUNCH_MIN_OVERALL = 0.7;
const LAUNCH_MIN_PLACEMENT = 0.55;

type DailyRow = { placement_id: string; renders: number | null; viewables: number | null };

export default async function YieldHealth({ user }: ServerProps) {
  if (!hasRole(user, ["super_admin", "ad_ops", "analyst"])) return null;

  let rows: DailyRow[] = [];
  let configured = true;
  try {
    const supabase = createServiceSupabase();
    const since = new Date(Date.now() - 7 * 86_400_000).toISOString().slice(0, 10);
    const { data, error } = await supabase
      .from("hr_ad_daily")
      .select("placement_id, renders, viewables")
      .gte("day", since);
    if (error) throw error;
    rows = data ?? [];
  } catch {
    configured = false;
  }

  // Fold to per-placement totals over the window.
  const byPlacement = new Map<string, { renders: number; viewables: number }>();
  for (const r of rows) {
    const agg = byPlacement.get(r.placement_id) ?? { renders: 0, viewables: 0 };
    agg.renders += r.renders ?? 0;
    agg.viewables += r.viewables ?? 0;
    byPlacement.set(r.placement_id, agg);
  }
  const totalRenders = [...byPlacement.values()].reduce((s, a) => s + a.renders, 0);
  const totalViewables = [...byPlacement.values()].reduce((s, a) => s + a.viewables, 0);
  const overall = totalRenders > 0 ? totalViewables / totalRenders : null;

  return (
    <section className={styles.panel} aria-labelledby="yh-title">
      <header className={styles.panelHeader}>
        <div>
          <span className={styles.kicker}>Yield &amp; ad ops</span>
          <h2 id="yh-title">Viewability health · 7 days</h2>
        </div>
      </header>

      {!configured ? (
        <p className={styles.empty}>
          Reporting rollup not reachable. Run <code>npm run aggregate:ads -- --execute</code> nightly to populate
          hr_ad_daily.
        </p>
      ) : byPlacement.size === 0 ? (
        <p className={styles.empty}>No aggregated ad data yet for the last 7 days.</p>
      ) : (
        <>
          <div className={styles.statRow}>
            <div className={styles.stat}>
              <span>Renders</span>
              <strong>{totalRenders.toLocaleString()}</strong>
            </div>
            <div className={styles.stat}>
              <span>Viewable</span>
              <strong>{totalViewables.toLocaleString()}</strong>
            </div>
            <div className={styles.stat}>
              <span>Overall viewability</span>
              <strong>{overall == null ? "n/a" : `${Math.round(overall * 100)}%`}</strong>
            </div>
          </div>

          {[...byPlacement.entries()]
            .map(([placement_id, a]) => ({
              placement_id,
              rate: a.renders > 0 ? a.viewables / a.renders : null,
            }))
            .sort((x, y) => (y.rate ?? 0) - (x.rate ?? 0))
            .map(({ placement_id, rate }) => {
              const low = rate != null && rate < LAUNCH_MIN_PLACEMENT;
              return (
                <div className={styles.row} key={placement_id}>
                  <span>
                    <strong>{placement_id}</strong>
                    <div className={styles.bar}>
                      <div
                        className={styles.barFill}
                        data-low={low ? "true" : "false"}
                        style={{ width: `${Math.round((rate ?? 0) * 100)}%` }}
                      />
                    </div>
                  </span>
                  <span className={`${styles.badge} ${rate == null ? styles.muted : low ? styles.bad : styles.ok}`}>
                    {rate == null ? "n/a" : `${Math.round(rate * 100)}%`}
                  </span>
                </div>
              );
            })}

          <p className={styles.empty}>
            Launch gate: overall &ge; {Math.round(LAUNCH_MIN_OVERALL * 100)}%, every placement &ge;{" "}
            {Math.round(LAUNCH_MIN_PLACEMENT * 100)}%.
          </p>
        </>
      )}
    </section>
  );
}
