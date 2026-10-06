"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { ApiError, createPreset, updatePreset, type FieldErrors } from "@/api/admin/mutations";
import type { AdminIngredient, AdminPreset } from "@/api/admin/types";
import type { BuilderCatalog } from "@/burger/catalog";
import { RecipePreview } from "@/components/burger-builder/RecipePreview";
import { FieldError } from "./FieldError";
import styles from "./admin.module.css";

type RecipeItem = {
  key: string;
  ingredientId: number;
};

let addedItemCounter = 0;

function createAddedItem(ingredientId: number): RecipeItem {
  addedItemCounter += 1;
  return { key: `added-${addedItemCounter}`, ingredientId };
}

type PresetFormProps = {
  builderId: number;
  maxLayers: number;
  catalog: BuilderCatalog;
  ingredients: AdminIngredient[];
  preset: AdminPreset | null;
};

function itemErrors(fieldErrors: FieldErrors): string[] | undefined {
  const messages = Object.entries(fieldErrors)
    .filter(([field]) => field.startsWith("ingredientIds."))
    .flatMap(([, fieldMessages]) => fieldMessages);
  return messages.length > 0 ? [...new Set(messages)] : undefined;
}

export function PresetForm({ builderId, maxLayers, catalog, ingredients, preset }: PresetFormProps) {
  const router = useRouter();
  const isEditing = preset !== null;
  const [name, setName] = useState(preset?.name ?? "");
  const [bunVariantId, setBunVariantId] = useState(String(preset?.bunVariantId ?? catalog.bunVariants[0]?.id ?? ""));
  const [items, setItems] = useState<RecipeItem[]>(() =>
    (preset?.ingredientIds ?? []).map((ingredientId, index) => ({ key: `initial-${index}`, ingredientId })),
  );
  const [ingredientToAdd, setIngredientToAdd] = useState(String(ingredients[0]?.id ?? ""));
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const ingredientsById = new Map(ingredients.map((ingredient) => [ingredient.id, ingredient]));
  const isFull = items.length >= maxLayers;
  const hiddenNames = [
    ...new Set(
      items.flatMap((item) => {
        const ingredient = ingredientsById.get(item.ingredientId);
        return ingredient && !ingredient.isVisible ? [ingredient.name] : [];
      }),
    ),
  ];

  function change(update: () => void) {
    setSavedMessage(null);
    update();
  }

  function addIngredient() {
    const ingredientId = Number(ingredientToAdd);
    if (!ingredientId || isFull) return;
    const item = createAddedItem(ingredientId);
    change(() => setItems((current) => [...current, item]));
  }

  function moveItem(index: number, offset: 1 | -1) {
    change(() =>
      setItems((current) => {
        const target = index + offset;
        if (target < 0 || target >= current.length) return current;
        const reordered = [...current];
        [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
        return reordered;
      }),
    );
  }

  function removeItem(key: string) {
    change(() => setItems((current) => current.filter((item) => item.key !== key)));
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    const fields = { name, bunVariantId: Number(bunVariantId), ingredientIds: items.map((item) => item.ingredientId) };
    setIsSaving(true);
    setFieldErrors({});
    setFormError(null);
    setSavedMessage(null);
    try {
      if (isEditing) {
        await updatePreset(preset.id, fields);
        setSavedMessage("Preset salvo.");
        router.refresh();
      } else {
        const created = await createPreset(builderId, fields);
        router.push(`/admin/presets/${created.id}?created=1`);
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

  const recipe = { bunVariantId, ingredientIds: items.map((item) => String(item.ingredientId)) };
  const listErrors = fieldErrors.ingredientIds ?? itemErrors(fieldErrors);

  return (
    <div className={styles.twoColumns}>
      <form className={`${styles.card} ${styles.form}`} onSubmit={submit} noValidate>
        <h2 className={styles.cardTitle}>Dados do preset</h2>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="preset-name">
            Nome
          </label>
          <input
            id="preset-name"
            className={`${styles.input} ${fieldErrors.name ? styles.inputInvalid : ""}`}
            value={name}
            maxLength={100}
            aria-invalid={fieldErrors.name ? true : undefined}
            aria-describedby={fieldErrors.name ? "preset-name-error" : undefined}
            onChange={(event) => change(() => setName(event.target.value))}
          />
          <FieldError id="preset-name-error" messages={fieldErrors.name} />
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="preset-bun">
            Tipo de pão
          </label>
          <select
            id="preset-bun"
            className={styles.select}
            value={bunVariantId}
            aria-invalid={fieldErrors.bunVariantId ? true : undefined}
            onChange={(event) => change(() => setBunVariantId(event.target.value))}
          >
            {catalog.bunVariants.map((variant) => (
              <option key={variant.id} value={variant.id}>
                {variant.name}
              </option>
            ))}
          </select>
          <FieldError id="preset-bun-error" messages={fieldErrors.bunVariantId} />
        </div>

        <div className={styles.field}>
          <span className={styles.label} id="recipe-label">
            Ingredientes ({items.length} de {maxLayers})
          </span>
          <p className={styles.help}>Da mesma forma que no montador: o novo ingrediente entra no topo, logo abaixo do pão.</p>
          <div className={styles.bunEdge}>Pão superior</div>
          {items.length === 0 ? (
            <p className={styles.empty}>Nenhum ingrediente ainda.</p>
          ) : (
            <ol className={styles.recipeList} aria-labelledby="recipe-label">
              {items.map((item, index) => {
                const ingredient = ingredientsById.get(item.ingredientId);
                const label = ingredient?.name ?? `Ingrediente ${item.ingredientId}`;
                return (
                  <li key={item.key} className={styles.recipeItem}>
                    <span className={styles.recipePosition}>{index + 1}</span>
                    <span className={styles.thumbnail}>
                      {ingredient && (
                        <Image
                          src={ingredient.image.url}
                          alt=""
                          width={ingredient.image.width}
                          height={ingredient.image.height}
                          unoptimized
                        />
                      )}
                    </span>
                    <span>
                      {label}
                      {ingredient && !ingredient.isVisible && (
                        <span className={`${styles.badge} ${styles.badgeHidden}`}> oculto</span>
                      )}
                    </span>
                    <span className={styles.actions}>
                      <button
                        type="button"
                        className={styles.iconButton}
                        onClick={() => moveItem(index, 1)}
                        disabled={index === items.length - 1}
                        aria-label={`Subir ${label}`}
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        className={styles.iconButton}
                        onClick={() => moveItem(index, -1)}
                        disabled={index === 0}
                        aria-label={`Descer ${label}`}
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        className={styles.iconButton}
                        onClick={() => removeItem(item.key)}
                        aria-label={`Remover ${label}`}
                      >
                        ×
                      </button>
                    </span>
                  </li>
                );
              })}
            </ol>
          )}
          <div className={styles.bunEdge}>Pão inferior</div>
          <FieldError id="recipe-error" messages={listErrors} />
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="ingredient-to-add">
            Adicionar ingrediente no topo
          </label>
          <div className={styles.rangeRow}>
            <select
              id="ingredient-to-add"
              className={styles.select}
              value={ingredientToAdd}
              onChange={(event) => setIngredientToAdd(event.target.value)}
            >
              {ingredients.map((ingredient) => (
                <option key={ingredient.id} value={ingredient.id}>
                  {ingredient.name}
                  {ingredient.isVisible ? "" : " (oculto)"}
                </option>
              ))}
            </select>
            <button type="button" className={styles.button} onClick={addIngredient} disabled={isFull || !ingredientToAdd}>
              Adicionar
            </button>
          </div>
          {isFull && <p className={styles.help}>Limite de {maxLayers} ingredientes atingido.</p>}
        </div>

        {hiddenNames.length > 0 && (
          <p className={`${styles.badge} ${styles.badgeWarning}`}>
            Este preset fica indisponível no montador até {hiddenNames.join(", ")}{" "}
            {hiddenNames.length === 1 ? "ser publicado" : "serem publicados"}.
          </p>
        )}
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
            {isSaving ? "Salvando…" : isEditing ? "Salvar preset" : "Criar preset"}
          </button>
        </div>
      </form>

      <section className={styles.card} aria-labelledby="preset-preview-title">
        <h2 id="preset-preview-title" className={styles.cardTitle}>
          Preview
        </h2>
        <p className={styles.cardHint}>Como o preset aparece no montador, com o mesmo cálculo de empilhamento.</p>
        <div className={styles.previewStage}>
          {bunVariantId && <RecipePreview catalog={catalog} recipe={recipe} className="" />}
        </div>
      </section>
    </div>
  );
}
