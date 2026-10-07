"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { ApiError, createBunVariant, updateBunVariant, type FieldErrors } from "@/api/admin/mutations";
import type { AdminBunVariant, AdminImage } from "@/api/admin/types";
import type { BuilderCatalog, BunImage, BunVariant } from "@/burger/catalog";
import { RecipePreview } from "@/components/burger-builder/RecipePreview";
import { ImagePicker } from "./ImagePicker";
import { ImageTips } from "./ImageTips";
import { readLocalImage, type LocalImage } from "./localImage";
import { StudioBar } from "./StudioBar";
import { useVisibilityToggle, visibilityBadge } from "./useVisibilityToggle";
import styles from "./admin.module.css";

const DRAFT_ID = "draft";
const ONLY_BUN = "";

type Position = "top" | "bottom";

const PROPORTIONS: Record<Position, { min: number; max: number; label: string }> = {
  top: { min: 1.4, max: 2.0, label: "topo (os atuais têm de 1,6:1 a 1,8:1)" },
  bottom: { min: 1.9, max: 2.8, label: "base (as atuais têm de 2,2:1 a 2,5:1)" },
};

type BunVariantStudioProps = {
  builderId: number;
  catalog: BuilderCatalog;
  bunVariant: AdminBunVariant | null;
};

type LocalImages = Record<Position, { file: File; image: LocalImage } | null>;

function toBunImage(image: AdminImage | LocalImage): BunImage {
  return { imagePath: image.url, imageSize: { width: image.width, height: image.height } };
}

function proportionWarning(position: Position, image: AdminImage | LocalImage | null): string | null {
  if (!image) return null;
  const ratio = image.width / image.height;
  const { min, max, label } = PROPORTIONS[position];
  if (ratio >= min && ratio <= max) return null;
  return `A proporção desta imagem (${ratio.toFixed(1).replace(".", ",")}:1) é diferente da usada no ${label}; o pão pode ficar desencaixado.`;
}

export function BunVariantStudio({ builderId, catalog, bunVariant }: BunVariantStudioProps) {
  const router = useRouter();
  const isNew = bunVariant === null;
  const savedName = bunVariant?.name ?? "";
  const otherBunVariants = catalog.bunVariants.filter((variant) => variant.id !== String(bunVariant?.id));

  const [name, setName] = useState(savedName);
  const [localImages, setLocalImages] = useState<LocalImages>({ top: null, bottom: null });
  const [fillPresetId, setFillPresetId] = useState(catalog.presets[0]?.id ?? ONLY_BUN);
  const [comparisonId, setComparisonId] = useState(otherBunVariants[0]?.id ?? "");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const isDirty = name !== savedName || localImages.top !== null || localImages.bottom !== null;
  const visibility = useVisibilityToggle({
    isVisible: bunVariant?.isVisible ?? false,
    isDirty,
    presets: bunVariant?.presets ?? [],
    hideWarning: (names) =>
      `Ao ocultar, ${bunVariant?.presets?.length === 1 ? "este preset fica indisponível" : "estes presets ficam indisponíveis"} no montador até o pão voltar: ${names}.`,
    onChange: (isVisible) => (bunVariant ? updateBunVariant(bunVariant.id, { isVisible }) : Promise.resolve()),
  });

  useEffect(
    () => () => {
      if (localImages.top) URL.revokeObjectURL(localImages.top.image.url);
      if (localImages.bottom) URL.revokeObjectURL(localImages.bottom.image.url);
    },
    [localImages],
  );

  useEffect(() => {
    if (!isDirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [isDirty]);

  async function selectImage(position: Position, file: File) {
    const field = position === "top" ? "topImage" : "bottomImage";
    setFieldErrors((errors) => Object.fromEntries(Object.entries(errors).filter(([key]) => key !== field)));
    try {
      const image = await readLocalImage(file);
      setLocalImages((current) => ({ ...current, [position]: { file, image } }));
    } catch {
      setFieldErrors((errors) => ({ ...errors, [field]: ["Não foi possível ler este arquivo como imagem."] }));
    }
  }

  function undo() {
    setName(savedName);
    setLocalImages({ top: null, bottom: null });
    setFieldErrors({});
    setFormError(null);
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    const topImage = localImages.top?.file ?? null;
    const bottomImage = localImages.bottom?.file ?? null;
    if (isNew && (!topImage || !bottomImage)) {
      setFieldErrors({
        ...(topImage ? {} : { topImage: ["Escolha a imagem do topo do pão."] }),
        ...(bottomImage ? {} : { bottomImage: ["Escolha a imagem da base do pão."] }),
      });
      return;
    }

    setIsSaving(true);
    setFieldErrors({});
    setFormError(null);
    try {
      if (bunVariant) {
        await updateBunVariant(bunVariant.id, { name }, { topImage, bottomImage });
        router.refresh();
      } else if (topImage && bottomImage) {
        const created = await createBunVariant(builderId, { name }, { topImage, bottomImage });
        router.push(`/admin/bun-variants/${created.id}?created=1`);
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

  const topImage = localImages.top?.image ?? bunVariant?.topImage ?? null;
  const bottomImage = localImages.bottom?.image ?? bunVariant?.bottomImage ?? null;
  const draft: BunVariant | null =
    topImage && bottomImage
      ? { id: DRAFT_ID, name: name || "Novo pão", topBun: toBunImage(topImage), bottomBun: toBunImage(bottomImage) }
      : null;
  const previewCatalog: BuilderCatalog = { ...catalog, bunVariants: draft ? [...otherBunVariants, draft] : otherBunVariants };
  const filling = catalog.presets.find((preset) => preset.id === fillPresetId)?.ingredientIds ?? [];
  const warnings = [proportionWarning("top", topImage), proportionWarning("bottom", bottomImage)].filter(Boolean);
  const presetsCount = bunVariant?.presets?.length ?? 0;

  return (
    <div className={styles.studio}>
      <StudioBar
        nameLabel="Nome do tipo de pão"
        namePlaceholder="Ex.: Australiano"
        name={name}
        nameErrors={fieldErrors.name}
        onNameChange={setName}
        badges={
          <>
            {visibilityBadge(bunVariant?.isVisible ?? false)}
            {!isNew && <span>{presetsCount === 1 ? "usado em 1 preset" : `usado em ${presetsCount} presets`}</span>}
          </>
        }
        isNew={isNew}
        isDirty={isDirty}
        isSaving={isSaving}
        createLabel="Criar tipo de pão (oculto)"
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
            <h2 className={styles.sectionTitle}>Topo</h2>
            <ImagePicker
              id="top-image"
              label="Imagem do topo"
              current={bunVariant?.topImage ?? null}
              selected={localImages.top?.image ?? null}
              errors={fieldErrors.topImage}
              onSelect={(file) => selectImage("top", file)}
            />
          </section>
          <section className={styles.card}>
            <h2 className={styles.sectionTitle}>Base</h2>
            <ImagePicker
              id="bottom-image"
              label="Imagem da base"
              current={bunVariant?.bottomImage ?? null}
              selected={localImages.bottom?.image ?? null}
              errors={fieldErrors.bottomImage}
              onSelect={(file) => selectImage("bottom", file)}
            />
          </section>
          {warnings.map((warning) => (
            <p key={warning} className={styles.help}>
              ⚠ {warning}
            </p>
          ))}
        </div>

        <div className={styles.studioCenter}>
          <div className={styles.studioStage}>
            {draft ? (
              <RecipePreview catalog={previewCatalog} recipe={{ bunVariantId: DRAFT_ID, ingredientIds: filling }} className="" />
            ) : (
              <p className={styles.help}>Escolha as imagens do topo e da base para ver o pão.</p>
            )}
          </div>
          <p className={styles.studioStageCaption}>
            O pão é desenhado com as mesmas proporções fixas de topo e base do montador.
          </p>
        </div>

        <div className={styles.studioOptions}>
          <section className={`${styles.card} ${styles.form}`}>
            <h2 className={styles.sectionTitle}>Preview</h2>
            <label className={styles.field}>
              <span className={styles.label}>Recheio</span>
              <select className={styles.select} value={fillPresetId} onChange={(event) => setFillPresetId(event.target.value)}>
                <option value={ONLY_BUN}>Só o pão</option>
                {catalog.presets.map((preset) => (
                  <option key={preset.id} value={preset.id}>
                    {preset.name}
                  </option>
                ))}
              </select>
            </label>
            {comparisonId && (
              <>
                <label className={styles.field}>
                  <span className={styles.label}>Comparar com</span>
                  <select className={styles.select} value={comparisonId} onChange={(event) => setComparisonId(event.target.value)}>
                    {otherBunVariants.map((variant) => (
                      <option key={variant.id} value={variant.id}>
                        {variant.name}
                      </option>
                    ))}
                  </select>
                </label>
                <div className={styles.previewStage}>
                  <RecipePreview catalog={previewCatalog} recipe={{ bunVariantId: comparisonId, ingredientIds: filling }} className="" />
                </div>
              </>
            )}
          </section>
          <ImageTips subject="bun" />
        </div>
      </div>
    </div>
  );
}
