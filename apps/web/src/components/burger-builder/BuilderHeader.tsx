import styles from "./burgerBuilder.module.css";

type BuilderHeaderProps = {
  onReset: () => void;
};

export function BuilderHeader({ onReset }: BuilderHeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.brand}>
        <svg className={styles.logo} viewBox="0 0 32 32" aria-hidden="true">
          <path d="M4 13c0-5 5.4-9 12-9s12 4 12 9H4z" />
          <rect x="3" y="15" width="26" height="3" rx="1.5" />
          <path d="M4 20h24v2a6 6 0 0 1-6 6H10a6 6 0 0 1-6-6v-2z" />
        </svg>
        <span className={styles.title}>Food Flow</span>
      </div>
      <button className={styles.resetButton} onClick={onReset}>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M20 12a8 8 0 1 1-2.34-5.66M20 4v5h-5" />
        </svg>
        Resetar
      </button>
    </header>
  );
}
