import Link from "next/link";
import type { ServerProps } from "payload";
import { hasRole } from "@/lib/payload/access";
import styles from "./AdminPanels.module.css";

// Epic A (plan §08): editorial review queue, including drafts staged from
// Hunt's Pointe (Seed Refiner) which carry an AI-provenance chip. Visible to
// editorial roles only.
function stageLabel(value: unknown): string {
  return typeof value === "string" ? value.replaceAll("_", " ") : "draft";
}

export default async function WorkflowQueue({ payload, user }: ServerProps) {
  if (!hasRole(user, ["super_admin", "managing_editor", "copy_editor", "reporter"])) {
    return null;
  }

  const queue = await payload.find({
    collection: "hr_articles",
    depth: 0,
    limit: 8,
    pagination: false,
    sort: "-updatedAt",
    where: { workflow_stage: { in: ["copy_edit", "legal_review", "ready"] } },
    select: { title: true, workflow_stage: true, source_origin: true, updatedAt: true },
  });

  return (
    <section className={styles.panel} aria-labelledby="wq-title">
      <header className={styles.panelHeader}>
        <div>
          <span className={styles.kicker}>Editorial workflow</span>
          <h2 id="wq-title">Review queue</h2>
        </div>
        <Link href="/admin/collections/hr_articles?where[workflow_stage][in]=copy_edit,legal_review,ready">
          Open queue
        </Link>
      </header>

      {queue.docs.length ? (
        queue.docs.map((doc) => {
          const fromSeedRefiner = doc.source_origin === "hunts_pointe";
          return (
            <Link className={styles.row} key={doc.id} href={`/admin/collections/hr_articles/${doc.id}`}>
              <span>
                <strong>
                  {doc.title}
                  {fromSeedRefiner && <span className={styles.chip}>AI · Seed Refiner</span>}
                </strong>
                <small>
                  {fromSeedRefiner ? "Review draft · provenance attached" : "Newsroom"} · updated{" "}
                  {new Date(doc.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </small>
              </span>
              <span className={`${styles.badge} ${styles.muted}`}>{stageLabel(doc.workflow_stage)}</span>
            </Link>
          );
        })
      ) : (
        <p className={styles.empty}>Nothing awaiting review. Staged review drafts land here with provenance.</p>
      )}
    </section>
  );
}
