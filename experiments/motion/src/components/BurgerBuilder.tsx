"use client";

// Tela do montador: estado, painéis, palco e arraste.
//
// Arquivo IDÊNTICO nos três experimentos. Toda a animação fica em
// ./BurgerStage.tsx, que é o único componente específico de cada biblioteca.
//
// Durante o arraste, o palco recebe uma composição PRÉVIA (a ordem que
// resultaria da soltura). Assim, "abrir espaço" para a camada arrastada é
// apenas mais uma reorganização, animada por cada biblioteca do seu jeito.

import { useEffect, useReducer, useRef, useState, type PointerEvent } from "react";
import {
  compositionReducer,
  createUid,
  INITIAL_COMPOSITION,
  INITIAL_INGREDIENTS,
  MAX_LAYERS,
  placeDragged,
  type LayerInstance,
} from "@/burger/composition";
import { getBunVariant, getIngredient } from "@/burger/ingredients";
import { computeLayout, fitScale } from "@/burger/layout";
import { useCompositionDrag } from "@/burger/useCompositionDrag";
import { useElementSize } from "@/burger/useElementSize";
import { BunPicker } from "./BunPicker";
import { BurgerStage } from "./BurgerStage";
import { DragGhost } from "./DragGhost";
import { IngredientPanel } from "./IngredientPanel";
import { SelectionBar } from "./SelectionBar";
import styles from "./builder.module.css";

const STATUS_DURATION_MS = 2500;

type BurgerBuilderProps = {
  libraryName: string;
};

// "entre Carne e Tomate" — vizinhos de uma camada na ordem da base para o topo.
function describeSlot(layers: LayerInstance[], uid: string, bunName: string): string {
  const index = layers.findIndex((layer) => layer.uid === uid);
  const below = index > 0 ? getIngredient(layers[index - 1].ingredientId).name : `pão inferior ${bunName}`;
  const above = index < layers.length - 1 ? getIngredient(layers[index + 1].ingredientId).name : "pão superior";
  return `entre ${below} e ${above}`;
}

export function BurgerBuilder({ libraryName }: BurgerBuilderProps) {
  const [state, dispatch] = useReducer(compositionReducer, INITIAL_COMPOSITION);
  const [status, setStatus] = useState<{ text: string } | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const stageSize = useElementSize(stageRef);
  const bunName = getBunVariant(state.bunId).name.toLowerCase();

  // O fit usado pelo arraste é o da composição confirmada; a prévia pode
  // mudar a escala, mas não deve mudar o cálculo do índice no meio do gesto.
  const committedFit = stageSize ? fitScale(computeLayout(state), stageSize) : null;

  function announce(text: string) {
    setStatus({ text }); // objeto novo reinicia o timer mesmo com texto repetido
  }

  const { drag, startLayerDrag, startMenuDrag, ghostRef } = useCompositionDrag({
    stageRef,
    composition: state,
    fit: committedFit,
    onStart(source) {
      if (source.kind === "layer" && state.selectedUid !== source.uid) dispatch({ type: "select", uid: source.uid });
    },
    onDrop(source, index, ingredientId) {
      dispatch({ type: "place", source, index });
      const layers = placeDragged(state.layers, source, index);
      const name = getIngredient(ingredientId).name;
      announce(`✓ ${name} ${source.kind === "new" ? "adicionado" : "movido"} ${describeSlot(layers, source.uid, bunName)}.`);
    },
    onCancel() {
      announce("↺ Arraste cancelado. Nada foi alterado.");
    },
  });

  useEffect(() => {
    if (!status) return;
    const timer = window.setTimeout(() => setStatus(null), STATUS_DURATION_MS);
    return () => window.clearTimeout(timer);
  }, [status]);

  // Composição exibida: a confirmada, ou a prévia durante o arraste.
  const shown =
    drag && drag.index !== null ? { ...state, layers: placeDragged(state.layers, drag.source, drag.index) } : state;
  const layout = computeLayout(shown);
  const fit = stageSize ? fitScale(layout, stageSize) : null;
  const isFull = state.layers.length >= MAX_LAYERS;
  const selectedIndex = state.layers.findIndex((layer) => layer.uid === state.selectedUid);
  const selected = selectedIndex === -1 ? null : state.layers[selectedIndex];

  let dragMessage: string | null = null;
  if (drag) {
    dragMessage =
      drag.index === null
        ? "✕ Fora do hambúrguer: soltar cancela."
        : `↕ Soltar ${describeSlot(shown.layers, drag.source.uid, bunName)}`;
  }

  // IDs são sempre criados fora do reducer (createUid), para mantê-lo puro.
  function handlePick(ingredientId: string) {
    if (state.replacing) dispatch({ type: "replace", ingredientId, newUid: createUid() });
    else dispatch({ type: "add", ingredientId, uid: createUid() });
  }

  function handleLayerPointerDown(event: PointerEvent, key: string) {
    const layer = layout.layers.find((item) => item.key === key);
    const instance = state.layers.find((item) => item.uid === key);
    if (layer && instance) startLayerDrag(event, layer, instance.ingredientId);
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.brand}>
          <svg className={styles.logo} viewBox="0 0 32 32" aria-hidden="true">
            <path d="M4 13c0-5 5.4-9 12-9s12 4 12 9H4z" />
            <rect x="3" y="15" width="26" height="3" rx="1.5" />
            <path d="M4 20h24v2a6 6 0 0 1-6 6H10a6 6 0 0 1-6-6v-2z" />
          </svg>
          <span className={styles.title}>Food Flow</span>
          <span className={styles.chip}>Experimento · {libraryName}</span>
        </div>
        <button
          className={styles.resetButton}
          onClick={() => dispatch({ type: "reset", uids: INITIAL_INGREDIENTS.map(() => createUid()) })}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M20 12a8 8 0 1 1-2.34-5.66M20 4v5h-5" />
          </svg>
          Resetar
        </button>
      </header>

      <main className={styles.main}>
        <IngredientPanel
          replacing={state.replacing}
          replacingName={selected ? getIngredient(selected.ingredientId).name : null}
          disabled={!state.replacing && isFull}
          onPick={handlePick}
          onDragStart={state.replacing ? undefined : startMenuDrag}
        />

        <section className={styles.center}>
          <div
            ref={stageRef}
            className={styles.stage}
            onClick={() => state.selectedUid && dispatch({ type: "select", uid: null })}
          >
            {fit !== null && (
              <BurgerStage
                layout={layout}
                fit={fit}
                bunId={state.bunId}
                selectedUid={state.selectedUid}
                draggingKey={drag?.source.uid ?? null}
                onSelect={(uid) => dispatch({ type: "select", uid })}
                onLayerPointerDown={handleLayerPointerDown}
              />
            )}
            <p className={styles.status} role="status" aria-live="polite">
              {dragMessage ?? status?.text ?? ""}
            </p>
          </div>

          {selected ? (
            <SelectionBar
              ingredient={getIngredient(selected.ingredientId)}
              canMoveUp={selectedIndex < state.layers.length - 1}
              canMoveDown={selectedIndex > 0}
              canDuplicate={!isFull}
              replacing={state.replacing}
              onMove={(direction) => dispatch({ type: "move", uid: selected.uid, direction })}
              onDuplicate={() => dispatch({ type: "duplicate", uid: selected.uid, newUid: createUid() })}
              onToggleReplace={() => dispatch({ type: "toggleReplacing" })}
              onRemove={() => dispatch({ type: "remove", uid: selected.uid })}
              onClose={() => dispatch({ type: "select", uid: null })}
            />
          ) : (
            <p className={styles.hint}>
              {isFull
                ? `Limite de ${MAX_LAYERS} ingredientes atingido.`
                : "Toque em uma camada para editá-la ou arraste-a para mudar a ordem."}
            </p>
          )}
        </section>

        <BunPicker bunId={state.bunId} onChange={(bunId) => dispatch({ type: "setBun", bunId })} />
      </main>

      {drag && <DragGhost drag={drag} ghostRef={ghostRef} />}
    </div>
  );
}
