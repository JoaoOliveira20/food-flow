// Seleção da variante de pão. Arquivo IDÊNTICO nos três experimentos.

import Image from "next/image";
import { BUN_VARIANTS } from "@/burger/ingredients";
import styles from "./builder.module.css";

type BunPickerProps = {
  bunId: string;
  onChange: (bunId: string) => void;
};

export function BunPicker({ bunId, onChange }: BunPickerProps) {
  return (
    <aside className={`${styles.panel} ${styles.buns}`}>
      <h2 className={styles.panelTitle}>Tipo de pão</h2>
      <div className={styles.bunList} role="radiogroup" aria-label="Tipo de pão">
        {BUN_VARIANTS.map((variant) => (
          <button
            key={variant.id}
            role="radio"
            aria-checked={variant.id === bunId}
            className={`${styles.bunButton} ${variant.id === bunId ? styles.bunActive : ""}`}
            onClick={() => onChange(variant.id)}
          >
            <span className={styles.bunThumb}>
              <Image src={variant.top.src} alt="" width={variant.top.size.w} height={variant.top.size.h} unoptimized />
            </span>
            {variant.name}
          </button>
        ))}
      </div>
    </aside>
  );
}
