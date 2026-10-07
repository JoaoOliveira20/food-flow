"use client";

import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { ApiError } from "@/api/admin/mutations";
import type { AdminPresetReference } from "@/api/admin/types";
import styles from "./admin.module.css";

type VisibilityOptions = {
  isVisible: boolean;
  isDirty: boolean;
  presets: AdminPresetReference[];
  hideWarning: (presetNames: string) => string;
  onChange: (isVisible: boolean) => Promise<unknown>;
};

export function visibilityBadge(isVisible: boolean): ReactNode {
  return (
    <span className={`${styles.badge} ${isVisible ? styles.badgeVisible : styles.badgeHidden}`}>
      {isVisible ? "Visível no montador" : "Oculto"}
    </span>
  );
}

export function useVisibilityToggle({ isVisible, isDirty, presets, hideWarning, onChange }: VisibilityOptions) {
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

  const blockedTitle = isDirty ? "Salve as alterações antes de publicar ou ocultar" : undefined;
  const button = isVisible ? (
    <button type="button" className={styles.button} onClick={requestHide} disabled={isSaving || isDirty} title={blockedTitle}>
      Ocultar
    </button>
  ) : (
    <button
      type="button"
      className={styles.buttonPrimary}
      onClick={() => change(true)}
      disabled={isSaving || isDirty}
      title={blockedTitle}
    >
      Publicar
    </button>
  );

  const panel = (
    <>
      {isConfirmingHide && (
        <div className={styles.confirm} role="group" aria-labelledby="hide-confirmation">
          <p id="hide-confirmation">{hideWarning(presets.map((preset) => preset.name).join(", "))}</p>
          <div className={styles.actions}>
            <button type="button" className={styles.button} onClick={() => setIsConfirmingHide(false)} disabled={isSaving}>
              Cancelar
            </button>
            <button type="button" className={styles.buttonDanger} onClick={() => change(false)} disabled={isSaving} autoFocus>
              Ocultar mesmo assim
            </button>
          </div>
        </div>
      )}
      {error && (
        <p className={styles.alert} role="alert">
          {error}
        </p>
      )}
    </>
  );

  return { button, panel };
}
