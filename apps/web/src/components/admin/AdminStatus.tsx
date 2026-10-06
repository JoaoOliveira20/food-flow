import type { ReactNode } from "react";
import styles from "./admin.module.css";

type AdminStatusProps = {
  title: string;
  message: string;
  isBusy?: boolean;
  children?: ReactNode;
};

export function AdminStatus({ title, message, isBusy = false, children }: AdminStatusProps) {
  return (
    <div className={`${styles.card} ${styles.statusCard}`} role={isBusy ? "status" : undefined} aria-busy={isBusy}>
      <h1 className={styles.cardTitle}>{title}</h1>
      <p className={styles.pageSubtitle}>{message}</p>
      {children}
    </div>
  );
}
