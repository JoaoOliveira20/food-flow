"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { ApiError, createBunVariant, updateBunVariant, type FieldErrors } from "@/api/admin/mutations";
import type { AdminBunVariant } from "@/api/admin/types";
import type { BuilderCatalog, BunImage, BunVariant } from "@/burger/catalog";
import { RecipePreview } from "@/components/burger-builder/RecipePreview";
import { FieldError } from "./FieldError";
import { ImagePicker } from "./ImagePicker";
import { ImageTips } from "./ImageTips";
import { readLocalImage, type LocalImage } from "./localImage";
import styles from "./admin.module.css";

const DRAFT_ID = "draft";
const ONLY_BUN = "";

type Position = "top" | "bottom";

const PROPORTIONS: Record<Position, { min: number; max: number; label: string }> = {
  top: { min: 1.4, max: 2.0, label: "topo (os atuais têm de 1,6:1 a 1,8:1)" },
  bottom: { min: 1.9, max: 2.8, label: "base (as atuais têm de 2,2:1 a 2,5:1)" },
};

type BunVariantFormProps = {
  builderId: number;
  catalog: BuilderCatalog;
  bunVariant: AdminBunVariant | null;
};

type LocalImages = Record<Position, { file: File; image: LocalImage } | null>;

function toBunImage(image: { url: string; width: number; height: number }): BunImage {
  return { imagePath: image.url, imageSize: { width: image.width, height: image.height } };
}

function proportionWarning(position: Position, image: { width: number; height: number } | null): string | null {
  if (!image) return null;
  const ratio = image.width / image.height;
  const { min, max, label } = PROPORTIONS[position];
  if (ratio >= min && ratio <= max) return null;
  return `A proporção desta imagem (${ratio.toFixed(1).replace(".", ",")}:1) é diferente da usada no ${label}; o pão pode ficar desencaixado.`;
}

export function BunVariantForm({ builderId, catalog, bunVariant }: BunVariantFormProps) {
  const router = useRouter();
  const isEditing = bunVariant !== null;
  const editedId = bunVariant ? String(bunVariant.id) : null;
  const otherBunVariants = catalog.bunVariants.filter((variant) => variant.id !== editedId);
  const [name, setName] = useState(bunVariant?.name ?? "");
  const [localImages, setLocalImages] = useState<LocalImages>({ top: null, bottom: null });
  const [fillPresetId, setFillPresetId] = useState(catalog.presets[0]?.id ?? ONLY_BUN);
  const [comparisonId, setComparisonId] = useState(otherBunVariants[0]?.id ?? "");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(
    () => () => {
      if (localImages.top) URL.revokeObjectURL(localImages.top.image.url);
      if (localImages.bottom) URL.revokeObjectURL(localImages.bottom.image.url);
    },
    [localImages],
  );

  async function selectImage(position: Position, file: File) {
    const field = position === "top" ? "topImage" : "bottomImage";
    setSavedMessage(null);
    setFieldErrors((errors) => Object.fromEntries(Object.entries(errors).filter(([key]) => key !== field)));
    try {
      const image = await readLocalImage(file);
      setLocalImages((current) => ({ ...current, [position]: { file, image } }));
    } catch {
      setFieldErrors((errors) => ({ ...errors, [field]: ["Não foi possível ler este arquivo como imagem."] }));
    }
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    const topImage = localImages.top?.file ?? null;
    const bottomImage = localImages.bottom?.file ?? null;
    if (!isEditing && (!topImage || !bottomImage)) {
      setFieldErrors({
        ...(topImage ? {} : { topImage: ["Escolha a imagem do topo do pão."] }),
        ...(bottomImage ? {} : { bottomImage: ["Escolha a imagem da base do pão."] }),
      });
      return;
    }

    setIsSaving(true);
    setFieldErrors({});
    setFormError(null);
    setSavedMessage(null);
    try {
      if (isEditing) {
        await updateBunVariant(bunVariant.id, { name }, { topImage, bottomImage });
        setLocalImages({ top: null, bottom: null });
        setSavedMessage("Alterações salvas.");
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

  return (
    <div className={styles.twoColumns}>
      <form className={`${styles.card} ${styles.form}`} onSubmit={submit} noValidate>
        <h2 className={styles.cardTitle}>Dados do tipo de pão</h2>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="bun-name">
            Nome
          </label>
          <input
            id="bun-name"
            className={`${styles.input} ${fieldErrors.name ? styles.inputInvalid : ""}`}
            value={name}
            maxLength={100}
            placeholder="Ex.: Australiano"
            aria-invalid={fieldErrors.name ? true : undefined}
            aria-describedby={fieldErrors.name ? "bun-name-error" : undefined}
            onChange={(event) => {
              setSavedMessage(null);
              setName(event.target.value);
            }}
          />
          <FieldError id="bun-name-error" messages={fieldErrors.name} />
        </div>
        <ImagePicker
          id="top-image"
          label="Imagem do topo"
          current={bunVariant?.topImage ?? null}
          selected={localImages.top?.image ?? null}
          errors={fieldErrors.topImage}
          onSelect={(file) => selectImage("top", file)}
        />
        <ImagePicker
          id="bottom-image"
          label="Imagem da base"
          current={bunVariant?.bottomImage ?? null}
          selected={localImages.bottom?.image ?? null}
          errors={fieldErrors.bottomImage}
          onSelect={(file) => selectImage("bottom", file)}
        />
        {warnings.map((warning) => (
          <p key={warning} className={styles.help}>
            ⚠ {warning}
          </p>
        ))}
        {formError && (
          <p className={styles.alert} role="alert">
            {formError}
          </p>
        )}
        {savedMessage && (
          <p className={styles.success} role="status">
            {savedMessage}
          </p>
        )}
        <div className={styles.actions}>
          <button type="submit" className={styles.buttonPrimary} disabled={isSaving}>
            {isSaving ? "Salvando…" : isEditing ? "Salvar alterações" : "Criar tipo de pão (oculto)"}
          </button>
        </div>
        {!isEditing && (
          <p className={styles.help}>
            O tipo de pão é criado oculto. Depois de salvar, confira o preview e publique para que ele apareça no montador.
          </p>
        )}
      </form>

      <div className={styles.form}>
        <section className={styles.card} aria-labelledby="bun-preview-title">
          <h2 id="bun-preview-title" className={styles.cardTitle}>
            Preview no montador
          </h2>
          <p className={styles.cardHint}>
            O pão é desenhado com as mesmas proporções fixas de topo e base do montador. Compare com um pão existente.
          </p>
          <div className={styles.comparison}>
            <figure className={styles.comparisonItem}>
              <div className={styles.previewStage}>
                {draft ? (
                  <RecipePreview catalog={previewCatalog} recipe={{ bunVariantId: DRAFT_ID, ingredientIds: filling }} className="" />
                ) : (
                  <p className={styles.help}>Escolha as duas imagens para ver o pão.</p>
                )}
              </div>
              <figcaption>{name || "Novo pão"}</figcaption>
            </figure>
            {comparisonId && (
              <figure className={styles.comparisonItem}>
                <div className={styles.previewStage}>
                  <RecipePreview catalog={previewCatalog} recipe={{ bunVariantId: comparisonId, ingredientIds: filling }} className="" />
                </div>
                <figcaption>Para comparar</figcaption>
              </figure>
            )}
          </div>
          <div className={`${styles.previewControls} ${styles.comparisonControls}`}>
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
          </div>
        </section>
        <ImageTips subject="bun" />
      </div>
    </div>
  );
}
