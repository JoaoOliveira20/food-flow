"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ApiError, updateIngredient } from "@/api/admin/mutations";
import type { AdminIngredient } from "@/api/admin/types";
import styles from "./admin.module.css";

type IngredientVisibilityProps = {
  ingredient: AdminIngredient;
};

export function IngredientVisibility({ ingredient }: IngredientVisibilityProps) {
  const router = useRouter();
  const [isConfirmingHide, setIsConfirmingHide] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const presets = ingredient.presets ?? [];

  async function setVisible(isVisible: boolean) {
    setIsSaving(true);
    setError(null);
    try {
      await updateIngredient(ingredient.id, { isVisible });
      setIsConfirmingHide(false);
      router.refresh();
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Não foi possível alterar a visibilidade.");
    } finally {
      setIsSaving(false);
    }
  }

  function requestHide() {
    if (presets.length > 0) setIsConfirmingHide(true);
    else setVisible(false);
  }

  return (
    <section className={styles.card} aria-labelledby="visibility-title">
      <div className={styles.cardHeader}>
        <h2 id="visibility-title" className={styles.cardTitle}>
          Visibilidade
        </h2>
        <span className={`${styles.badge} ${ingredient.isVisible ? styles.badgeVisible : styles.badgeHidden}`}>
          {ingredient.isVisible ? "Visível no montador" : "Oculto"}
        </span>
      </div>
      <p className={styles.cardHint}>
        {ingredient.isVisible
          ? "O ingrediente aparece para todos no montador público."
          : "Só o admin vê este ingrediente. Confira o preview e publique quando estiver pronto."}
      </p>
      {isConfirmingHide ? (
        <div className={styles.confirm} role="group" aria-labelledby="hide-confirmation">
          <p id="hide-confirmation">
            Ao ocultar, {presets.length === 1 ? "este preset fica indisponível" : "estes presets ficam indisponíveis"} no
            montador até o ingrediente voltar: {presets.map((preset) => preset.name).join(", ")}.
          </p>
          <div className={styles.actions}>
            <button className={styles.button} onClick={() => setIsConfirmingHide(false)} disabled={isSaving}>
              Cancelar
            </button>
            <button className={styles.buttonDanger} onClick={() => setVisible(false)} disabled={isSaving} autoFocus>
              Ocultar mesmo assim
            </button>
          </div>
        </div>
      ) : ingredient.isVisible ? (
        <button className={styles.button} onClick={requestHide} disabled={isSaving}>
          Ocultar do montador
        </button>
      ) : (
        <button className={styles.buttonPrimary} onClick={() => setVisible(true)} disabled={isSaving}>
          Publicar no montador
        </button>
      )}
      {error && (
        <p className={styles.alert} role="alert">
          {error}
        </p>
      )}
    </section>
  );
}
