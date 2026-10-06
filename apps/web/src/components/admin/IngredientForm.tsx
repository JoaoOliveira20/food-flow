"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import {
  ApiError,
  createIngredient,
  updateIngredient,
  type FieldErrors,
  type IngredientFields,
} from "@/api/admin/mutations";
import type { AdminIngredient, AdminShape } from "@/api/admin/types";
import type { BuilderCatalog } from "@/burger/catalog";
import { FieldError } from "./FieldError";
import { ImagePicker } from "./ImagePicker";
import { ImageTips } from "./ImageTips";
import { IngredientPreview } from "./IngredientPreview";
import { readLocalImage, type LocalImage } from "./localImage";
import { ShapeField } from "./ShapeField";
import styles from "./admin.module.css";

const DEFAULT_SHAPE: AdminShape = { displayWidth: 290, restingSurfaceRatio: 0.4, sinkRatio: 0.2 };
const MAX_DISPLAY_WIDTH = 340;

type IngredientFormProps = {
  builderId: number;
  catalog: BuilderCatalog | null;
  ingredient: AdminIngredient | null;
};

export function IngredientForm({ builderId, catalog, ingredient }: IngredientFormProps) {
  const router = useRouter();
  const isEditing = ingredient !== null;
  const [name, setName] = useState(ingredient?.name ?? "");
  const [shape, setShape] = useState<AdminShape>(ingredient?.shape ?? DEFAULT_SHAPE);
  const [file, setFile] = useState<File | null>(null);
  const [localImage, setLocalImage] = useState<LocalImage | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => () => {
    if (localImage) URL.revokeObjectURL(localImage.url);
  }, [localImage]);

  async function selectFile(selected: File) {
    setSavedMessage(null);
    setFieldErrors((errors) => Object.fromEntries(Object.entries(errors).filter(([field]) => field !== "image")));
    try {
      setLocalImage(await readLocalImage(selected));
      setFile(selected);
    } catch {
      setLocalImage(null);
      setFile(null);
      setFieldErrors((errors) => ({ ...errors, image: ["Não foi possível ler este arquivo como imagem."] }));
    }
  }

  function changeShape(key: keyof AdminShape, value: number) {
    setSavedMessage(null);
    setShape((current) => ({ ...current, [key]: value }));
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!isEditing && !file) {
      setFieldErrors({ image: ["Escolha uma imagem para o ingrediente."] });
      return;
    }

    const fields: IngredientFields = { name, ...shape };
    setIsSaving(true);
    setFieldErrors({});
    setFormError(null);
    setSavedMessage(null);
    try {
      if (isEditing) {
        await updateIngredient(ingredient.id, fields, file);
        setFile(null);
        setLocalImage(null);
        setSavedMessage("Alterações salvas.");
        router.refresh();
      } else {
        const created = await createIngredient(builderId, fields, file as File);
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

  const draftImage = localImage ?? ingredient?.image ?? null;
  const draft = draftImage
    ? {
        name: name || "Novo ingrediente",
        imagePath: draftImage.url,
        imageSize: { width: draftImage.width, height: draftImage.height },
        shape,
      }
    : null;

  return (
    <div className={styles.twoColumns}>
      <form className={`${styles.card} ${styles.form}`} onSubmit={submit} noValidate>
        <h2 className={styles.cardTitle}>Dados do ingrediente</h2>
        <ImagePicker current={ingredient?.image ?? null} selected={localImage} errors={fieldErrors.image} onSelect={selectFile} />

        <div className={styles.field}>
          <label className={styles.label} htmlFor="ingredient-name">
            Nome
          </label>
          <input
            id="ingredient-name"
            className={`${styles.input} ${fieldErrors.name ? styles.inputInvalid : ""}`}
            value={name}
            maxLength={100}
            aria-invalid={fieldErrors.name ? true : undefined}
            aria-describedby={fieldErrors.name ? "ingredient-name-error" : undefined}
            onChange={(event) => {
              setSavedMessage(null);
              setName(event.target.value);
            }}
          />
          <FieldError id="ingredient-name-error" messages={fieldErrors.name} />
        </div>

        <ShapeField
          id="display-width"
          label="Largura na pilha"
          help={`Largura do ingrediente quando a base do hambúrguer mede ${MAX_DISPLAY_WIDTH}. A carne usa 292; os molhos, 256.`}
          value={shape.displayWidth}
          min={1}
          max={MAX_DISPLAY_WIDTH}
          step={1}
          errors={fieldErrors.displayWidth}
          onChange={(value) => changeShape("displayWidth", value)}
        />
        <ShapeField
          id="resting-surface-ratio"
          label="Onde a camada de cima se apoia"
          help="Fração da altura da imagem, a partir de baixo, em que a próxima camada pousa. 0,5 = no meio da imagem."
          value={shape.restingSurfaceRatio}
          min={0}
          max={1}
          step={0.01}
          errors={fieldErrors.restingSurfaceRatio}
          onChange={(value) => changeShape("restingSurfaceRatio", value)}
        />
        <ShapeField
          id="sink-ratio"
          label="Quanto afunda na camada de baixo"
          help="Fração da própria altura que fica sobreposta à camada de baixo. Molhos afundam bastante (0,78); a carne, pouco (0,1)."
          value={shape.sinkRatio}
          min={0}
          max={1}
          step={0.01}
          errors={fieldErrors.sinkRatio}
          onChange={(value) => changeShape("sinkRatio", value)}
        />

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
            {isSaving ? "Salvando…" : isEditing ? "Salvar alterações" : "Criar ingrediente (oculto)"}
          </button>
        </div>
        {!isEditing && (
          <p className={styles.help}>
            O ingrediente é criado oculto. Depois de salvar, confira o preview e publique para que ele apareça no montador.
          </p>
        )}
      </form>

      <div className={styles.form}>
        <section className={styles.card} aria-labelledby="preview-title">
          <h2 id="preview-title" className={styles.cardTitle}>
            Preview no montador
          </h2>
          <p className={styles.cardHint}>
            Mesmo cálculo de empilhamento do montador. Ajuste as medidas e veja o encaixe antes de salvar.
          </p>
          {catalog ? (
            <IngredientPreview catalog={catalog} draft={draft} editedIngredientId={ingredient ? String(ingredient.id) : null} />
          ) : (
            <p className={styles.empty}>Cadastre um tipo de pão para ver o preview.</p>
          )}
        </section>
        <ImageTips />
      </div>
    </div>
  );
}
