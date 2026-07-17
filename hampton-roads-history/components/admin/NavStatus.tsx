import styles from "./NavStatus.module.css";

export default function NavStatus() {
  return (
    <div className={styles.status}>
      <span className={styles.label}>Newsroom online</span>
      <p>Seed Refiner stages drafts. Human approval remains required to publish.</p>
    </div>
  );
}
