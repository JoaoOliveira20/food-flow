import Link from "next/link";
import type { ReactNode } from "react";
import styles from "./admin.module.css";

type AdminPageHeaderProps = {
  trail: string[];
  title: string;
  subtitle: ReactNode;
  notice?: string | null;
};

export function AdminPageHeader({ trail, title, subtitle, notice }: AdminPageHeaderProps) {
  return (
    <>
      <div className={styles.pageHeader}>
        <div>
          <p className={styles.breadcrumb}>
            <Link href="/admin">Painel</Link>
            {trail.map((item) => ` / ${item}`)}
          </p>
          <h1 className={styles.pageTitle}>{title}</h1>
          <p className={styles.pageSubtitle}>{subtitle}</p>
        </div>
      </div>
      {notice && (
        <p className={styles.success} role="status">
          {notice}
        </p>
      )}
    </>
  );
}
