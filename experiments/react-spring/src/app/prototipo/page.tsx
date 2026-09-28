"use client";

// Experimento: React Spring (`@react-spring/web`).
//
// Modelo: física de mola (tension/friction), sem duração fixa.
// `useTransition` recebe a lista e decide, por chave, quem entra (from → enter),
// quem permanece (update) e quem sai (leave). Os valores animados são
// SpringValues aplicados via `animated.div`, fora do ciclo de render do React.

import { animated, useTransition } from "@react-spring/web";
import { useState } from "react";
import { Controls } from "./controls";
import "./prototipo.css";
import {
  applyAction,
  ENTER_OFFSET_Y,
  ENTER_ROTATION,
  EXIT_DURATION_S,
  EXIT_OFFSET_X,
  EXIT_ROTATION,
  freshLayersFor,
  INITIAL_LAYERS,
  LAYER_HEIGHT,
  LAYER_WIDTH,
  SPRING,
  STAGE_HEIGHT,
  STAGE_WIDTH,
  targetY,
  type Action,
  type Layer,
} from "./layers";

// Mesmo modelo massa-mola do Motion: tension = stiffness, friction = damping.
const SPRING_CONFIG = { tension: SPRING.stiffness, friction: SPRING.damping };

export default function ReactSpringExperiment() {
  const [layers, setLayers] = useState(INITIAL_LAYERS);

  function handleAction(action: Action) {
    const fresh = freshLayersFor(action);
    setLayers((current) => applyAction(current, action, fresh));
  }

  // O alvo depende do índice atual na lista, não do item em si.
  const indexOf = (layer: Layer) => layers.indexOf(layer);

  const transitions = useTransition(layers, {
    keys: (layer) => layer.id,
    // initial: as camadas do primeiro render aparecem já no lugar.
    initial: (layer) => ({ x: 0, y: targetY(indexOf(layer)), rotate: 0, opacity: 1 }),
    from: (layer) => ({
      x: 0,
      y: targetY(indexOf(layer)) + ENTER_OFFSET_Y,
      rotate: ENTER_ROTATION,
      opacity: 0,
    }),
    enter: (layer) => ({ x: 0, y: targetY(indexOf(layer)), rotate: 0, opacity: 1 }),
    update: (layer) => ({ y: targetY(indexOf(layer)) }),
    leave: {
      x: EXIT_OFFSET_X,
      rotate: EXIT_ROTATION,
      opacity: 0,
      config: { duration: EXIT_DURATION_S * 1000 },
    },
    config: SPRING_CONFIG,
  });

  return (
    <main>
      <h1>Experimento — React Spring</h1>
      <p className="hint">@react-spring/web · useTransition · física de mola</p>

      <Controls count={layers.length} onAction={handleAction} />

      <div className="stage" style={{ width: STAGE_WIDTH, height: STAGE_HEIGHT }}>
        {transitions((style, layer) => {
          const index = indexOf(layer);
          return (
            <animated.div
              className="layer"
              style={{
                ...style,
                left: (STAGE_WIDTH - LAYER_WIDTH) / 2,
                width: LAYER_WIDTH,
                height: LAYER_HEIGHT,
                background: layer.color,
                // Camadas saindo (índice -1) ficam acima para a saída ser visível.
                zIndex: index === -1 ? layers.length : index,
              }}
            >
              {layer.label}
            </animated.div>
          );
        })}
      </div>
    </main>
  );
}
