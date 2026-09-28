"use client";

// Palco do hambúrguer — integração com GSAP (`gsap` + `@gsap/react`).
//
// Modelo imperativo: o React renderiza os elementos e, depois de cada
// mudança, `useGSAP` compara as posições atuais com as últimas enviadas
// e cria tweens de entrada, reposicionamento e saída.
//
// Diferenças estruturais em relação a Motion e React Spring:
// - GSAP não tem spring: usamos duração + ease com leve overshoot (TWEEN_APPROX).
// - GSAP não sabe quando o React desmonta um elemento. Camadas removidas
//   ficam em `leaving` e continuam renderizadas até o tween de saída terminar.
// - Ao interromper, `overwrite: "auto"` mata só as propriedades em conflito;
//   o novo tween parte do valor atual, mas NÃO herda a velocidade.

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import Image from "next/image";
import { useRef, useState, type PointerEvent } from "react";
import {
  BUN_SWAP_SCALE,
  ENTER_OFFSET_Y,
  ENTER_ROTATION,
  EXIT_DURATION_S,
  EXIT_OFFSET_Y,
  EXIT_SCALE,
  TWEEN_APPROX,
} from "@/burger/animation";
import { COMPOSITION_BOTTOM, type BurgerLayout, type PositionedLayer } from "@/burger/layout";
import { DropIndicator } from "./DropIndicator";
import { HitAreas } from "./HitAreas";
import styles from "./builder.module.css";

gsap.registerPlugin(useGSAP);

const compositionStyle = { bottom: `${COMPOSITION_BOTTOM * 100}%` };

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

export function BurgerStage({
  layout,
  fit,
  bunId,
  selectedUid,
  draggingKey,
  onSelect,
  onLayerPointerDown,
}: BurgerStageProps) {
  const container = useRef<HTMLDivElement>(null);
  const nodes = useRef(new Map<string, HTMLDivElement>());
  // Último y enviado a cada camada; ausência = camada ainda não posicionada.
  const lastTarget = useRef(new Map<string, number>());
  const exiting = useRef(new Set<string>());
  const lastFit = useRef<number | null>(null);
  const hasMounted = useRef(false);
  const previousBun = useRef(bunId);

  // Camadas que saíram da composição, mantidas com a última posição até
  // a animação de saída terminar. Atualizado durante o render (padrão do
  // React para derivar estado de mudanças de props).
  const [leaving, setLeaving] = useState<PositionedLayer[]>([]);
  const [previousLayers, setPreviousLayers] = useState(layout.layers);
  if (previousLayers !== layout.layers) {
    const currentKeys = new Set(layout.layers.map((layer) => layer.key));
    const removed = previousLayers.filter((layer) => !currentKeys.has(layer.key));
    if (removed.length > 0) setLeaving((current) => [...current, ...removed]);
    setPreviousLayers(layout.layers);
  }

  // Posicionamento: entrada, reorganização e escala do conjunto.
  useGSAP(
    () => {
      layout.layers.forEach((layer) => {
        const node = nodes.current.get(layer.key);
        if (!node) return;
        const y = -layer.bottom;
        const previous = lastTarget.current.get(layer.key);
        if (previous === y) return;
        lastTarget.current.set(layer.key, y);

        if (previous === undefined && !hasMounted.current) {
          // Composição inicial: posiciona sem animar.
          gsap.set(node, { y });
        } else if (previous === undefined) {
          gsap.fromTo(
            node,
            { y: y - ENTER_OFFSET_Y, rotation: ENTER_ROTATION, opacity: 0 },
            { y, rotation: 0, opacity: 1, ...TWEEN_APPROX },
          );
        } else {
          // Interrupção: substitui só o y de um tween em andamento
          // (rotação/opacidade da entrada continuam).
          gsap.to(node, { y, ...TWEEN_APPROX, overwrite: "auto" });
        }
      });

      if (lastFit.current === null) gsap.set(container.current, { scale: fit });
      else if (lastFit.current !== fit) gsap.to(container.current, { scale: fit, ...TWEEN_APPROX, overwrite: "auto" });
      lastFit.current = fit;

      hasMounted.current = true;

      // Chamado quando o contexto é revertido (desmontagem, inclusive a
      // desmontagem simulada do StrictMode em dev). O revert desfaz os
      // tweens, então o controle manual também precisa ser zerado.
      return () => {
        lastTarget.current.clear();
        exiting.current.clear();
        lastFit.current = null;
        hasMounted.current = false;
      };
    },
    { dependencies: [layout, fit], scope: container },
  );

  // Saída das camadas removidas.
  useGSAP(
    () => {
      leaving.forEach((layer) => {
        const node = nodes.current.get(layer.key);
        if (!node || exiting.current.has(layer.key)) return;
        exiting.current.add(layer.key);
        lastTarget.current.delete(layer.key);
        gsap.to(node, {
          y: -layer.bottom + EXIT_OFFSET_Y,
          scale: EXIT_SCALE,
          opacity: 0,
          duration: EXIT_DURATION_S,
          ease: "power1.in", // ease-in quadrática, igual às outras bibliotecas
          overwrite: "auto",
          onComplete: () => {
            exiting.current.delete(layer.key);
            setLeaving((current) => current.filter((item) => item.key !== layer.key));
          },
        });
      });
    },
    { dependencies: [leaving], scope: container },
  );

  // Troca de pão: pequeno assentamento nos dois pães.
  useGSAP(
    () => {
      if (previousBun.current === bunId) return;
      previousBun.current = bunId;
      gsap.fromTo("[data-bun]", { scale: BUN_SWAP_SCALE }, { scale: 1, ...TWEEN_APPROX, overwrite: "auto" });
    },
    { dependencies: [bunId], scope: container },
  );

  function register(key: string) {
    return (node: HTMLDivElement | null) => {
      if (node) nodes.current.set(key, node);
      else nodes.current.delete(key);
    };
  }

  return (
    <div ref={container} className={styles.composition} style={compositionStyle}>
      {[...layout.layers, ...leaving].map((layer) => (
        <div
          key={layer.key}
          ref={register(layer.key)}
          className={`${styles.layer} ${layer.key === selectedUid ? styles.layerSelected : ""} ${
            layer.key === draggingKey ? styles.layerDragging : ""
          }`}
          style={{
            width: layer.width,
            height: layer.height,
            marginLeft: -layer.width / 2,
            zIndex: layer.zIndex,
          }}
        >
          <div className={styles.layerInner} data-bun={layer.kind === "bun" ? "" : undefined}>
            <Image src={layer.src} alt={layer.name} width={layer.width} height={layer.height} unoptimized draggable={false} />
          </div>
        </div>
      ))}

      <DropIndicator layout={layout} draggingKey={draggingKey} />
      <HitAreas
        layers={layout.layers}
        selectedUid={selectedUid}
        onSelect={onSelect}
        onPointerDown={onLayerPointerDown}
      />
    </div>
  );
}
