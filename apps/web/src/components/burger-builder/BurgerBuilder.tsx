"use client";

import { useReducer, useRef, type PointerEvent } from "react";
import { findBunVariant, findIngredient, type BuilderCatalog, type CompositionPreset } from "@/burger/catalog";
import {
  compositionReducer,
  createInitialComposition,
  createInstanceId,
  createRecipeInstanceIds,
  hasChangedSinceAppliedRecipe,
  hasReachedLayerLimit,
  matchesRecipe,
  placeDraggedItem,
  type Composition,
  type CompositionRecipe,
} from "@/burger/composition";
import { computeStackLayout, scaleStackToStage } from "@/burger/stackLayout";
import { useElementSize } from "@/hooks/useElementSize";
import { useTransientMessage } from "@/hooks/useTransientMessage";
import type { DragState } from "@/hooks/useCompositionDrag";
import { BuilderHeader } from "./BuilderHeader";
import { BunPicker } from "./BunPicker";
import { BurgerStage } from "./BurgerStage";
import { DragGhost } from "./DragGhost";
import { dragHintMessage } from "./dragMessages";
import { IngredientPanel } from "./IngredientPanel";
import { PresetPicker } from "./PresetPicker";
import { SelectionToolbar } from "./SelectionToolbar";
import { useBuilderDrag } from "./useBuilderDrag";
import styles from "./burgerBuilder.module.css";

function compositionWithDragPreview(composition: Composition, drag: DragState | null): Composition {
  if (!drag || drag.insertionIndex === null) return composition;
  return { ...composition, layers: placeDraggedItem(composition, drag.source, drag.insertionIndex) };
}

function initialCompositionOf(catalog: BuilderCatalog): Composition {
  return createInitialComposition(catalog.initialRecipe, catalog.maxLayers);
}

type BurgerBuilderProps = {
  catalog: BuilderCatalog;
};

export function BurgerBuilder({ catalog }: BurgerBuilderProps) {
  const [composition, dispatch] = useReducer(compositionReducer, catalog, initialCompositionOf);
  const stageRef = useRef<HTMLDivElement>(null);
  const stageSize = useElementSize(stageRef);
  const { message, showMessage } = useTransientMessage();
  const bunName = findBunVariant(catalog, composition.bunVariantId).name.toLowerCase();

  const committedStackScale = stageSize ? scaleStackToStage(computeStackLayout(composition, catalog), stageSize) : null;
  const { drag, startLayerDrag, startIngredientDrag, attachGhostElement } = useBuilderDrag({
    stageRef,
    composition,
    catalog,
    dispatch,
    stackScale: committedStackScale,
    bunName,
    showMessage,
  });

  const displayedComposition = compositionWithDragPreview(composition, drag);
  const layout = computeStackLayout(displayedComposition, catalog);
  const stackScale = stageSize ? scaleStackToStage(layout, stageSize) : null;
  const isFull = hasReachedLayerLimit(composition);
  const selectedIndex = composition.layers.findIndex((layer) => layer.instanceId === composition.selectedInstanceId);
  const selectedLayer = selectedIndex === -1 ? null : composition.layers[selectedIndex];
  const selectedIngredient = selectedLayer ? findIngredient(catalog, selectedLayer.ingredientId) : null;
  const stageMessage = drag ? dragHintMessage(catalog, drag, displayedComposition.layers, bunName) : message;
  const currentPresetId = catalog.presets.find((preset) => matchesRecipe(composition, preset))?.id ?? null;

  function pickIngredient(ingredientId: string) {
    if (composition.isReplacingSelection) {
      dispatch({ type: "replaceSelectedLayer", ingredientId, instanceId: createInstanceId() });
    } else {
      dispatch({ type: "addIngredient", ingredientId, instanceId: createInstanceId() });
    }
  }

  function startDraggingLayer(event: PointerEvent, instanceId: string) {
    const layer = layout.layers.find((item) => item.key === instanceId);
    const instance = composition.layers.find((item) => item.instanceId === instanceId);
    if (layer && instance) startLayerDrag(event, layer, instance.ingredientId);
  }

  function applyRecipe(recipe: CompositionRecipe) {
    dispatch({ type: "applyRecipe", recipe, instanceIds: createRecipeInstanceIds(recipe) });
  }

  function applyPreset(preset: CompositionPreset) {
    applyRecipe(preset);
    showMessage(`✓ Preset ${preset.name} aplicado.`);
  }

  return (
    <div className={styles.page}>
      <BuilderHeader onReset={() => applyRecipe(catalog.initialRecipe)} />

      <main className={styles.main}>
        <IngredientPanel
          ingredients={catalog.ingredients}
          replacedIngredientName={composition.isReplacingSelection ? (selectedIngredient?.name ?? null) : null}
          isDisabled={!composition.isReplacingSelection && isFull}
          onPickIngredient={pickIngredient}
          onIngredientPointerDown={startIngredientDrag}
        />

        <section className={styles.center}>
          <div
            ref={stageRef}
            className={styles.stage}
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
              isReplacing={composition.isReplacingSelection}
              onMove={(direction) => dispatch({ type: "moveLayer", instanceId: selectedLayer.instanceId, direction })}
              onDuplicate={() =>
                dispatch({
                  type: "duplicateLayer",
                  instanceId: selectedLayer.instanceId,
                  copyInstanceId: createInstanceId(),
                })
              }
              onToggleReplacing={() => dispatch({ type: "toggleReplacing" })}
              onRemove={() => dispatch({ type: "removeLayer", instanceId: selectedLayer.instanceId })}
              onClose={() => dispatch({ type: "clearSelection" })}
            />
          ) : (
            <p className={styles.hint}>
              {isFull
                ? `Limite de ${composition.maxLayers} ingredientes atingido.`
                : "Toque em uma camada para editá-la ou arraste-a para mudar a ordem."}
            </p>
          )}
        </section>

        <BunPicker
          bunVariants={catalog.bunVariants}
          selectedBunVariantId={composition.bunVariantId}
          onSelectBunVariant={(bunVariantId) => dispatch({ type: "selectBunVariant", bunVariantId })}
        />

        <PresetPicker
          catalog={catalog}
          currentPresetId={currentPresetId}
          requiresConfirmation={hasChangedSinceAppliedRecipe(composition)}
          onApplyPreset={applyPreset}
        />
      </main>

      {drag && <DragGhost catalog={catalog} drag={drag} attachElement={attachGhostElement} />}
    </div>
  );
}
