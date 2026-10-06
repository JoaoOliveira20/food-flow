"use client";

import { useState } from "react";
import type { BuilderCatalog, Ingredient } from "@/burger/catalog";
import { RecipePreview } from "@/components/burger-builder/RecipePreview";
import styles from "./admin.module.css";

const NONE = "";
const DRAFT_ID = "draft";

type IngredientPreviewProps = {
  catalog: BuilderCatalog;
  draft: Omit<Ingredient, "id"> | null;
  editedIngredientId: string | null;
};

export function IngredientPreview({ catalog, draft, editedIngredientId }: IngredientPreviewProps) {
  const neighbors = catalog.ingredients.filter((ingredient) => ingredient.id !== editedIngredientId);
  const [bunVariantId, setBunVariantId] = useState(catalog.bunVariants[0]?.id ?? NONE);
  const [belowId, setBelowId] = useState(neighbors[0]?.id ?? NONE);
  const [aboveId, setAboveId] = useState(neighbors.find((ingredient) => ingredient.id !== belowId)?.id ?? NONE);

  if (!bunVariantId) return <p className={styles.empty}>Cadastre um tipo de pão para ver o preview.</p>;

  const previewCatalog: BuilderCatalog = {
    ...catalog,
    ingredients: draft ? [...neighbors, { ...draft, id: DRAFT_ID }] : neighbors,
  };
  const ingredientIds = [belowId, draft ? DRAFT_ID : NONE, aboveId].filter((id) => id !== NONE);

  return (
    <div>
      <div className={styles.previewStage}>
        <RecipePreview catalog={previewCatalog} recipe={{ bunVariantId, ingredientIds }} className="" />
      </div>
      {!draft && <p className={styles.help}>Escolha uma imagem para ver o ingrediente na pilha.</p>}
      <div className={styles.previewControls}>
        <label className={styles.field}>
          <span className={styles.label}>Camada acima</span>
          <select className={styles.select} value={aboveId} onChange={(event) => setAboveId(event.target.value)}>
            <option value={NONE}>Nenhuma (pão)</option>
            {neighbors.map((ingredient) => (
              <option key={ingredient.id} value={ingredient.id}>
                {ingredient.name}
              </option>
            ))}
          </select>
        </label>
        <label className={styles.field}>
          <span className={styles.label}>Camada abaixo</span>
          <select className={styles.select} value={belowId} onChange={(event) => setBelowId(event.target.value)}>
            <option value={NONE}>Nenhuma (pão)</option>
            {neighbors.map((ingredient) => (
              <option key={ingredient.id} value={ingredient.id}>
                {ingredient.name}
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
      </div>
    </div>
  );
}
