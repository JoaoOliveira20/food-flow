"use client";

import { motion } from "motion/react";
import Image from "next/image";
import type { PositionedLayer } from "@/burger/stackLayout";
import { enteringLayerState, leavingLayerState, layerSpring, restingLayerState } from "./layerMotion";
import styles from "./burgerBuilder.module.css";

type StackLayerProps = {
  layer: PositionedLayer;
  isSelected: boolean;
  isDragged: boolean;
};

export function StackLayer({ layer, isSelected, isDragged }: StackLayerProps) {
  const className = [styles.layer, isSelected && styles.layerSelected, isDragged && styles.layerDragging]
    .filter(Boolean)
    .join(" ");

  return (
    <motion.div
      className={className}
      style={{ width: layer.width, height: layer.height, marginLeft: -layer.width / 2, zIndex: layer.zIndex }}
      initial={enteringLayerState(layer)}
      animate={restingLayerState(layer)}
      exit={leavingLayerState(layer)}
      transition={layerSpring}
    >
      <div className={styles.layerImage} data-bun-layer={layer.kind === "bun" ? "" : undefined}>
        <Image
          src={layer.imagePath}
          alt={layer.name}
          width={layer.imageSize.width}
          height={layer.imageSize.height}
          unoptimized
          loading="eager"
          draggable={false}
        />
      </div>
    </motion.div>
  );
}
