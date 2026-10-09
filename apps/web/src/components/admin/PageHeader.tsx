import Link from "next/link";
import type { ReactNode } from "react";
import styles from "./admin.module.css";

type Crumb = {
  label: string;
  href?: string;
};

type PageHeaderProps = {
  crumbs?: Crumb[];
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  isTitleHidden?: boolean;
};

export function PageHeader({ crumbs = [], title, description, actions, isTitleHidden = false }: PageHeaderProps) {
  return (
    <header className={styles.pageHeader}>
      <div>
        {crumbs.length > 0 && (
          <nav aria-label="Caminho" className={styles.eyebrow}>
            {crumbs.map((crumb, index) => (
              <span key={crumb.label}>
                {index > 0 && "/ "}
                {crumb.href ? <Link href={crumb.href}>{crumb.label}</Link> : crumb.label}
              </span>
            ))}
          </nav>
        )}
        <h1 className={isTitleHidden ? styles.srOnly : styles.pageTitle}>{title}</h1>
        {description && <p className={styles.pageDescription}>{description}</p>}
      </div>
      {actions && <div className={styles.pageActions}>{actions}</div>}
    </header>
  );
}
