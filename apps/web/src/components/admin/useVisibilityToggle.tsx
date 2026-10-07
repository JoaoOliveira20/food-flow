"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ApiError } from "@/api/admin/mutations";
import type { AdminPresetReference } from "@/api/admin/types";
import { Icon } from "./Icon";
import { useToast } from "./shell/Toaster";
import styles from "./admin.module.css";

type VisibilityOptions = {
  isVisible: boolean;
  isDirty: boolean;
  itemName: string;
  presets?: AdminPresetReference[];
  hideWarning?: (presetNames: string) => string;
  publishedDetail?: string;
  onChange: (isVisible: boolean) => Promise<unknown>;
};

export function useVisibilityToggle({
  isVisible,
  isDirty,
  itemName,
  presets = [],
  hideWarning = () => "",
  publishedDetail = "Já aparece no montador.",
  onChange,
}: VisibilityOptions) {
  const router = useRouter();
  const toast = useToast();
  const [isConfirmingHide, setIsConfirmingHide] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  async function change(nextIsVisible: boolean) {
    setIsSaving(true);
    try {
      await onChange(nextIsVisible);
      setIsConfirmingHide(false);
      toast({
        tone: "success",
        title: nextIsVisible ? `${itemName} publicado` : `${itemName} ocultado`,
        detail: nextIsVisible ? publishedDetail : "Não aparece mais no montador.",
      });
      router.refresh();
    } catch (caught) {
      setIsConfirmingHide(false);
      toast({ tone: "error", title: caught instanceof ApiError ? caught.message : "Não foi possível alterar a visibilidade." });
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
      <Icon name="eyeOff" />
      Ocultar
    </button>
  ) : (
    <button type="button" className={styles.button} onClick={() => change(true)} disabled={isSaving || isDirty} title={blockedTitle}>
      <Icon name="eye" />
      Publicar
    </button>
  );

  const panel = isConfirmingHide ? (
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
  ) : null;

  return { button, panel };
}
