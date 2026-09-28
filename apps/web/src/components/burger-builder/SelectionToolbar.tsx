import Image from "next/image";
import type { Ingredient } from "@/burger/ingredientCatalog";
import styles from "./burgerBuilder.module.css";

type SelectionToolbarProps = {
  ingredient: Ingredient;
  canMoveUp: boolean;
  canMoveDown: boolean;
  canDuplicate: boolean;
  isReplacing: boolean;
  onMove: (direction: "up" | "down") => void;
  onDuplicate: () => void;
  onToggleReplacing: () => void;
  onRemove: () => void;
  onClose: () => void;
};

export function SelectionToolbar({
  ingredient,
  canMoveUp,
  canMoveDown,
  canDuplicate,
  isReplacing,
  onMove,
  onDuplicate,
  onToggleReplacing,
  onRemove,
  onClose,
}: SelectionToolbarProps) {
  return (
    <div className={styles.selectionToolbar} role="toolbar" aria-label={`Ações para ${ingredient.name}`}>
      <span className={styles.selectionName}>
        <span className={styles.selectionThumbnail}>
          <Image
            src={ingredient.imagePath}
            alt=""
            width={ingredient.imageSize.width}
            height={ingredient.imageSize.height}
            unoptimized
          />
        </span>
        {ingredient.name}
      </span>
      <div className={styles.selectionActions}>
        <button onClick={() => onMove("up")} disabled={!canMoveUp} aria-label="Mover para cima">
          ↑ <span className={styles.actionLabel}>Subir</span>
        </button>
        <button onClick={() => onMove("down")} disabled={!canMoveDown} aria-label="Mover para baixo">
          ↓ <span className={styles.actionLabel}>Descer</span>
        </button>
        <button onClick={onDuplicate} disabled={!canDuplicate}>
          Duplicar
        </button>
        <button
          onClick={onToggleReplacing}
          aria-pressed={isReplacing}
          className={isReplacing ? styles.actionActive : ""}
        >
          {isReplacing ? "Cancelar" : "Substituir"}
        </button>
        <button onClick={onRemove} className={styles.actionDanger}>
          Remover
        </button>
      </div>
      <button onClick={onClose} aria-label="Fechar seleção" className={styles.actionClose}>
        ×
      </button>
    </div>
  );
}
