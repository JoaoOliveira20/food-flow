"use client";

import { useReducedMotion } from "motion/react";
import Image from "next/image";
import { useEffect, useRef, type PointerEvent } from "react";
import { INGREDIENTS } from "@/burger/ingredientCatalog";
import styles from "./burgerBuilder.module.css";

type IngredientPanelProps = {
  replacedIngredientName: string | null;
  isDisabled: boolean;
  onPickIngredient: (ingredientId: string) => void;
  onIngredientPointerDown: (event: PointerEvent, ingredientId: string) => void;
};

function useScrollIntoViewWhen(isActive: boolean) {
  const elementRef = useRef<HTMLElement>(null);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (!isActive) return;
    elementRef.current?.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth", block: "nearest" });
  }, [isActive, prefersReducedMotion]);

  return elementRef;
}

export function IngredientPanel({
  replacedIngredientName,
  isDisabled,
  onPickIngredient,
  onIngredientPointerDown,
}: IngredientPanelProps) {
  const isReplacing = replacedIngredientName !== null;
  const panelRef = useScrollIntoViewWhen(isReplacing);

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
