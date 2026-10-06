import Image from "next/image";
import type { BunVariant } from "@/burger/catalog";
import styles from "./burgerBuilder.module.css";

type BunPickerProps = {
  bunVariants: BunVariant[];
  selectedBunVariantId: string;
  onSelectBunVariant: (bunVariantId: string) => void;
};

export function BunPicker({ bunVariants, selectedBunVariantId, onSelectBunVariant }: BunPickerProps) {
  return (
    <aside className={`${styles.panel} ${styles.buns}`}>
      <h2 className={styles.panelTitle}>Tipo de pão</h2>
      <div className={styles.bunList} role="radiogroup" aria-label="Tipo de pão">
        {bunVariants.map((variant) => {
          const isSelected = variant.id === selectedBunVariantId;
          return (
            <button
              key={variant.id}
              role="radio"
              aria-checked={isSelected}
              className={`${styles.optionCard} ${isSelected ? styles.optionCardSelected : ""}`}
              onClick={() => onSelectBunVariant(variant.id)}
            >
              <span className={styles.optionThumbnail}>
                <Image
                  src={variant.topBun.imagePath}
                  alt=""
                  width={variant.topBun.imageSize.width}
                  height={variant.topBun.imageSize.height}
                  unoptimized
                  loading="eager"
                />
              </span>
              {variant.name}
            </button>
          );
        })}
      </div>
    </aside>
  );
}
