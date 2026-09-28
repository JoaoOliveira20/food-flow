"use client";

// Palco do hambúrguer — integração com React Spring (`@react-spring/web`).
//
// Modelo de física de mola (tension/friction), sem duração fixa.
// `useTransition` recebe a lista de camadas e decide, por chave, quem entra
// (from → enter), quem permanece e muda de posição (update) e quem sai
// (leave), mantendo a camada removida montada até a saída terminar.
// Os valores animados são SpringValues aplicados via `animated.div`, fora do
// ciclo de render do React. Ao mudar o alvo no meio do movimento, a mola
// continua a partir da posição e velocidade atuais.

import { animated, easings, useSpring, useTransition } from "@react-spring/web";
import Image from "next/image";
import { useEffect, useRef, type PointerEvent } from "react";
import {
  BUN_SWAP_SCALE,
  ENTER_OFFSET_Y,
  ENTER_ROTATION,
  EXIT_DURATION_S,
  EXIT_OFFSET_Y,
  EXIT_SCALE,
  SPRING,
} from "@/burger/animation";
import { COMPOSITION_BOTTOM, type BurgerLayout, type PositionedLayer } from "@/burger/layout";
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

// Mesmo modelo massa-mola do Motion: tension = stiffness, friction = damping.
const SPRING_CONFIG = { tension: SPRING.stiffness, friction: SPRING.damping, mass: SPRING.mass };
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
  const transitions = useTransition(layout.layers, {
    keys: (layer: PositionedLayer) => layer.key,
    // Composição inicial: aparece já no lugar, sem entrada.
    initial: (layer: PositionedLayer) => ({ y: -layer.bottom, rotate: 0, opacity: 1, scale: 1 }),
    from: (layer: PositionedLayer) => ({
      y: -layer.bottom - ENTER_OFFSET_Y,
      rotate: ENTER_ROTATION,
      opacity: 0,
      scale: 1,
    }),
    enter: (layer: PositionedLayer) => ({ y: -layer.bottom, rotate: 0, opacity: 1 }),
    update: (layer: PositionedLayer) => ({ y: -layer.bottom }),
    leave: (layer: PositionedLayer) => ({
      y: -layer.bottom + EXIT_OFFSET_Y,
      scale: EXIT_SCALE,
      opacity: 0,
      config: { duration: EXIT_DURATION_S * 1000, easing: easings.easeInQuad },
    }),
    config: SPRING_CONFIG,
  });

  // Escala do conjunto para caber no palco.
  const containerSpring = useSpring({ scale: fit, config: SPRING_CONFIG });

  // Troca de pão: pequeno assentamento nos dois pães, disparado pela API
  // imperativa porque é um evento e não um estado-alvo.
  const [bunSpring, bunApi] = useSpring(() => ({ scale: 1, config: SPRING_CONFIG }));
  const previousBun = useRef(bunId);
  useEffect(() => {
    if (previousBun.current === bunId) return;
    previousBun.current = bunId;
    bunApi.start({ from: { scale: BUN_SWAP_SCALE }, to: { scale: 1 } });
  }, [bunId, bunApi]);

  return (
    <animated.div className={styles.composition} style={{ ...compositionStyle, ...containerSpring }}>
      {transitions((style, layer) => (
        <animated.div
          className={`${styles.layer} ${layer.key === selectedUid ? styles.layerSelected : ""} ${
            layer.key === draggingKey ? styles.layerDragging : ""
          }`}
          style={{
            ...style,
            width: layer.width,
            height: layer.height,
            marginLeft: -layer.width / 2,
            zIndex: layer.zIndex,
          }}
        >
          <animated.div
            className={styles.layerInner}
            data-bun={layer.kind === "bun" ? "" : undefined}
            style={layer.kind === "bun" ? bunSpring : undefined}
          >
            <Image src={layer.src} alt={layer.name} width={layer.width} height={layer.height} unoptimized draggable={false} />
          </animated.div>
        </animated.div>
      ))}

      <DropIndicator layout={layout} draggingKey={draggingKey} />
      <HitAreas
        layers={layout.layers}
        selectedUid={selectedUid}
        onSelect={onSelect}
        onPointerDown={onLayerPointerDown}
      />
    </animated.div>
  );
}
