import Link from "next/link";
import type { ServerProps } from "payload";
import { hasRole } from "@/lib/payload/access";
import styles from "./AdminPanels.module.css";

// Epic A (plan §08): the ad-creative scan pipeline at a glance —
// pending → scanning → passed/failed/quarantined, plus the derived serving
// trust gate (passed + human_approved ⇒ is_trusted). Ad Ops / super admin only.
const STAGES: { key: string; label: string; tone: string }[] = [
  { key: "pending", label: "Pending", tone: styles.muted },
  { key: "scanning", label: "Scanning", tone: styles.warn },
  { key: "passed", label: "Passed", tone: styles.ok },
  { key: "failed", label: "Failed", tone: styles.bad },
  { key: "quarantined", label: "Quarantined", tone: styles.bad },
];

export default async function CreativeScanStatus({ payload, user }: ServerProps) {
  if (!hasRole(user, ["super_admin", "ad_ops"])) return null;

  const [counts, trusted, awaitingApproval] = await Promise.all([
    Promise.all(
      STAGES.map((s) =>
        payload
          .count({ collection: "hr_ad_creatives", where: { scan_status: { equals: s.key } } })
          .then((r) => r.totalDocs)
          .catch(() => 0)
      )
    ),
    payload.count({ collection: "hr_ad_creatives", where: { is_trusted: { equals: true } } }).then((r) => r.totalDocs).catch(() => 0),
    payload
      .count({
        collection: "hr_ad_creatives",
        where: { scan_status: { equals: "passed" }, human_approved: { equals: false } },
      })
      .then((r) => r.totalDocs)
      .catch(() => 0),
  ]);

  return (
    <section className={styles.panel} aria-labelledby="css-title">
      <header className={styles.panelHeader}>
        <div>
          <span className={styles.kicker}>Ad quality</span>
          <h2 id="css-title">Creative scan status</h2>
        </div>
        <Link href="/admin/collections/hr_ad_creatives">Manage creatives</Link>
      </header>

      <div className={styles.statRow}>
        {STAGES.map((s, i) => (
          <div className={styles.stat} key={s.key}>
            <span>{s.label}</span>
            <strong>{counts[i]}</strong>
          </div>
        ))}
      </div>

      <div className={styles.row}>
        <span>
          <strong>Trusted &amp; serving</strong>
          <small>Passed scan + human approval</small>
        </span>
        <span className={`${styles.badge} ${styles.ok}`}>{trusted}</span>
      </div>
      <div className={styles.row}>
        <span>
          <strong>Awaiting human approval</strong>
          <small>Passed scan, not yet approved</small>
        </span>
        <span className={`${styles.badge} ${awaitingApproval ? styles.warn : styles.muted}`}>{awaitingApproval}</span>
      </div>
    </section>
  );
}
