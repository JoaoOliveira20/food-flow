"use client";

import { BuilderStatus } from "@/components/burger-builder/BuilderStatus";
import styles from "@/components/burger-builder/burgerBuilder.module.css";

type ErrorProps = {
  error: Error & { digest?: string };
  retry: () => void;
};

export default function Error({ retry }: ErrorProps) {
  return (
    <BuilderStatus
      title="Não foi possível carregar o montador"
      message="O serviço de ingredientes não respondeu. Verifique a conexão e tente de novo."
    >
      <button className={styles.statusAction} onClick={() => retry()}>
        Tentar de novo
      </button>
    </BuilderStatus>
  );
}
