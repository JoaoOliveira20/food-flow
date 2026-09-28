// Ações da camada selecionada. Arquivo IDÊNTICO nos três experimentos.

import Image from "next/image";
import type { Ingredient } from "@/burger/ingredients";
import styles from "./builder.module.css";

type SelectionBarProps = {
  ingredient: Ingredient;
  canMoveUp: boolean;
  canMoveDown: boolean;
  canDuplicate: boolean;
  replacing: boolean;
  onMove: (direction: "up" | "down") => void;
  onDuplicate: () => void;
  onToggleReplace: () => void;
  onRemove: () => void;
  onClose: () => void;
};

export function SelectionBar(props: SelectionBarProps) {
  const { ingredient, replacing } = props;
  return (
    <div className={styles.selectionBar} role="toolbar" aria-label={`Ações para ${ingredient.name}`}>
      <span className={styles.selectionName}>
        <span className={styles.selectionThumb}>
          <Image src={ingredient.src} alt="" width={ingredient.size.w} height={ingredient.size.h} unoptimized />
        </span>
        {ingredient.name}
      </span>
      <div className={styles.selectionActions}>
        <button onClick={() => props.onMove("up")} disabled={!props.canMoveUp} aria-label="Mover para cima">
          ↑ <span className={styles.actionLabel}>Subir</span>
        </button>
        <button onClick={() => props.onMove("down")} disabled={!props.canMoveDown} aria-label="Mover para baixo">
          ↓ <span className={styles.actionLabel}>Descer</span>
        </button>
        <button onClick={props.onDuplicate} disabled={!props.canDuplicate}>
          Duplicar
        </button>
        <button onClick={props.onToggleReplace} aria-pressed={replacing} className={replacing ? styles.actionActive : ""}>
          {replacing ? "Cancelar" : "Substituir"}
        </button>
        <button onClick={props.onRemove} className={styles.actionDanger}>
          Remover
        </button>
      </div>
      <button onClick={props.onClose} aria-label="Fechar seleção" className={styles.actionClose}>
        ×
      </button>
    </div>
  );
}
