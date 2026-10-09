"use client";

import type { Dispatch, RefObject } from "react";
import type { BuilderCatalog } from "@/burger/catalog";
import { placeDraggedItem, type Composition, type CompositionAction } from "@/burger/composition";
import { useCompositionDrag } from "@/hooks/useCompositionDrag";
import { DRAG_CANCELLED_MESSAGE, dropConfirmationMessage } from "./dragMessages";

type BuilderDragOptions = {
  stageRef: RefObject<HTMLElement | null>;
  composition: Composition;
  catalog: BuilderCatalog;
  dispatch: Dispatch<CompositionAction>;
  stackScale: number | null;
  bunName: string;
  showMessage: (text: string) => void;
};

export function useBuilderDrag({
  stageRef,
  composition,
  catalog,
  dispatch,
  stackScale,
  bunName,
  showMessage,
}: BuilderDragOptions) {
  return useCompositionDrag({
    stageRef,
    composition,
    catalog,
    stackScale,
    onDragStart(source) {
      const isAlreadySelected = composition.selectedInstanceId === source.instanceId;
      if (source.kind === "existingLayer" && !isAlreadySelected) {
        dispatch({ type: "toggleLayerSelection", instanceId: source.instanceId });
      }
    },
    onDrop(source, index, ingredientId) {
      dispatch({ type: "placeDraggedItem", source, index });
      const resultingLayers = placeDraggedItem(composition, source, index);
      showMessage(dropConfirmationMessage(catalog, source, ingredientId, resultingLayers, bunName));
    },
    onCancel() {
      showMessage(DRAG_CANCELLED_MESSAGE);
    },
  });
}
