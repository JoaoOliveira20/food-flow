"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { ApiError, createPreset, updatePreset, type FieldErrors } from "@/api/admin/mutations";
import type { BuilderCatalog } from "@/burger/catalog";
import type { CompositionRecipe } from "@/burger/composition";
import { BurgerBuilder, type BuilderHeaderControls } from "@/components/burger-builder/BurgerBuilder";
import { FieldError } from "./FieldError";
import { Icon } from "./Icon";
import { useToast } from "./shell/Toaster";
import { presetStatus } from "./presetStatus";
import { PresetStatusPill, StatusPill, VisibilityPill } from "./StatusPill";
import { StudioBar } from "./StudioBar";
import { useUnsavedChangesWarning } from "./useUnsavedChangesWarning";
import { useVisibilityToggle } from "./useVisibilityToggle";
import styles from "./admin.module.css";

type SavedPreset = {
  id: number;
  name: string;
  recipe: CompositionRecipe;
  isVisible: boolean;
  isInitial: boolean;
  isAvailable: boolean;
};

type PresetEditorProps = {
  builderId: number;
  catalog: BuilderCatalog;
  hiddenIngredientIds: string[];
  hiddenBunVariantIds: string[];
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

export function PresetEditor({ builderId, catalog, hiddenIngredientIds, hiddenBunVariantIds, preset }: PresetEditorProps) {
  const savedRecipe = preset?.recipe ?? { bunVariantId: catalog.bunVariants[0].id, ingredientIds: [] };
  const savedName = preset?.name ?? "";
  const [name, setName] = useState(savedName);
  const [isDirty, setIsDirty] = useState(false);

  useUnsavedChangesWarning(isDirty);

  return (
    <div className={styles.studio}>
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
            hiddenBunVariantIds={hiddenBunVariantIds}
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
  hiddenBunVariantIds: string[];
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
  hiddenBunVariantIds,
  maxLayers,
  name,
  preset,
  savedName,
  savedRecipe,
  onNameChange,
  onDirtyChange,
}: PresetEditorBarProps) {
  const router = useRouter();
  const toast = useToast();
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const { recipe, reset } = controls;
  const isDirty = name !== savedName || !sameRecipe(recipe, savedRecipe);
  const hiddenCount = new Set(recipe.ingredientIds.filter((id) => hiddenIngredientIds.includes(id))).size;
  const isBunHidden = hiddenBunVariantIds.includes(recipe.bunVariantId);

  useEffect(() => onDirtyChange(isDirty), [isDirty, onDirtyChange]);

  const visibility = useVisibilityToggle({
    isVisible: preset?.isVisible ?? false,
    isDirty,
    itemName: savedName || "Preset",
    publishedDetail: preset?.isAvailable
      ? "Já aparece no painel de presets do montador."
      : "Ele só aparece no montador quando o pão e todos os ingredientes estiverem publicados.",
    onChange: (isVisible) => (preset ? updatePreset(preset.id, { isVisible }) : Promise.resolve()),
  });
  const canToggleVisibility = preset !== null && !preset.isInitial;

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
        toast({ tone: "success", title: "Preset salvo" });
        router.refresh();
      } else {
        const created = await createPreset(builderId, fields);
        onDirtyChange(false);
        router.push(`/admin/presets/${created.id}?created=1`);
        router.refresh();
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
    <StudioBar
      backHref="/admin/presets"
      nameLabel="Nome do preset"
      namePlaceholder="Nome do preset"
      name={name}
      nameErrors={fieldErrors.name}
      onNameChange={onNameChange}
      badges={
        <>
          {preset ? <PresetStatusPill status={presetStatus(preset)} /> : <VisibilityPill isVisible={false} />}
          <StatusPill tone="plain">
            {recipe.ingredientIds.length} de {maxLayers} camadas
          </StatusPill>
          {hiddenCount > 0 && (
            <StatusPill tone="warning">
              {hiddenCount === 1 ? "1 ingrediente oculto" : `${hiddenCount} ingredientes ocultos`} · fora do montador
            </StatusPill>
          )}
          {isBunHidden && <StatusPill tone="warning">Pão oculto · fora do montador</StatusPill>}
        </>
      }
      isNew={preset === null}
      isDirty={isDirty}
      isSaving={isSaving}
      createLabel="Criar preset"
      onUndo={restore}
      extraActions={canToggleVisibility && visibility.button}
      messages={
        <>
          <FieldError id="preset-recipe-error" messages={recipeErrors(fieldErrors)} />
          {formError && (
            <p className={styles.alert} role="alert">
              <Icon name="alert" />
              {formError}
            </p>
          )}
        </>
      }
      onSubmit={save}
    />
  );
}
