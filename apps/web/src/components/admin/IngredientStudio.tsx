"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { ApiError, createIngredient, updateIngredient, type FieldErrors } from "@/api/admin/mutations";
import type { AdminIngredient, AdminShape } from "@/api/admin/types";
import type { BuilderCatalog } from "@/burger/catalog";
import { RecipePreview } from "@/components/burger-builder/RecipePreview";
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
  const [showsIngredient, setShowsIngredient] = useState(true);
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

  async function selectFile(file: File) {
    setFieldErrors((errors) => Object.fromEntries(Object.entries(errors).filter(([field]) => field !== "image")));
    try {
      setLocalImage({ file, image: await readLocalImage(file) });
    } catch {
      setFieldErrors((errors) => ({ ...errors, image: ["Não foi possível ler este arquivo como imagem."] }));
    }
  }

  function undo() {
    setName(savedName);
    setShape(savedShape);
    setLocalImage(null);
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
  const basePreset = catalog.presets.find((preset) => preset.id === basePresetId);
  const baseIngredientIds = (basePreset?.ingredientIds ?? []).map((id) => (id === editedId ? DRAFT_ID : id));
  const hasDraft = draftImage !== null && showsIngredient;
  const ingredientIds = hasDraft
    ? baseIngredientIds.includes(DRAFT_ID)
      ? baseIngredientIds
      : [...baseIngredientIds, DRAFT_ID]
    : baseIngredientIds.filter((id) => id !== DRAFT_ID);
  const bunVariantId = basePreset?.bunVariantId ?? catalog.bunVariants[0]?.id;

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
          <div className={styles.stage}>
            {bunVariantId && <RecipePreview catalog={previewCatalog} recipe={{ bunVariantId, ingredientIds }} className="" />}
          </div>
          <p className={styles.stageCaption}>
            {!draftImage
              ? "Escolha uma imagem para ver o ingrediente no hambúrguer."
              : hasDraft
                ? "Mesmo cálculo de empilhamento do montador."
                : "Hambúrguer sem o ingrediente, para comparar."}
          </p>
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
                <select className={styles.select} value={basePresetId} onChange={(event) => setBasePresetId(event.target.value)}>
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
                  <button type="button" aria-pressed={!showsIngredient} onClick={() => setShowsIngredient(false)}>
                    Sem
                  </button>
                  <button type="button" aria-pressed={showsIngredient} onClick={() => setShowsIngredient(true)}>
                    Com
                  </button>
                </div>
              </div>
              <p className={styles.help}>
                {baseIngredientIds.includes(DRAFT_ID)
                  ? "Este hambúrguer já leva o ingrediente; ele aparece no lugar dele, com as suas alterações."
                  : "O ingrediente entra no topo, logo abaixo do pão, como ao adicionar no montador."}
              </p>
            </div>
          </section>
          <ImageTips />
        </div>
      </div>
    </div>
  );
}
