import { hitAreaCenter, type StackLayout } from "@/burger/stackLayout";
import styles from "./burgerBuilder.module.css";

const ARROW_GAP = 14;

type DropIndicatorProps = {
  layout: StackLayout;
  draggedInstanceId: string | null;
};

export function DropIndicator({ layout, draggedInstanceId }: DropIndicatorProps) {
  const draggedLayer = layout.layers.find((layer) => layer.key === draggedInstanceId);
  if (!draggedLayer?.hitArea) return null;
  const arrowDistance = draggedLayer.width / 2 + ARROW_GAP;

  return (
    <div
      className={styles.dropIndicator}
      style={{ transform: `translateY(${-hitAreaCenter(draggedLayer.hitArea)}px)` }}
      aria-hidden="true"
    >
      <span className={styles.dropArrow} style={{ left: -arrowDistance }}>
        ▶
      </span>
      <span className={styles.dropArrow} style={{ left: arrowDistance }}>
        ◀
      </span>
    </div>
  );
}
