"use client";

// Experimento: GSAP (`gsap` + `@gsap/react`).
//
// Modelo: imperativo, baseado em tweens com duração e ease. O React só
// renderiza os elementos; após cada mudança de lista, `useGSAP` compara o
// estado anterior com o atual e cria os tweens de entrada/reposicionamento.
//
// Diferença estrutural: GSAP não sabe quando o React vai desmontar um
// elemento. Para animar a saída, camadas removidas vão para `leaving` e
// continuam renderizadas até o tween terminar (onComplete → "leaveDone").

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useReducer, useRef } from "react";
import { Controls } from "./controls";
import "./prototipo.css";
import {
  applyAction,
  ENTER_OFFSET_Y,
  ENTER_ROTATION,
  EXIT_DURATION_S,
  EXIT_OFFSET_X,
  EXIT_ROTATION,
  INITIAL_LAYERS,
  freshLayersFor,
  LAYER_HEIGHT,
  LAYER_WIDTH,
  STAGE_HEIGHT,
  STAGE_WIDTH,
  targetY,
  type Action,
  type Layer,
} from "./layers";

gsap.registerPlugin(useGSAP);

// GSAP não tem spring nativo. "back.out" ultrapassa o alvo uma vez e volta,
// aproximando a acomodação da mola usada nos outros experimentos.
const ENTER_TWEEN = { duration: 0.7, ease: "back.out(1.7)" };
const MOVE_TWEEN = { duration: 0.5, ease: "back.out(1.4)" };

type State = { layers: Layer[]; leaving: Layer[] };
type Event = { type: "action"; action: Action; fresh: Layer[] } | { type: "leaveDone"; id: number };

function reducer(state: State, event: Event): State {
  if (event.type === "leaveDone") {
    return { ...state, leaving: state.leaving.filter((layer) => layer.id !== event.id) };
  }
  const layers = applyAction(state.layers, event.action, event.fresh);
  const removed = state.layers.filter((layer) => !layers.includes(layer));
  return { layers, leaving: [...state.leaving, ...removed] };
}

export default function GsapExperiment() {
  const [{ layers, leaving }, dispatch] = useReducer(reducer, { layers: INITIAL_LAYERS, leaving: [] });

  const nodes = useRef(new Map<number, HTMLDivElement>());
  // Último alvo y enviado a cada camada; ausência = camada ainda não posicionada.
  const lastTarget = useRef(new Map<number, number>());
  const exiting = useRef(new Set<number>());
  const hasMounted = useRef(false);

  function handleAction(action: Action) {
    dispatch({ type: "action", action, fresh: freshLayersFor(action) });
  }

  useGSAP(
    () => {
      layers.forEach((layer, index) => {
        const node = nodes.current.get(layer.id);
        if (!node) return;
        const y = targetY(index);
        const previous = lastTarget.current.get(layer.id);
        if (previous === y) return;
        lastTarget.current.set(layer.id, y);

        if (previous === undefined && !hasMounted.current) {
          // Camadas iniciais: posiciona sem animar.
          gsap.set(node, { y });
        } else if (previous === undefined) {
          gsap.fromTo(
            node,
            { y: y + ENTER_OFFSET_Y, rotation: ENTER_ROTATION, opacity: 0 },
            { y, rotation: 0, opacity: 1, ...ENTER_TWEEN },
          );
        } else {
          // overwrite "auto" mata apenas a propriedade y de tweens em andamento
          // (rotação/opacidade da entrada continuam). A velocidade atual NÃO é
          // preservada: o novo tween parte do valor atual com velocidade zero.
          gsap.to(node, { y, ...MOVE_TWEEN, overwrite: "auto" });
        }
      });

      leaving.forEach((layer) => {
        const node = nodes.current.get(layer.id);
        if (!node || exiting.current.has(layer.id)) return;
        exiting.current.add(layer.id);
        lastTarget.current.delete(layer.id);
        gsap.to(node, {
          x: EXIT_OFFSET_X,
          rotation: EXIT_ROTATION,
          opacity: 0,
          duration: EXIT_DURATION_S,
          ease: "power1.in",
          overwrite: "auto",
          onComplete: () => {
            exiting.current.delete(layer.id);
            dispatch({ type: "leaveDone", id: layer.id });
          },
        });
      });

      hasMounted.current = true;

      // Chamado quando o contexto é revertido (desmontagem, incluindo a
      // desmontagem simulada do StrictMode). O revert desfaz os tweens, então
      // o controle manual também precisa ser zerado.
      return () => {
        lastTarget.current.clear();
        exiting.current.clear();
        hasMounted.current = false;
      };
    },
    { dependencies: [layers, leaving] },
  );

  function register(id: number) {
    return (node: HTMLDivElement | null) => {
      if (node) nodes.current.set(id, node);
      else nodes.current.delete(id);
    };
  }

  const renderLayer = (layer: Layer, zIndex: number) => (
    <div
      key={layer.id}
      ref={register(layer.id)}
      className="layer"
      style={{
        left: (STAGE_WIDTH - LAYER_WIDTH) / 2,
        width: LAYER_WIDTH,
        height: LAYER_HEIGHT,
        background: layer.color,
        zIndex,
      }}
    >
      {layer.label}
    </div>
  );

  return (
    <main>
      <h1>Experimento — GSAP</h1>
      <p className="hint">gsap + @gsap/react · tweens imperativos · saída gerenciada manualmente</p>

      <Controls count={layers.length} onAction={handleAction} />

      <div className="stage" style={{ width: STAGE_WIDTH, height: STAGE_HEIGHT }}>
        {layers.map((layer, index) => renderLayer(layer, index))}
        {/* Camadas saindo ficam acima para a saída ser visível. */}
        {leaving.map((layer) => renderLayer(layer, layers.length))}
      </div>
    </main>
  );
}
