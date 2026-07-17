import styles from "./AdminQuickActions.module.css";

export default function AdminQuickActions() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "/";
  const seedRefinerUrl = process.env.SEED_REFINER_ORIGIN || "https://seed-refiner.lovable.app/";

  return (
    <div className={styles.actions} aria-label="Newsroom destinations">
      <a href={seedRefinerUrl} target="_blank" rel="noreferrer">
        <span className={styles.dot} aria-hidden="true" /> Seed Refiner
      </a>
      <a href={siteUrl} target="_blank" rel="noreferrer">
        View publication <span aria-hidden="true">↗</span>
      </a>
    </div>
  );
}
