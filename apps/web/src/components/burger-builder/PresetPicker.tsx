"use client";

import { useState } from "react";
import type { BuilderCatalog, CompositionPreset } from "@/burger/catalog";
import { useScrollIntoViewWhen } from "@/hooks/useScrollIntoViewWhen";
import { RecipePreview } from "./RecipePreview";
import styles from "./burgerBuilder.module.css";

type PresetPickerProps = {
  title?: string;
  catalog: BuilderCatalog;
  currentPresetId: string | null;
  requiresConfirmation: boolean;
  onApplyPreset: (preset: CompositionPreset) => void;
};

export function PresetPicker({
  title = "Presets",
  catalog,
  currentPresetId,
  requiresConfirmation,
  onApplyPreset,
}: PresetPickerProps) {
  const [presetAwaitingConfirmation, setPresetAwaitingConfirmation] = useState<CompositionPreset | null>(null);
  const confirmationRef = useScrollIntoViewWhen<HTMLDivElement>(presetAwaitingConfirmation !== null);

  function choosePreset(preset: CompositionPreset) {
    if (preset.id === currentPresetId) {
      setPresetAwaitingConfirmation(null);
      return;
    }
    if (requiresConfirmation) {
      setPresetAwaitingConfirmation(preset);
      return;
    }
    applyPreset(preset);
  }

  function applyPreset(preset: CompositionPreset) {
    setPresetAwaitingConfirmation(null);
    onApplyPreset(preset);
  }

  return (
    <section className={`${styles.panel} ${styles.presets}`} aria-labelledby="preset-picker-title">
      <h2 id="preset-picker-title" className={styles.panelTitle}>
        {title}
      </h2>
      {catalog.presets.length === 0 && <p className={styles.emptyHint}>Nenhum preset disponível no momento.</p>}
      <div className={styles.presetList}>
        {catalog.presets.map((preset) => {
          const isCurrent = preset.id === currentPresetId;
          const isAwaitingConfirmation = preset.id === presetAwaitingConfirmation?.id;
          return (
            <button
              key={preset.id}
              aria-current={isCurrent}
              className={`${styles.optionCard} ${isCurrent || isAwaitingConfirmation ? styles.optionCardSelected : ""}`}
              onClick={() => choosePreset(preset)}
            >
              <RecipePreview catalog={catalog} recipe={preset} className={styles.optionThumbnail} />
              {preset.name}
            </button>
          );
        })}
      </div>
      {presetAwaitingConfirmation && (
        <div
          ref={confirmationRef}
          className={styles.presetConfirmation}
          role="group"
          aria-labelledby="preset-confirmation-message"
          onKeyDown={(event) => event.key === "Escape" && setPresetAwaitingConfirmation(null)}
        >
          <p id="preset-confirmation-message">
            Trocar sua composição pelo preset {presetAwaitingConfirmation.name}? As alterações atuais serão perdidas.
          </p>
          <div className={styles.presetConfirmationActions}>
            <button onClick={() => setPresetAwaitingConfirmation(null)}>Cancelar</button>
            <button
              className={styles.presetConfirmButton}
              onClick={() => applyPreset(presetAwaitingConfirmation)}
              autoFocus
            >
              Trocar
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
