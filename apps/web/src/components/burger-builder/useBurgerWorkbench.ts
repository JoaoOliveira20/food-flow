"use client";

import { useRef, type Dispatch, type PointerEvent } from "react";
import { findBunVariant, type BuilderCatalog } from "@/burger/catalog";
import { placeDraggedItem, type Composition, type CompositionAction } from "@/burger/composition";
import { computeStackLayout, scaleStackToStage } from "@/burger/stackLayout";
import { useElementSize } from "@/hooks/useElementSize";
import { useTransientMessage } from "@/hooks/useTransientMessage";
import type { DragState } from "@/hooks/useCompositionDrag";
import { dragHintMessage } from "./dragMessages";
import { useBuilderDrag } from "./useBuilderDrag";

function compositionWithDragPreview(composition: Composition, drag: DragState | null): Composition {
  if (!drag || drag.insertionIndex === null) return composition;
  return { ...composition, layers: placeDraggedItem(composition, drag.source, drag.insertionIndex) };
}

type WorkbenchOptions = {
  catalog: BuilderCatalog;
  composition: Composition;
  dispatch: Dispatch<CompositionAction>;
};

export function useBurgerWorkbench({ catalog, composition, dispatch }: WorkbenchOptions) {
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
  const stageMessage = drag ? dragHintMessage(catalog, drag, displayedComposition.layers, bunName) : message;

  function startDraggingLayer(event: PointerEvent, instanceId: string) {
    const layer = layout.layers.find((item) => item.key === instanceId);
    const instance = composition.layers.find((item) => item.instanceId === instanceId);
    if (layer && instance) startLayerDrag(event, layer, instance.ingredientId);
  }

  return {
    stageRef,
    drag,
    layout,
    stackScale,
    stageMessage,
    showMessage,
    startDraggingLayer,
    startIngredientDrag,
    attachGhostElement,
  };
}

export type BurgerWorkbenchState = ReturnType<typeof useBurgerWorkbench>;
