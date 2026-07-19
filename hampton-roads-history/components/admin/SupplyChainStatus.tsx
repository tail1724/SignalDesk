import type { ServerProps } from "payload";
import { hasRole } from "@/lib/payload/access";
import styles from "./AdminPanels.module.css";

// Epic A (plan §08): ad supply-chain declarations. The /ads.txt and
// /sellers.json routes are env-driven (503 when unset); repo fixtures under
// supply-chain/ are reconciled in CI by scripts/validate-supply-chain.mts.
// This panel reports whether the live routes will serve. Ad Ops / analyst /
// super admin.
export default async function SupplyChainStatus({ user }: ServerProps) {
  if (!hasRole(user, ["super_admin", "ad_ops", "analyst"])) return null;

  const adsTxt = Boolean(process.env.ADS_TXT_CONTENT);
  const sellers = Boolean(process.env.SELLERS_JSON_CONTENT);

  const rows: { label: string; ok: boolean; note: string }[] = [
    { label: "/ads.txt", ok: adsTxt, note: adsTxt ? "serving (env configured)" : "503 — ADS_TXT_CONTENT unset" },
    { label: "/sellers.json", ok: sellers, note: sellers ? "serving (env configured)" : "503 — SELLERS_JSON_CONTENT unset" },
  ];

  return (
    <section className={styles.panel} aria-labelledby="scs-title">
      <header className={styles.panelHeader}>
        <div>
          <span className={styles.kicker}>Supply chain</span>
          <h2 id="scs-title">Declarations</h2>
        </div>
      </header>
      {rows.map((r) => (
        <div className={styles.row} key={r.label}>
          <span>
            <strong>{r.label}</strong>
            <small>{r.note}</small>
          </span>
          <span className={`${styles.badge} ${r.ok ? styles.ok : styles.warn}`}>{r.ok ? "Live" : "Unset"}</span>
        </div>
      ))}
      <p className={styles.empty}>Repo fixtures in supply-chain/ are syntax-checked and reconciled in CI.</p>
    </section>
  );
}
