import Image from "next/image";
import type { AdminImage } from "@/api/admin/types";
import styles from "./admin.module.css";

type IngredientThumbnailProps = {
  image: AdminImage;
};

export function IngredientThumbnail({ image }: IngredientThumbnailProps) {
  return (
    <span className={styles.thumbnail}>
      <Image src={image.url} alt="" width={image.width} height={image.height} unoptimized />
    </span>
  );
}
