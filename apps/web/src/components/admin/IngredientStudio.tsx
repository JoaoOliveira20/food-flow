"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { ApiError, createIngredient, updateIngredient, type FieldErrors } from "@/api/admin/mutations";
import type { AdminIngredient, AdminShape } from "@/api/admin/types";
import type { BuilderCatalog } from "@/burger/catalog";
import { RecipePreview } from "@/components/burger-builder/RecipePreview";
import { ImagePicker } from "./ImagePicker";
import { ImageTips } from "./ImageTips";
import { readLocalImage, type LocalImage } from "./localImage";
import { ShapeField } from "./ShapeField";
import { StudioBar } from "./StudioBar";
import { useVisibilityToggle, visibilityBadge } from "./useVisibilityToggle";
import styles from "./admin.module.css";

const DEFAULT_SHAPE: AdminShape = { displayWidth: 290, restingSurfaceRatio: 0.4, sinkRatio: 0.2 };
const MAX_DISPLAY_WIDTH = 340;
const NONE = "";
const DRAFT_ID = "draft";

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

export function IngredientStudio({ builderId, catalog, ingredient }: IngredientStudioProps) {
  const router = useRouter();
  const isNew = ingredient === null;
  const savedName = ingredient?.name ?? "";
  const savedShape = ingredient?.shape ?? DEFAULT_SHAPE;
  const neighbors = catalog.ingredients.filter((item) => item.id !== String(ingredient?.id));

  const [name, setName] = useState(savedName);
  const [shape, setShape] = useState<AdminShape>(savedShape);
  const [localImage, setLocalImage] = useState<{ file: File; image: LocalImage } | null>(null);
  const [bunVariantId, setBunVariantId] = useState(catalog.bunVariants[0]?.id ?? NONE);
  const [belowId, setBelowId] = useState(neighbors[0]?.id ?? NONE);
  const [aboveId, setAboveId] = useState(neighbors[1]?.id ?? NONE);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const isDirty = name !== savedName || !sameShape(shape, savedShape) || localImage !== null;
  const visibility = useVisibilityToggle({
    isVisible: ingredient?.isVisible ?? false,
    isDirty,
    presets: ingredient?.presets ?? [],
    hideWarning: (names) =>
      `Ao ocultar, ${ingredient?.presets?.length === 1 ? "este preset fica indisponível" : "estes presets ficam indisponíveis"} no montador até o ingrediente voltar: ${names}.`,
    onChange: (isVisible) => (ingredient ? updateIngredient(ingredient.id, { isVisible }) : Promise.resolve()),
  });

  useEffect(() => () => {
    if (localImage) URL.revokeObjectURL(localImage.image.url);
  }, [localImage]);

  useEffect(() => {
    if (!isDirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [isDirty]);

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
        router.refresh();
      } else if (localImage) {
        const created = await createIngredient(builderId, fields, localImage.file);
        router.push(`/admin/ingredients/${created.id}?created=1`);
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
  const ingredientIds = [belowId, draftImage ? DRAFT_ID : NONE, aboveId].filter((id) => id !== NONE);
  const presetsCount = ingredient?.presets?.length ?? 0;

  return (
    <div className={styles.studio}>
      <StudioBar
        nameLabel="Nome do ingrediente"
        namePlaceholder="Ex.: Queijo prato"
        name={name}
        nameErrors={fieldErrors.name}
        onNameChange={setName}
        badges={
          <>
            {visibilityBadge(ingredient?.isVisible ?? false)}
            {!isNew && <span>{presetsCount === 1 ? "usado em 1 preset" : `usado em ${presetsCount} presets`}</span>}
          </>
        }
        isNew={isNew}
        isDirty={isDirty}
        isSaving={isSaving}
        createLabel="Criar ingrediente (oculto)"
        onUndo={undo}
        extraActions={!isNew && visibility.button}
        messages={
          <>
            {!isNew && visibility.panel}
            {formError && (
              <p className={styles.alert} role="alert">
                {formError}
              </p>
            )}
          </>
        }
        onSubmit={save}
      />

      <div className={styles.studioGrid}>
        <div className={styles.studioControls}>
          <section className={styles.card}>
            <h2 className={styles.sectionTitle}>Imagem</h2>
            <ImagePicker
              label="Arquivo"
              current={ingredient?.image ?? null}
              selected={localImage?.image ?? null}
              errors={fieldErrors.image}
              onSelect={selectFile}
            />
          </section>
          <section className={`${styles.card} ${styles.form}`}>
            <h2 className={styles.sectionTitle}>Encaixe na pilha</h2>
            <ShapeField
              id="display-width"
              label="Largura na pilha"
              help={`Largura quando a base do hambúrguer mede ${MAX_DISPLAY_WIDTH}. A carne usa 292; os molhos, 256.`}
              value={shape.displayWidth}
              min={1}
              max={MAX_DISPLAY_WIDTH}
              step={1}
              errors={fieldErrors.displayWidth}
              onChange={(value) => setShape((current) => ({ ...current, displayWidth: value }))}
            />
            <ShapeField
              id="resting-surface-ratio"
              label="Onde a camada de cima se apoia"
              help="Fração da altura da imagem, a partir de baixo, em que a próxima camada pousa. 0,5 = no meio."
              value={shape.restingSurfaceRatio}
              min={0}
              max={1}
              step={0.01}
              errors={fieldErrors.restingSurfaceRatio}
              onChange={(value) => setShape((current) => ({ ...current, restingSurfaceRatio: value }))}
            />
            <ShapeField
              id="sink-ratio"
              label="Quanto afunda na camada de baixo"
              help="Fração da própria altura sobreposta à camada de baixo. Molhos afundam bastante (0,78); a carne, pouco (0,1)."
              value={shape.sinkRatio}
              min={0}
              max={1}
              step={0.01}
              errors={fieldErrors.sinkRatio}
              onChange={(value) => setShape((current) => ({ ...current, sinkRatio: value }))}
            />
          </section>
        </div>

        <div className={styles.studioCenter}>
          <div className={styles.studioStage}>
            {bunVariantId && <RecipePreview catalog={previewCatalog} recipe={{ bunVariantId, ingredientIds }} className="" />}
          </div>
          <p className={styles.studioStageCaption}>
            {draftImage
              ? "Mesmo cálculo de empilhamento do montador. Ajuste o encaixe e veja na hora."
              : "Escolha uma imagem para ver o ingrediente na pilha."}
          </p>
        </div>

        <div className={styles.studioOptions}>
          <section className={`${styles.card} ${styles.form}`}>
            <h2 className={styles.sectionTitle}>Preview</h2>
            <label className={styles.field}>
              <span className={styles.label}>Camada acima</span>
              <select className={styles.select} value={aboveId} onChange={(event) => setAboveId(event.target.value)}>
                <option value={NONE}>Nenhuma (pão)</option>
                {neighbors.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
            <label className={styles.field}>
              <span className={styles.label}>Camada abaixo</span>
              <select className={styles.select} value={belowId} onChange={(event) => setBelowId(event.target.value)}>
                <option value={NONE}>Nenhuma (pão)</option>
                {neighbors.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
            <label className={styles.field}>
              <span className={styles.label}>Pão</span>
              <select className={styles.select} value={bunVariantId} onChange={(event) => setBunVariantId(event.target.value)}>
                {catalog.bunVariants.map((variant) => (
                  <option key={variant.id} value={variant.id}>
                    {variant.name}
                  </option>
                ))}
              </select>
            </label>
          </section>
          <ImageTips />
        </div>
      </div>
    </div>
  );
}
