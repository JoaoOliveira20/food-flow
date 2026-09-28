"use client";

// Experimento: Motion for React (`motion/react`).
//
// Modelo: declarativo. Cada camada declara `initial` (de onde entra),
// `animate` (onde deve estar agora) e `exit` (como sai). Quando o índice
// muda, `animate.y` muda e o Motion anima até o novo valor partindo do
// valor e da velocidade atuais. AnimatePresence mantém o elemento montado
// até a animação de saída terminar.

import { AnimatePresence, motion } from "motion/react";
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
} from "./layers";

export default function MotionExperiment() {
  const [layers, setLayers] = useState(INITIAL_LAYERS);

  function handleAction(action: Action) {
    const fresh = freshLayersFor(action);
    setLayers((current) => applyAction(current, action, fresh));
  }

  return (
    <main>
      <h1>Experimento — Motion</h1>
      <p className="hint">motion/react · spring declarativo · AnimatePresence para saída</p>

      <Controls count={layers.length} onAction={handleAction} />

      <div className="stage" style={{ width: STAGE_WIDTH, height: STAGE_HEIGHT }}>
        {/* initial={false}: as camadas iniciais aparecem já no lugar, sem animação de entrada. */}
        <AnimatePresence initial={false}>
          {layers.map((layer, index) => {
            const y = targetY(index);
            return (
              <motion.div
                key={layer.id}
                className="layer"
                style={{
                  left: (STAGE_WIDTH - LAYER_WIDTH) / 2,
                  width: LAYER_WIDTH,
                  height: LAYER_HEIGHT,
                  background: layer.color,
                  zIndex: index,
                }}
                initial={{ y: y + ENTER_OFFSET_Y, rotate: ENTER_ROTATION, opacity: 0 }}
                animate={{ x: 0, y, rotate: 0, opacity: 1 }}
                exit={{
                  x: EXIT_OFFSET_X,
                  rotate: EXIT_ROTATION,
                  opacity: 0,
                  transition: { duration: EXIT_DURATION_S },
                }}
                transition={{ type: "spring", ...SPRING }}
              >
                {layer.label}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </main>
  );
}
