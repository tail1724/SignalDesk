import Link from "next/link";
import type { ServerProps } from "payload";
import { hasRole } from "@/lib/payload/access";
import styles from "./AdminPanels.module.css";

// Epic A (plan §08): a read-only window over the append-only audit log
// (hr_audit_events). Governance roles only; the collection itself is
// create/update/delete = never (server-written only).
export default async function AuditTimeline({ payload, user }: ServerProps) {
  if (!hasRole(user, ["super_admin", "managing_editor", "ad_ops", "analyst"])) return null;

  const events = await payload
    .find({
      collection: "hr_audit_events",
      sort: "-createdAt",
      limit: 10,
      depth: 0,
      select: { action: true, actor_email: true, actor_role: true, object_type: true, createdAt: true },
    })
    .catch(() => ({ docs: [] as Record<string, unknown>[] }));

  return (
    <section className={styles.panel} aria-labelledby="at-title">
      <header className={styles.panelHeader}>
        <div>
          <span className={styles.kicker}>Governance</span>
          <h2 id="at-title">Audit timeline</h2>
        </div>
        <Link href="/admin/collections/hr_audit_events">View log</Link>
      </header>

      {events.docs.length ? (
        events.docs.map((e, i) => (
          <div className={styles.row} key={(e.id as string) ?? i}>
            <span>
              <strong>{String(e.action)}</strong>
              <small>
                {String(e.actor_email)} · {String(e.actor_role)} · {String(e.object_type)}
              </small>
            </span>
            <span className={`${styles.badge} ${styles.muted}`}>
              {e.createdAt
                ? new Date(e.createdAt as string).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                : ""}
            </span>
          </div>
        ))
      ) : (
        <p className={styles.empty}>No audit events recorded yet.</p>
      )}
    </section>
  );
}
