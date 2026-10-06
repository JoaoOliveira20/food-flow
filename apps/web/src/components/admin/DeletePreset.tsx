"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ApiError, deletePreset } from "@/api/admin/mutations";
import type { AdminPreset } from "@/api/admin/types";
import styles from "./admin.module.css";

type DeletePresetProps = {
  preset: AdminPreset;
};

export function DeletePreset({ preset }: DeletePresetProps) {
  const router = useRouter();
  const [isConfirming, setIsConfirming] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirmDelete() {
    setIsDeleting(true);
    setError(null);
    try {
      await deletePreset(preset.id);
      router.push("/admin");
      router.refresh();
    } catch (caught) {
      setIsConfirming(false);
      setError(caught instanceof ApiError ? caught.message : "Não foi possível excluir o preset.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <section className={styles.card} aria-labelledby="delete-preset-title">
      <h2 id="delete-preset-title" className={styles.cardTitle}>
        Excluir preset
      </h2>
      {preset.isInitial ? (
        <p className={styles.cardHint}>
          Este é o preset da composição inicial: ele define o hambúrguer que aparece ao abrir o montador e por isso não pode
          ser excluído. Você pode editá-lo normalmente.
        </p>
      ) : (
        <>
          <p className={styles.cardHint}>A exclusão é definitiva. Os ingredientes do preset não são afetados.</p>
          {isConfirming ? (
            <div className={styles.confirm} role="group" aria-labelledby="delete-preset-confirmation">
              <p id="delete-preset-confirmation">Excluir o preset {preset.name} definitivamente?</p>
              <div className={styles.actions}>
                <button className={styles.button} onClick={() => setIsConfirming(false)} disabled={isDeleting}>
                  Cancelar
                </button>
                <button className={styles.buttonDanger} onClick={confirmDelete} disabled={isDeleting} autoFocus>
                  {isDeleting ? "Excluindo…" : "Excluir"}
                </button>
              </div>
            </div>
          ) : (
            <button className={styles.buttonDanger} onClick={() => setIsConfirming(true)}>
              Excluir…
            </button>
          )}
        </>
      )}
      {error && (
        <p className={styles.alert} role="alert">
          {error}
        </p>
      )}
    </section>
  );
}
