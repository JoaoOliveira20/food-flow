"use client";

import { AdminStatus } from "@/components/admin/AdminStatus";
import styles from "@/components/admin/admin.module.css";

type ErrorProps = {
  error: Error & { digest?: string };
  retry: () => void;
};

export default function Error({ retry }: ErrorProps) {
  return (
    <AdminStatus
      title="Não foi possível carregar o admin"
      message="A API não respondeu. Verifique se ela está rodando (pnpm dev:api) e tente de novo."
    >
      <button className={styles.buttonPrimary} onClick={() => retry()}>
        Tentar de novo
      </button>
    </AdminStatus>
  );
}
