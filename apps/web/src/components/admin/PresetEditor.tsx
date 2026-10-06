"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { ApiError, createPreset, updatePreset, type FieldErrors } from "@/api/admin/mutations";
import type { BuilderCatalog } from "@/burger/catalog";
import type { CompositionRecipe } from "@/burger/composition";
import { BurgerBuilder, type BuilderHeaderControls } from "@/components/burger-builder/BurgerBuilder";
import { FieldError } from "./FieldError";
import styles from "./admin.module.css";

type SavedPreset = {
  id: number;
  name: string;
  recipe: CompositionRecipe;
};

type PresetEditorProps = {
  builderId: number;
  catalog: BuilderCatalog;
  hiddenIngredientIds: string[];
  preset: SavedPreset | null;
};

function sameRecipe(first: CompositionRecipe, second: CompositionRecipe): boolean {
  return (
    first.bunVariantId === second.bunVariantId &&
    first.ingredientIds.length === second.ingredientIds.length &&
    first.ingredientIds.every((ingredientId, index) => ingredientId === second.ingredientIds[index])
  );
}

function recipeErrors(fieldErrors: FieldErrors): string[] | undefined {
  const messages = Object.entries(fieldErrors)
    .filter(([field]) => field === "bunVariantId" || field.startsWith("ingredientIds"))
    .flatMap(([, fieldMessages]) => fieldMessages);
  return messages.length > 0 ? [...new Set(messages)] : undefined;
}

export function PresetEditor({ builderId, catalog, hiddenIngredientIds, preset }: PresetEditorProps) {
  const savedRecipe = preset?.recipe ?? { bunVariantId: catalog.bunVariants[0].id, ingredientIds: [] };
  const savedName = preset?.name ?? "";
  const [name, setName] = useState(savedName);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (!isDirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [isDirty]);

  return (
    <div className={styles.builderEditor}>
      <BurgerBuilder
        catalog={catalog}
        initialRecipe={savedRecipe}
        isEmbedded
        presetsTitle="Começar a partir de"
        renderHeader={(controls) => (
          <PresetEditorBar
            builderId={builderId}
            controls={controls}
            hiddenIngredientIds={hiddenIngredientIds}
            maxLayers={catalog.maxLayers}
            name={name}
            preset={preset}
            savedName={savedName}
            savedRecipe={savedRecipe}
            onNameChange={setName}
            onDirtyChange={setIsDirty}
          />
        )}
      />
    </div>
  );
}

type PresetEditorBarProps = {
  builderId: number;
  controls: BuilderHeaderControls;
  hiddenIngredientIds: string[];
  maxLayers: number;
  name: string;
  preset: SavedPreset | null;
  savedName: string;
  savedRecipe: CompositionRecipe;
  onNameChange: (name: string) => void;
  onDirtyChange: (isDirty: boolean) => void;
};

function PresetEditorBar({
  builderId,
  controls,
  hiddenIngredientIds,
  maxLayers,
  name,
  preset,
  savedName,
  savedRecipe,
  onNameChange,
  onDirtyChange,
}: PresetEditorBarProps) {
  const router = useRouter();
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const { recipe, reset } = controls;
  const isDirty = name !== savedName || !sameRecipe(recipe, savedRecipe);
  const hiddenCount = new Set(recipe.ingredientIds.filter((id) => hiddenIngredientIds.includes(id))).size;

  useEffect(() => onDirtyChange(isDirty), [isDirty, onDirtyChange]);

  async function save(event: FormEvent) {
    event.preventDefault();
    const fields = {
      name,
      bunVariantId: Number(recipe.bunVariantId),
      ingredientIds: recipe.ingredientIds.map(Number),
    };
    setIsSaving(true);
    setFieldErrors({});
    setFormError(null);
    try {
      if (preset) {
        await updatePreset(preset.id, fields);
        onDirtyChange(false);
        router.refresh();
      } else {
        const created = await createPreset(builderId, fields);
        onDirtyChange(false);
        router.push(`/admin/presets/${created.id}?created=1`);
      }
    } catch (error) {
      if (error instanceof ApiError) {
        setFieldErrors(error.fieldErrors);
        setFormError(Object.keys(error.fieldErrors).length > 0 ? null : error.message);
      } else {
        setFormError("Não foi possível salvar. Tente de novo em instantes.");
      }
    } finally {
      setIsSaving(false);
    }
  }

  function restore() {
    reset();
    onNameChange(savedName);
    setFieldErrors({});
    setFormError(null);
  }

  return (
    <form className={styles.editorBar} onSubmit={save} noValidate>
      <div className={styles.editorName}>
        <label className={styles.label} htmlFor="preset-name">
          Nome do preset
        </label>
        <input
          id="preset-name"
          className={`${styles.input} ${fieldErrors.name ? styles.inputInvalid : ""}`}
          value={name}
          maxLength={100}
          placeholder="Ex.: Cheeseburger"
          aria-invalid={fieldErrors.name ? true : undefined}
          aria-describedby={fieldErrors.name ? "preset-name-error" : undefined}
          onChange={(event) => onNameChange(event.target.value)}
        />
        <FieldError id="preset-name-error" messages={fieldErrors.name} />
      </div>

      <div className={styles.editorStatus} aria-live="polite">
        <span>
          {recipe.ingredientIds.length} de {maxLayers} ingredientes
        </span>
        {hiddenCount > 0 && (
          <span className={`${styles.badge} ${styles.badgeWarning}`}>
            {hiddenCount === 1 ? "1 ingrediente oculto" : `${hiddenCount} ingredientes ocultos`}: o preset fica indisponível no
            montador até a publicação
          </span>
        )}
        {isDirty ? (
          <span className={`${styles.badge} ${styles.badgeWarning}`}>Alterações não salvas</span>
        ) : (
          preset && <span className={`${styles.badge} ${styles.badgeVisible}`}>Salvo</span>
        )}
      </div>

      <div className={styles.editorActions}>
        <Link href="/admin" className={styles.button}>
          Voltar
        </Link>
        <button type="button" className={styles.button} onClick={restore} disabled={!isDirty || isSaving}>
          {preset ? "Desfazer alterações" : "Limpar"}
        </button>
        <button type="submit" className={styles.buttonPrimary} disabled={isSaving || (preset !== null && !isDirty)}>
          {isSaving ? "Salvando…" : preset ? "Salvar preset" : "Criar preset"}
        </button>
      </div>

      <FieldError id="preset-recipe-error" messages={recipeErrors(fieldErrors)} />
      {formError && (
        <p className={styles.alert} role="alert">
          {formError}
        </p>
      )}
    </form>
  );
}
