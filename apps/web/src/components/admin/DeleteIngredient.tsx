"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ApiError, deleteIngredient } from "@/api/admin/mutations";
import type { AdminIngredient, AdminPresetReference } from "@/api/admin/types";
import styles from "./admin.module.css";

type DeleteIngredientProps = {
  ingredient: AdminIngredient;
};

export function DeleteIngredient({ ingredient }: DeleteIngredientProps) {
  const router = useRouter();
  const [isConfirming, setIsConfirming] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [blockingPresets, setBlockingPresets] = useState<AdminPresetReference[]>([]);

  async function confirmDelete() {
    setIsDeleting(true);
    setError(null);
    try {
      await deleteIngredient(ingredient.id);
      router.push("/admin");
      router.refresh();
    } catch (caught) {
      setIsConfirming(false);
      if (caught instanceof ApiError) {
        setError(caught.message);
        setBlockingPresets(caught.presets);
      } else {
        setError("Não foi possível excluir o ingrediente.");
      }
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <section className={styles.card} aria-labelledby="delete-title">
      <h2 id="delete-title" className={styles.cardTitle}>
        Excluir ingrediente
      </h2>
      <p className={styles.cardHint}>
        A exclusão é definitiva e apaga a imagem. Para tirar o ingrediente do montador sem perdê-lo, prefira ocultar.
      </p>
      {isConfirming ? (
        <div className={styles.confirm} role="group" aria-labelledby="delete-confirmation">
          <p id="delete-confirmation">Excluir {ingredient.name} definitivamente?</p>
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
      {error && (
        <div className={styles.alert} role="alert">
          {error}
          {blockingPresets.length > 0 && (
            <ul>
              {blockingPresets.map((preset) => (
                <li key={preset.id}>
                  <Link href={`/admin/presets/${preset.id}`}>{preset.name}</Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}
