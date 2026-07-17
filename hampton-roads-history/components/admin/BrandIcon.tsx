import styles from "./BrandMark.module.css";

export default function BrandIcon() {
  return (
    <div className={`${styles.logo} ${styles.iconOnly}`} aria-label="Hampton Roads">
      <span className={styles.seal} aria-hidden="true">
        H<em>R</em>
      </span>
      <span className={styles.name}>Hampton Roads</span>
    </div>
  );
}
