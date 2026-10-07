"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ApiError } from "@/api/admin/mutations";
import type { AdminPresetReference } from "@/api/admin/types";
import styles from "./admin.module.css";

type VisibilityCardProps = {
  isVisible: boolean;
  visibleHint: string;
  hiddenHint: string;
  presets: AdminPresetReference[];
  hideWarning: (presetNames: string) => string;
  onChange: (isVisible: boolean) => Promise<unknown>;
};

export function VisibilityCard({ isVisible, visibleHint, hiddenHint, presets, hideWarning, onChange }: VisibilityCardProps) {
  const router = useRouter();
  const [isConfirmingHide, setIsConfirmingHide] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function change(nextIsVisible: boolean) {
    setIsSaving(true);
    setError(null);
    try {
      await onChange(nextIsVisible);
      setIsConfirmingHide(false);
      router.refresh();
    } catch (caught) {
      setIsConfirmingHide(false);
      setError(caught instanceof ApiError ? caught.message : "Não foi possível alterar a visibilidade.");
    } finally {
      setIsSaving(false);
    }
  }

  function requestHide() {
    if (presets.length > 0) setIsConfirmingHide(true);
    else change(false);
  }

  return (
    <section className={styles.card} aria-labelledby="visibility-title">
      <div className={styles.cardHeader}>
        <h2 id="visibility-title" className={styles.cardTitle}>
          Visibilidade
        </h2>
        <span className={`${styles.badge} ${isVisible ? styles.badgeVisible : styles.badgeHidden}`}>
          {isVisible ? "Visível no montador" : "Oculto"}
        </span>
      </div>
      <p className={styles.cardHint}>{isVisible ? visibleHint : hiddenHint}</p>
      {isConfirmingHide ? (
        <div className={styles.confirm} role="group" aria-labelledby="hide-confirmation">
          <p id="hide-confirmation">{hideWarning(presets.map((preset) => preset.name).join(", "))}</p>
          <div className={styles.actions}>
            <button className={styles.button} onClick={() => setIsConfirmingHide(false)} disabled={isSaving}>
              Cancelar
            </button>
            <button className={styles.buttonDanger} onClick={() => change(false)} disabled={isSaving} autoFocus>
              Ocultar mesmo assim
            </button>
          </div>
        </div>
      ) : isVisible ? (
        <button className={styles.button} onClick={requestHide} disabled={isSaving}>
          Ocultar do montador
        </button>
      ) : (
        <button className={styles.buttonPrimary} onClick={() => change(true)} disabled={isSaving}>
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
