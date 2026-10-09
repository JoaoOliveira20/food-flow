import type { ReactNode } from "react";
import styles from "./admin.module.css";

type AdminStatusProps = {
  title: string;
  message: string;
  children?: ReactNode;
};

export function AdminStatus({ title, message, children }: AdminStatusProps) {
  return (
    <div className={`${styles.panel} ${styles.statusCard}`}>
      <h1>{title}</h1>
      <p>{message}</p>
      {children}
    </div>
  );
}
