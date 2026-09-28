// Marcadores da posição de inserção durante o arraste. Arquivo IDÊNTICO nos
// três experimentos. Renderizado dentro da composição (mesma escala), na
// posição FINAL da camada arrastada; não é animado.

import type { BurgerLayout } from "@/burger/layout";
import styles from "./builder.module.css";

type DropIndicatorProps = {
  layout: BurgerLayout;
  draggingKey: string | null;
};

export function DropIndicator({ layout, draggingKey }: DropIndicatorProps) {
  const layer = layout.layers.find((item) => item.key === draggingKey);
  if (!layer?.hit) return null;
  const center = layer.hit.bottom + layer.hit.height / 2;
  const reach = layer.width / 2 + 14;
  return (
    <div className={styles.dropIndicator} style={{ transform: `translateY(${-center}px)` }} aria-hidden="true">
      <span className={styles.dropArrow} style={{ left: -reach }}>
        ▶
      </span>
      <span className={styles.dropArrow} style={{ left: reach }}>
        ◀
      </span>
    </div>
  );
}
