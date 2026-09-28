"use client";

import { AnimatePresence, MotionConfig, motion, useAnimate } from "motion/react";
import { useEffect, useRef, type PointerEvent } from "react";
import { STACK_BASELINE_RATIO, type StackLayout } from "@/burger/stackLayout";
import { DropIndicator } from "./DropIndicator";
import { LayerHitAreas } from "./LayerHitAreas";
import { StackLayer } from "./StackLayer";
import { bunSettleKeyframes, layerSpring } from "./layerMotion";
import styles from "./burgerBuilder.module.css";

type BurgerStageProps = {
  layout: StackLayout;
  stackScale: number;
  bunVariantId: string;
  selectedInstanceId: string | null;
  draggedInstanceId: string | null;
  onSelectLayer: (instanceId: string) => void;
  onLayerPointerDown: (event: PointerEvent, instanceId: string) => void;
};

const stackPositionStyle = { bottom: `${STACK_BASELINE_RATIO * 100}%` };

function useBunSettleAnimation(bunVariantId: string) {
  const [scope, animate] = useAnimate();
  const previousBunVariantId = useRef(bunVariantId);

  useEffect(() => {
    if (previousBunVariantId.current === bunVariantId) return;
    previousBunVariantId.current = bunVariantId;
    animate("[data-bun-layer]", bunSettleKeyframes, layerSpring);
  }, [bunVariantId, animate]);

  return scope;
}

export function BurgerStage({
  layout,
  stackScale,
  bunVariantId,
  selectedInstanceId,
  draggedInstanceId,
  onSelectLayer,
  onLayerPointerDown,
}: BurgerStageProps) {
  const scope = useBunSettleAnimation(bunVariantId);

  return (
    <MotionConfig reducedMotion="user">
      <motion.div
        ref={scope}
        className={styles.stack}
        style={stackPositionStyle}
        initial={{ scale: stackScale }}
        animate={{ scale: stackScale }}
        transition={layerSpring}
      >
        <AnimatePresence initial={false}>
          {layout.layers.map((layer) => (
            <StackLayer
              key={layer.key}
              layer={layer}
              isSelected={layer.key === selectedInstanceId}
              isDragged={layer.key === draggedInstanceId}
            />
          ))}
        </AnimatePresence>
        <DropIndicator layout={layout} draggedInstanceId={draggedInstanceId} />
        <LayerHitAreas
          layers={layout.layers}
          selectedInstanceId={selectedInstanceId}
          onSelectLayer={onSelectLayer}
          onLayerPointerDown={onLayerPointerDown}
        />
      </motion.div>
    </MotionConfig>
  );
}
