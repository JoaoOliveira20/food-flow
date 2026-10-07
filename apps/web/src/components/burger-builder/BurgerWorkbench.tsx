"use client";

import type { Dispatch } from "react";
import { findIngredient, type BuilderCatalog } from "@/burger/catalog";
import { createInstanceId, hasReachedLayerLimit, type Composition, type CompositionAction } from "@/burger/composition";
import { BurgerStage } from "./BurgerStage";
import { DragGhost } from "./DragGhost";
import { SelectionToolbar } from "./SelectionToolbar";
import type { BurgerWorkbenchState } from "./useBurgerWorkbench";
import styles from "./burgerBuilder.module.css";

type BurgerWorkbenchProps = {
  workbench: BurgerWorkbenchState;
  catalog: BuilderCatalog;
  composition: Composition;
  dispatch: Dispatch<CompositionAction>;
  canReplace?: boolean;
  hint?: string;
  stageClassName?: string;
};

export function BurgerWorkbench({
  workbench,
  catalog,
  composition,
  dispatch,
  canReplace = true,
  stageClassName = "",
  hint = "Toque em uma camada para editá-la ou arraste-a para mudar a ordem.",
}: BurgerWorkbenchProps) {
  const { stageRef, drag, layout, stackScale, stageMessage, startDraggingLayer, attachGhostElement } = workbench;
  const isFull = hasReachedLayerLimit(composition);
  const selectedIndex = composition.layers.findIndex((layer) => layer.instanceId === composition.selectedInstanceId);
  const selectedLayer = selectedIndex === -1 ? null : composition.layers[selectedIndex];
  const selectedIngredient = selectedLayer ? findIngredient(catalog, selectedLayer.ingredientId) : null;

  return (
    <section className={styles.center}>
      <div
        ref={stageRef}
        className={`${styles.stage} ${stageClassName}`}
        onClick={() => composition.selectedInstanceId && dispatch({ type: "clearSelection" })}
      >
        {stackScale !== null && (
          <BurgerStage
            layout={layout}
            stackScale={stackScale}
            bunVariantId={composition.bunVariantId}
            selectedInstanceId={composition.selectedInstanceId}
            draggedInstanceId={drag?.source.instanceId ?? null}
            onSelectLayer={(instanceId) => dispatch({ type: "toggleLayerSelection", instanceId })}
            onLayerPointerDown={startDraggingLayer}
          />
        )}
        <p className={styles.status} role="status" aria-live="polite">
          {stageMessage ?? ""}
        </p>
      </div>

      {selectedLayer && selectedIngredient ? (
        <SelectionToolbar
          ingredient={selectedIngredient}
          canMoveUp={selectedIndex < composition.layers.length - 1}
          canMoveDown={selectedIndex > 0}
          canDuplicate={!isFull}
          canReplace={canReplace}
          isReplacing={composition.isReplacingSelection}
          onMove={(direction) => dispatch({ type: "moveLayer", instanceId: selectedLayer.instanceId, direction })}
          onDuplicate={() =>
            dispatch({ type: "duplicateLayer", instanceId: selectedLayer.instanceId, copyInstanceId: createInstanceId() })
          }
          onToggleReplacing={() => dispatch({ type: "toggleReplacing" })}
          onRemove={() => dispatch({ type: "removeLayer", instanceId: selectedLayer.instanceId })}
          onClose={() => dispatch({ type: "clearSelection" })}
        />
      ) : (
        <p className={styles.hint}>{isFull ? `Limite de ${composition.maxLayers} ingredientes atingido.` : hint}</p>
      )}

      {drag && <DragGhost catalog={catalog} drag={drag} attachElement={attachGhostElement} />}
    </section>
  );
}
