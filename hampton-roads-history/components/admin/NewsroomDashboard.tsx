import Link from "next/link";
import type { ServerProps } from "payload";
import styles from "./NewsroomDashboard.module.css";

function stageLabel(value: unknown): string {
  if (typeof value !== "string") return "Draft";
  return value.replaceAll("_", " ");
}

export default async function NewsroomDashboard({ payload, user }: ServerProps) {
  const [drafts, reviewQueue, urgent, receipts, recent] = await Promise.all([
    payload.count({ collection: "hr_articles", where: { _status: { equals: "draft" } } }),
    payload.count({
      collection: "hr_articles",
      where: { workflow_stage: { in: ["copy_edit", "legal_review", "ready"] } },
    }),
    payload.count({
      collection: "hr_articles",
      where: { priority: { in: ["urgent", "breaking"] } },
    }),
    payload.count({ collection: "hr_integration_receipts" }),
    payload.find({
      collection: "hr_articles",
      depth: 0,
      limit: 5,
      pagination: false,
      sort: "-updatedAt",
      select: {
        title: true,
        workflow_stage: true,
        source_origin: true,
        updatedAt: true,
      },
    }),
  ]);

  const seedRefinerUrl = process.env.SEED_REFINER_ORIGIN || "https://seed-refiner.lovable.app/";
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "/";
  const governance = [
    ["Consent enforcement", process.env.CONSENT_ENFORCEMENT === "enabled"],
    ["Retention jobs", process.env.RETENTION_JOBS_ENABLED === "true"],
    ["Role-based access", true],
    ["Advertiser separation", true],
    ["Creative trust gate", true],
    ["Append-only audit", true],
    ["ads.txt declaration", Boolean(process.env.ADS_TXT_CONTENT)],
    ["sellers.json declaration", Boolean(process.env.SELLERS_JSON_CONTENT)],
  ] as const;

  const greeting = typeof user?.email === "string" ? user.email.split("@")[0] : "newsroom";

  return (
    <section className={styles.dashboard} aria-labelledby="newsroom-dashboard-title">
      <div className={styles.hero}>
        <div>
          <span className={styles.eyebrow}>Hampton Roads · Newsroom control plane</span>
          <h1 id="newsroom-dashboard-title">Good to see you, {greeting}.</h1>
          <p>
            Move more high-quality stories from intake to publication without losing provenance,
            review ownership, performance, or the human publishing gate.
          </p>
          <span className={styles.connection}>
            <i aria-hidden="true" /> Seed Refiner connection configured · review drafts only
          </span>
        </div>
        <div className={styles.heroActions}>
          <Link href="/admin/collections/hr_articles/create">Create article</Link>
          <a href={seedRefinerUrl} target="_blank" rel="noreferrer">Open Seed Refiner ↗</a>
          <a href={siteUrl} target="_blank" rel="noreferrer">View publication ↗</a>
        </div>
      </div>

      <div className={styles.metrics} aria-label="Newsroom metrics">
        <article className={styles.metric}><span>Open drafts</span><strong>{drafts.totalDocs}</strong><small>Across every editorial desk</small></article>
        <article className={styles.metric}><span>Review queue</span><strong>{reviewQueue.totalDocs}</strong><small>Copy, legal, or ready</small></article>
        <article className={styles.metric}><span>Urgent work</span><strong>{urgent.totalDocs}</strong><small>Urgent and breaking priority</small></article>
        <article className={styles.metric}><span>AI receipts</span><strong>{receipts.totalDocs}</strong><small>Idempotent integration events</small></article>
      </div>

      <div className={styles.grid}>
        <section className={styles.panel} aria-labelledby="recent-work-title">
          <header className={styles.panelHeader}>
            <div><span className={styles.panelKicker}>Editorial workflow</span><h2 id="recent-work-title">Recently touched</h2></div>
            <Link href="/admin/collections/hr_articles">View all articles</Link>
          </header>
          {recent.docs.length ? recent.docs.map((doc, index) => (
            <Link className={styles.storyRow} href={`/admin/collections/hr_articles/${doc.id}`} key={doc.id}>
              <span className={styles.storyIndex}>{String(index + 1).padStart(2, "0")}</span>
              <span><strong>{doc.title}</strong><small>{doc.source_origin === "hunts_pointe" ? "Seed Refiner" : "Newsroom"} · updated {new Date(doc.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</small></span>
              <span className={styles.stage}>{stageLabel(doc.workflow_stage)}</span>
            </Link>
          )) : <p className={styles.empty}>No recent articles yet. Create one or stage a review draft from Seed Refiner.</p>}
        </section>

        <section className={styles.panel} aria-labelledby="launch-gate-title">
          <header className={styles.panelHeader}><div><span className={styles.panelKicker}>Production gate</span><h2 id="launch-gate-title">Governance status</h2></div></header>
          <ul className={styles.gateList}>
            {governance.map(([label, ready]) => <li key={label}><span>{label}</span><b className={ready ? undefined : styles.blocked}>{ready ? "Ready" : "Configure"}</b></li>)}
          </ul>
        </section>
      </div>
    </section>
  );
}
