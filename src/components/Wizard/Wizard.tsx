import styles from './Wizard.module.css';

export function Wizard() {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Guided EQ Wizard</h1>
      <p className={styles.subtitle}>Coming soon — a step-by-step guide to building your personalised EQ profile.</p>
    </div>
  );
}
