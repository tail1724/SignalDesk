import type { ServerProps } from "payload";
import { hasRole } from "@/lib/payload/access";
import { CONSENT_VERSION } from "@/lib/consent";
import styles from "./AdminPanels.module.css";

// Epic A (plan §08): the governance gate — the production-readiness checks that
// must hold before (and during) launch: consent policy version, when retention
// last ran, and the supply-chain declarations. Governance roles only.
export default async function GovernanceGate({ payload, user }: ServerProps) {
  if (!hasRole(user, ["super_admin", "managing_editor", "ad_ops", "analyst"])) return null;

  const lastRetention = await payload
    .find({
      collection: "hr_audit_events",
      where: { action: { in: ["retention.executed", "retention.dry_run"] } },
      sort: "-createdAt",
      limit: 1,
      depth: 0,
    })
    .then((r) => r.docs[0])
    .catch(() => undefined);

  const retentionWhen = lastRetention?.createdAt
    ? new Date(lastRetention.createdAt as string).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : null;

  const checks: { label: string; ok: boolean; note: string }[] = [
    { label: "Consent policy", ok: true, note: `v${CONSENT_VERSION} · first-party layer` },
    {
      label: "Retention job",
      ok: Boolean(retentionWhen),
      note: retentionWhen ? `last ran ${retentionWhen}` : "no run recorded",
    },
    { label: "ads.txt declaration", ok: Boolean(process.env.ADS_TXT_CONTENT), note: process.env.ADS_TXT_CONTENT ? "configured" : "unset" },
    { label: "sellers.json declaration", ok: Boolean(process.env.SELLERS_JSON_CONTENT), note: process.env.SELLERS_JSON_CONTENT ? "configured" : "unset" },
    {
      label: "Revenue density experiment",
      ok: true,
      note: process.env.NEXT_PUBLIC_ADS_REVENUE_EXPERIMENT === "1" ? "enabled (launch)" : "disabled (default)",
    },
  ];

  return (
    <section className={styles.panel} aria-labelledby="gg-title">
      <header className={styles.panelHeader}>
        <div>
          <span className={styles.kicker}>Production gate</span>
          <h2 id="gg-title">Governance</h2>
        </div>
      </header>
      {checks.map((c) => (
        <div className={styles.row} key={c.label}>
          <span>
            <strong>{c.label}</strong>
            <small>{c.note}</small>
          </span>
          <span className={`${styles.badge} ${c.ok ? styles.ok : styles.warn}`}>{c.ok ? "Ready" : "Configure"}</span>
        </div>
      ))}
    </section>
  );
}
