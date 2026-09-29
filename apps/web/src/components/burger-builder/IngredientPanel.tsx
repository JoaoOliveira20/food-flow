"use client";

import Image from "next/image";
import type { PointerEvent } from "react";
import { INGREDIENTS } from "@/burger/ingredientCatalog";
import { useScrollIntoViewWhen } from "@/hooks/useScrollIntoViewWhen";
import styles from "./burgerBuilder.module.css";

type IngredientPanelProps = {
  replacedIngredientName: string | null;
  isDisabled: boolean;
  onPickIngredient: (ingredientId: string) => void;
  onIngredientPointerDown: (event: PointerEvent, ingredientId: string) => void;
};

export function IngredientPanel({
  replacedIngredientName,
  isDisabled,
  onPickIngredient,
  onIngredientPointerDown,
}: IngredientPanelProps) {
  const isReplacing = replacedIngredientName !== null;
  const panelRef = useScrollIntoViewWhen<HTMLElement>(isReplacing);

  return (
    <aside
      ref={panelRef}
      className={`${styles.panel} ${styles.ingredients} ${isReplacing ? styles.panelReplacing : ""}`}
    >
      <h2 className={styles.panelTitle}>
        {isReplacing ? `Substituir ${replacedIngredientName} por…` : "Ingredientes"}
      </h2>
      {!isReplacing && (
        <p className={styles.panelHint}>
          Toque para adicionar no topo, ou arraste até o hambúrguer para escolher a posição (no celular, segure antes de
          arrastar).
        </p>
      )}
      <ul className={styles.ingredientList}>
        {INGREDIENTS.map((ingredient) => (
          <li key={ingredient.id}>
            <button
              className={styles.ingredientButton}
              disabled={isDisabled}
              onClick={() => onPickIngredient(ingredient.id)}
              onPointerDown={isReplacing ? undefined : (event) => onIngredientPointerDown(event, ingredient.id)}
              onContextMenu={(event) => event.preventDefault()}
            >
              <span className={styles.thumbnail}>
                <Image
                  src={ingredient.imagePath}
                  alt=""
                  width={ingredient.imageSize.width}
                  height={ingredient.imageSize.height}
                  unoptimized
                />
              </span>
              <span className={styles.ingredientName}>{ingredient.name}</span>
              <span className={styles.ingredientAction} aria-hidden="true">
                {isReplacing ? "⇄" : "+"}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );
}
