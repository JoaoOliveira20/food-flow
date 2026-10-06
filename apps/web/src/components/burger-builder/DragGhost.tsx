import Image from "next/image";
import { findIngredient, type BuilderCatalog } from "@/burger/catalog";
import type { DragState } from "@/hooks/useCompositionDrag";
import styles from "./burgerBuilder.module.css";

type DragGhostProps = {
  catalog: BuilderCatalog;
  drag: DragState;
  attachElement: (element: HTMLDivElement | null) => void;
};

export function DragGhost({ catalog, drag, attachElement }: DragGhostProps) {
  const ingredient = findIngredient(catalog, drag.ingredientId);
  const isOutsideStage = drag.insertionIndex === null;

  return (
    <div
      ref={attachElement}
      className={`${styles.ghost} ${isOutsideStage ? styles.ghostOutside : ""}`}
      style={{ width: drag.size.width, height: drag.size.height }}
      aria-hidden="true"
    >
      <Image
        src={ingredient.imagePath}
        alt=""
        width={ingredient.imageSize.width}
        height={ingredient.imageSize.height}
        unoptimized
        draggable={false}
      />
      {isOutsideStage && <span className={styles.ghostBadge}>✕ Soltar aqui cancela</span>}
    </div>
  );
}
