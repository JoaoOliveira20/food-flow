"use client";

import { useRouter } from "next/navigation";
import { useEffect, useReducer, useState, type FormEvent } from "react";
import { ApiError, createIngredient, updateIngredient, type FieldErrors } from "@/api/admin/mutations";
import type { AdminIngredient, AdminShape } from "@/api/admin/types";
import type { BuilderCatalog } from "@/burger/catalog";
import {
  compositionReducer,
  createCompositionFromRecipe,
  createInstanceId,
  createRecipeInstanceIds,
  type CompositionRecipe,
} from "@/burger/composition";
import { BurgerWorkbench } from "@/components/burger-builder/BurgerWorkbench";
import { useBurgerWorkbench } from "@/components/burger-builder/useBurgerWorkbench";
import { Icon } from "./Icon";
import { ImagePicker } from "./ImagePicker";
import { ImageTips } from "./ImageTips";
import { readLocalImage, type LocalImage } from "./localImage";
import { ShapeField } from "./ShapeField";
import { useToast } from "./shell/Toaster";
import { StatusPill, VisibilityPill } from "./StatusPill";
import { StudioBar } from "./StudioBar";
import { useUnsavedChangesWarning } from "./useUnsavedChangesWarning";
import { useVisibilityToggle } from "./useVisibilityToggle";
import styles from "./admin.module.css";

const DEFAULT_SHAPE: AdminShape = { displayWidth: 290, restingSurfaceRatio: 0.4, sinkRatio: 0.2 };
const MAX_DISPLAY_WIDTH = 340;
const DRAFT_ID = "draft";
const DEFAULT_PREVIEW_PRESET = "Clássico";

type IngredientStudioProps = {
  builderId: number;
  catalog: BuilderCatalog;
  ingredient: AdminIngredient | null;
};

function sameShape(first: AdminShape, second: AdminShape): boolean {
  return (
    first.displayWidth === second.displayWidth &&
    first.restingSurfaceRatio === second.restingSurfaceRatio &&
    first.sinkRatio === second.sinkRatio
  );
}

function previewRecipe(
  catalog: BuilderCatalog,
  presetId: string,
  editedId: string | null,
  includesDraft: boolean,
): CompositionRecipe {
  const preset = catalog.presets.find((item) => item.id === presetId);
  const ingredientIds = (preset?.ingredientIds ?? []).map((id) => (id === editedId ? DRAFT_ID : id));
  const withDraft = includesDraft && !ingredientIds.includes(DRAFT_ID) ? [...ingredientIds, DRAFT_ID] : ingredientIds;
  return {
    bunVariantId: preset?.bunVariantId ?? catalog.bunVariants[0].id,
    ingredientIds: includesDraft ? withDraft.slice(0, catalog.maxLayers) : withDraft.filter((id) => id !== DRAFT_ID),
  };
}

function compositionOf(recipe: CompositionRecipe, maxLayers: number) {
  return createCompositionFromRecipe(recipe, createRecipeInstanceIds(recipe), maxLayers);
}

function usageLabel(count: number): string {
  if (count === 0) return "Não usado em presets";
  return count === 1 ? "Em 1 preset" : `Em ${count} presets`;
}

export function IngredientStudio({ builderId, catalog, ingredient }: IngredientStudioProps) {
  const router = useRouter();
  const toast = useToast();
  const isNew = ingredient === null;
  const savedName = ingredient?.name ?? "";
  const savedShape = ingredient?.shape ?? DEFAULT_SHAPE;
  const editedId = ingredient ? String(ingredient.id) : null;
  const neighbors = catalog.ingredients.filter((item) => item.id !== editedId);

  const [name, setName] = useState(savedName);
  const [shape, setShape] = useState<AdminShape>(savedShape);
  const [localImage, setLocalImage] = useState<{ file: File; image: LocalImage } | null>(null);
  const [basePresetId, setBasePresetId] = useState(
    (catalog.presets.find((preset) => preset.name === DEFAULT_PREVIEW_PRESET) ?? catalog.presets[0])?.id ?? "",
  );
  const [composition, dispatch] = useReducer(compositionReducer, null, () =>
    compositionOf(previewRecipe(catalog, basePresetId, editedId, ingredient !== null), catalog.maxLayers),
  );
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const isDirty = name !== savedName || !sameShape(shape, savedShape) || localImage !== null;
  useUnsavedChangesWarning(isDirty);
  const visibility = useVisibilityToggle({
    isVisible: ingredient?.isVisible ?? false,
    isDirty,
    itemName: savedName || "Ingrediente",
    presets: ingredient?.presets ?? [],
    hideWarning: (names) =>
      `Ao ocultar, ${ingredient?.presets?.length === 1 ? "este preset sai" : "estes presets saem"} do montador até o ingrediente voltar: ${names}.`,
    onChange: (isVisible) => (ingredient ? updateIngredient(ingredient.id, { isVisible }) : Promise.resolve()),
  });

  useEffect(() => () => {
    if (localImage) URL.revokeObjectURL(localImage.image.url);
  }, [localImage]);

  function showRecipe(recipe: CompositionRecipe) {
    dispatch({ type: "applyRecipe", recipe, instanceIds: createRecipeInstanceIds(recipe) });
  }

  async function selectFile(file: File) {
    setFieldErrors((errors) => Object.fromEntries(Object.entries(errors).filter(([field]) => field !== "image")));
    try {
      const image = await readLocalImage(file);
      setLocalImage({ file, image });
      if (!localImage && !ingredient) showRecipe(previewRecipe(catalog, basePresetId, editedId, true));
    } catch {
      setFieldErrors((errors) => ({ ...errors, image: ["Não foi possível ler este arquivo como imagem."] }));
    }
  }

  function undo() {
    setName(savedName);
    setShape(savedShape);
    setLocalImage(null);
    if (isNew) showRecipe(previewRecipe(catalog, basePresetId, editedId, false));
    setFieldErrors({});
    setFormError(null);
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    if (isNew && !localImage) {
      setFieldErrors({ image: ["Escolha uma imagem para o ingrediente."] });
      return;
    }

    setIsSaving(true);
    setFieldErrors({});
    setFormError(null);
    try {
      const fields = { name, ...shape };
      if (ingredient) {
        await updateIngredient(ingredient.id, fields, localImage?.file ?? null);
        toast({ tone: "success", title: "Alterações salvas" });
        router.refresh();
      } else if (localImage) {
        const created = await createIngredient(builderId, fields, localImage.file);
        router.push(`/admin/ingredients/${created.id}?created=1`);
        router.refresh();
      }
    } catch (error) {
      if (error instanceof ApiError) {
        setFieldErrors(error.fieldErrors);
        setFormError(Object.keys(error.fieldErrors).length > 0 ? "Revise os campos destacados." : error.message);
      } else {
        setFormError("Não foi possível salvar. Tente de novo em instantes.");
      }
    } finally {
      setIsSaving(false);
    }
  }

  const draftImage = localImage?.image ?? ingredient?.image ?? null;
  const previewCatalog: BuilderCatalog = draftImage
    ? {
        ...catalog,
        ingredients: [
          ...neighbors,
          {
            id: DRAFT_ID,
            name: name || "Novo ingrediente",
            imagePath: draftImage.url,
            imageSize: { width: draftImage.width, height: draftImage.height },
            shape,
          },
        ],
      }
    : { ...catalog, ingredients: neighbors };
  const draftLayers = composition.layers.filter((layer) => layer.ingredientId === DRAFT_ID);
  const showsDraft = draftLayers.length > 0;
  const workbench = useBurgerWorkbench({ catalog: previewCatalog, composition, dispatch });

  function chooseBasePreset(presetId: string) {
    setBasePresetId(presetId);
    showRecipe(previewRecipe(catalog, presetId, editedId, draftImage !== null));
  }

  function setShowsDraft(nextShowsDraft: boolean) {
    if (nextShowsDraft) dispatch({ type: "addIngredient", ingredientId: DRAFT_ID, instanceId: createInstanceId() });
    else draftLayers.forEach((layer) => dispatch({ type: "removeLayer", instanceId: layer.instanceId }));
  }

  return (
    <div className={styles.studio}>
      <StudioBar
        backHref="/admin/ingredients"
        nameLabel="Nome do ingrediente"
        namePlaceholder="Nome do ingrediente"
        name={name}
        nameErrors={fieldErrors.name}
        onNameChange={setName}
        badges={
          <>
            <VisibilityPill isVisible={ingredient?.isVisible ?? false} />
            {!isNew && <StatusPill tone="plain">{usageLabel(ingredient.presets?.length ?? 0)}</StatusPill>}
          </>
        }
        isNew={isNew}
        isDirty={isDirty}
        isSaving={isSaving}
        createLabel="Criar ingrediente"
        onUndo={undo}
        extraActions={!isNew && visibility.button}
        messages={
          <>
            {!isNew && visibility.panel}
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

      <div className={styles.studioGrid}>
        <div className={styles.studioControls}>
          <section className={styles.panel}>
            <div className={styles.panelHeader}>
              <div>
                <h2 className={styles.panelTitle}>Imagem</h2>
                <p className={styles.panelHint}>PNG ou WebP com fundo transparente.</p>
              </div>
            </div>
            <div className={styles.panelBody}>
              <ImagePicker
                label="Imagem do ingrediente"
                current={ingredient?.image ?? null}
                selected={localImage?.image ?? null}
                errors={fieldErrors.image}
                onSelect={selectFile}
              />
            </div>
          </section>
          <section className={styles.panel}>
            <div className={styles.panelHeader}>
              <div>
                <h2 className={styles.panelTitle}>Encaixe na pilha</h2>
                <p className={styles.panelHint}>Como a camada se apoia nas vizinhas.</p>
              </div>
            </div>
            <div className={styles.panelBody}>
              <ShapeField
                id="display-width"
                label="Largura na pilha"
                help={`Largura quando a base mede ${MAX_DISPLAY_WIDTH}. A carne usa 292; os molhos, 256.`}
                value={shape.displayWidth}
                min={1}
                max={MAX_DISPLAY_WIDTH}
                step={1}
                errors={fieldErrors.displayWidth}
                onChange={(value) => setShape((current) => ({ ...current, displayWidth: value }))}
              />
              <ShapeField
                id="resting-surface-ratio"
                label="Apoio da camada de cima"
                help="Altura da imagem, a partir de baixo, em que a próxima camada pousa. 0,5 = no meio."
                value={shape.restingSurfaceRatio}
                min={0}
                max={1}
                step={0.01}
                errors={fieldErrors.restingSurfaceRatio}
                onChange={(value) => setShape((current) => ({ ...current, restingSurfaceRatio: value }))}
              />
              <ShapeField
                id="sink-ratio"
                label="Afundamento"
                help="Quanto da própria altura fica sobre a camada de baixo. Molhos: 0,78; carne: 0,1."
                value={shape.sinkRatio}
                min={0}
                max={1}
                step={0.01}
                errors={fieldErrors.sinkRatio}
                onChange={(value) => setShape((current) => ({ ...current, sinkRatio: value }))}
              />
            </div>
          </section>
        </div>

        <div className={styles.studioCenter}>
          <BurgerWorkbench
            workbench={workbench}
            catalog={previewCatalog}
            composition={composition}
            dispatch={dispatch}
            canReplace={false}
            stageClassName={styles.workbenchStage}
            hint={
              !draftImage
                ? "Escolha uma imagem para ver o ingrediente no hambúrguer."
                : showsDraft
                  ? "Arraste o ingrediente para testar outra posição. É só o preview: nada aqui muda os presets."
                  : "Hambúrguer sem o ingrediente, para comparar."
            }
          />
        </div>

        <div className={styles.studioOptions}>
          <section className={styles.panel}>
            <div className={styles.panelHeader}>
              <div>
                <h2 className={styles.panelTitle}>Preview</h2>
                <p className={styles.panelHint}>Veja o ingrediente num hambúrguer pronto.</p>
              </div>
            </div>
            <div className={styles.panelBody}>
              <label className={styles.field}>
                <span className={styles.label}>Hambúrguer de base</span>
                <select className={styles.select} value={basePresetId} onChange={(event) => chooseBasePreset(event.target.value)}>
                  {catalog.presets.map((preset) => (
                    <option key={preset.id} value={preset.id}>
                      {preset.name}
                    </option>
                  ))}
                </select>
              </label>
              <div className={styles.field}>
                <span className={styles.label} id="shows-ingredient-label">
                  Ingrediente no hambúrguer
                </span>
                <div className={styles.segmented} role="group" aria-labelledby="shows-ingredient-label">
                  <button type="button" aria-pressed={!showsDraft} onClick={() => setShowsDraft(false)} disabled={!showsDraft}>
                    Sem
                  </button>
                  <button
                    type="button"
                    aria-pressed={showsDraft}
                    onClick={() => setShowsDraft(true)}
                    disabled={showsDraft || !draftImage}
                  >
                    Com
                  </button>
                </div>
              </div>
              <p className={styles.help}>
                Toque numa camada para subir, descer, duplicar ou remover, ou arraste para outra posição. Trocar o
                hambúrguer de base recomeça o preview.
              </p>
            </div>
          </section>
          <ImageTips />
        </div>
      </div>
    </div>
  );
}
