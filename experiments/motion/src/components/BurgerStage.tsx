"use client";

// Palco do hambúrguer — integração com Motion for React (`motion/react`).
//
// Modelo declarativo: cada camada declara `initial` (entrada), `animate`
// (posição atual calculada em layout.ts) e `exit` (saída). Quando a posição
// muda, o Motion redireciona a mola a partir do valor e da velocidade atuais,
// então interrupções não exigem código extra. AnimatePresence mantém a camada
// removida montada até a saída terminar.
//
// Não usamos a prop `layout` (FLIP): as posições já vêm calculadas por
// layout.ts, e animar `y` diretamente mantém o mesmo modelo dos outros
// experimentos.

import { AnimatePresence, motion, useAnimate } from "motion/react";
import Image from "next/image";
import { useEffect, useRef, type PointerEvent } from "react";
import {
  BUN_SWAP_SCALE,
  ENTER_OFFSET_Y,
  ENTER_ROTATION,
  EXIT_DURATION_S,
  EXIT_EASE_BEZIER,
  EXIT_OFFSET_Y,
  EXIT_SCALE,
  SPRING,
} from "@/burger/animation";
import { COMPOSITION_BOTTOM, type BurgerLayout } from "@/burger/layout";
import { DropIndicator } from "./DropIndicator";
import { HitAreas } from "./HitAreas";
import styles from "./builder.module.css";

export type BurgerStageProps = {
  layout: BurgerLayout;
  fit: number;
  bunId: string;
  selectedUid: string | null;
  // Camada sendo arrastada (translúcida no lugar de inserção), ou null.
  draggingKey: string | null;
  onSelect: (uid: string) => void;
  onLayerPointerDown: (event: PointerEvent, uid: string) => void;
};

const spring = { type: "spring", ...SPRING } as const;
const compositionStyle = { bottom: `${COMPOSITION_BOTTOM * 100}%` };

export function BurgerStage({
  layout,
  fit,
  bunId,
  selectedUid,
  draggingKey,
  onSelect,
  onLayerPointerDown,
}: BurgerStageProps) {
  const [scope, animate] = useAnimate();
  const previousBun = useRef(bunId);

  // Troca de pão: pequeno assentamento nos dois pães. Imperativo via
  // useAnimate, porque é um efeito disparado por evento e não um estado-alvo.
  useEffect(() => {
    if (previousBun.current === bunId) return;
    previousBun.current = bunId;
    animate("[data-bun]", { scale: [BUN_SWAP_SCALE, 1] }, spring);
  }, [bunId, animate]);

  return (
    <motion.div
      ref={scope}
      className={styles.composition}
      style={compositionStyle}
      initial={{ scale: fit }}
      animate={{ scale: fit }}
      transition={spring}
    >
      {/* initial={false}: a composição inicial aparece montada, sem entrada. */}
      <AnimatePresence initial={false}>
        {layout.layers.map((layer) => (
          <motion.div
            key={layer.key}
            className={`${styles.layer} ${layer.key === selectedUid ? styles.layerSelected : ""} ${
              layer.key === draggingKey ? styles.layerDragging : ""
            }`}
            style={{
              width: layer.width,
              height: layer.height,
              marginLeft: -layer.width / 2,
              zIndex: layer.zIndex,
            }}
            initial={{ y: -(layer.bottom + ENTER_OFFSET_Y), rotate: ENTER_ROTATION, opacity: 0 }}
            animate={{ y: -layer.bottom, rotate: 0, opacity: 1, scale: 1 }}
            exit={{
              y: -layer.bottom + EXIT_OFFSET_Y,
              scale: EXIT_SCALE,
              opacity: 0,
              transition: { duration: EXIT_DURATION_S, ease: EXIT_EASE_BEZIER },
            }}
            transition={spring}
          >
            <div className={styles.layerInner} data-bun={layer.kind === "bun" ? "" : undefined}>
              <Image src={layer.src} alt={layer.name} width={layer.width} height={layer.height} unoptimized draggable={false} />
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      <DropIndicator layout={layout} draggingKey={draggingKey} />
      <HitAreas
        layers={layout.layers}
        selectedUid={selectedUid}
        onSelect={onSelect}
        onPointerDown={onLayerPointerDown}
      />
    </motion.div>
  );
}
