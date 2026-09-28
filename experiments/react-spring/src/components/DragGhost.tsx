// Imagem que acompanha o ponteiro durante o arraste. Arquivo IDÊNTICO nos
// três experimentos. É posicionada diretamente no DOM pelo hook de arraste
// (sem biblioteca de animação), para seguir o ponteiro 1:1.

import Image from "next/image";
import { getIngredient } from "@/burger/ingredients";
import type { DragState } from "@/burger/useCompositionDrag";
import styles from "./builder.module.css";

type DragGhostProps = {
  drag: DragState;
  ghostRef: (node: HTMLDivElement | null) => void;
};

export function DragGhost({ drag, ghostRef }: DragGhostProps) {
  const ingredient = getIngredient(drag.ingredientId);
  const outside = drag.index === null;
  return (
    <div
      ref={ghostRef}
      className={`${styles.ghost} ${outside ? styles.ghostOutside : ""}`}
      style={{ width: drag.size.width, height: drag.size.height }}
      aria-hidden="true"
    >
      <Image src={ingredient.src} alt="" width={ingredient.size.w} height={ingredient.size.h} unoptimized draggable={false} />
      {outside && <span className={styles.ghostBadge}>✕ Soltar aqui cancela</span>}
    </div>
  );
}
