"use client";

// Lista de ingredientes disponíveis. Arquivo IDÊNTICO nos três experimentos.

import Image from "next/image";
import { useEffect, useRef, type PointerEvent } from "react";
import { INGREDIENTS } from "@/burger/ingredients";
import styles from "./builder.module.css";

type IngredientPanelProps = {
  replacing: boolean;
  replacingName: string | null;
  disabled: boolean;
  onPick: (ingredientId: string) => void;
  // Ausente no modo de substituição (arrastar não faz sentido ali).
  onDragStart?: (event: PointerEvent, ingredientId: string) => void;
};

export function IngredientPanel({ replacing, replacingName, disabled, onPick, onDragStart }: IngredientPanelProps) {
  const panelRef = useRef<HTMLElement>(null);

  // No mobile a lista fica abaixo do hambúrguer: ao entrar no modo de
  // substituição, traz a lista para a tela ("nearest" não rola se já visível).
  useEffect(() => {
    if (replacing) panelRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [replacing]);

  return (
    <aside
      ref={panelRef}
      className={`${styles.panel} ${styles.ingredients} ${replacing ? styles.panelReplacing : ""}`}
    >
      <h2 className={styles.panelTitle}>{replacing ? `Substituir ${replacingName} por…` : "Ingredientes"}</h2>
      {!replacing && (
        <p className={styles.panelHint}>
          Toque para adicionar no topo, ou arraste até o hambúrguer para escolher a posição (no celular, segure antes
          de arrastar).
        </p>
      )}
      <ul className={styles.ingredientList}>
        {INGREDIENTS.map((ingredient) => (
          <li key={ingredient.id}>
            <button
              className={styles.ingredientButton}
              disabled={disabled}
              onClick={() => onPick(ingredient.id)}
              onPointerDown={onDragStart && ((event) => onDragStart(event, ingredient.id))}
              onContextMenu={(event) => event.preventDefault()}
            >
              <span className={styles.thumb}>
                <Image src={ingredient.src} alt="" width={ingredient.size.w} height={ingredient.size.h} unoptimized />
              </span>
              <span className={styles.ingredientName}>{ingredient.name}</span>
              <span className={styles.ingredientAction} aria-hidden="true">
                {replacing ? "⇄" : "+"}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );
}
