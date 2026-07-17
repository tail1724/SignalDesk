import styles from "./BrandMark.module.css";

export default function BrandLogo() {
  return (
    <div className={styles.logo} aria-label="Hampton Roads newsroom control plane">
      <span className={styles.seal} aria-hidden="true">
        H<em>R</em>
      </span>
      <span className={styles.name}>
        <strong>Hampton Roads</strong>
        <small>Newsroom control plane</small>
      </span>
    </div>
  );
}
