import type { ReactNode } from "react";
import { BuilderHeader } from "./BuilderHeader";
import styles from "./burgerBuilder.module.css";

type BuilderStatusProps = {
  title: string;
  message: string;
  isBusy?: boolean;
  children?: ReactNode;
};

export function BuilderStatus({ title, message, isBusy = false, children }: BuilderStatusProps) {
  return (
    <div className={styles.page}>
      <BuilderHeader />
      <main className={styles.statusScreen} aria-busy={isBusy}>
        <div className={styles.statusCard} role={isBusy ? "status" : undefined}>
          <h1 className={styles.statusTitle}>{title}</h1>
          <p className={styles.statusMessage}>{message}</p>
          {children}
        </div>
      </main>
    </div>
  );
}
