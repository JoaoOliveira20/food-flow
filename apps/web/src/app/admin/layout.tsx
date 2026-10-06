import type { Metadata } from "next";
import Link from "next/link";
import styles from "@/components/admin/admin.module.css";

export const metadata: Metadata = {
  title: "Admin · Food Flow",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <div className={styles.shell}>
      <header className={styles.topBar}>
        <Link href="/admin" className={styles.brand}>
          <svg viewBox="0 0 32 32" aria-hidden="true">
            <path d="M4 13c0-5 5.4-9 12-9s12 4 12 9H4z" />
            <rect x="3" y="15" width="26" height="3" rx="1.5" />
            <path d="M4 20h24v2a6 6 0 0 1-6 6H10a6 6 0 0 1-6-6v-2z" />
          </svg>
          Food Flow <span className={styles.brandTag}>Admin</span>
        </Link>
        <nav className={styles.nav} aria-label="Admin">
          <Link href="/admin" className={styles.navLink}>
            Painel
          </Link>
          <Link href="/" className={styles.navLink}>
            Ver montador ↗
          </Link>
        </nav>
      </header>
      <p className={styles.notice}>
        Versão de demonstração: o admin ainda não tem login. Qualquer alteração aparece para todos.
      </p>
      <main className={styles.content}>{children}</main>
    </div>
  );
}
