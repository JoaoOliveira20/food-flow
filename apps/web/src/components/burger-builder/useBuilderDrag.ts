"use client";

import type { Dispatch, RefObject } from "react";
import { placeDraggedItem, type Composition, type CompositionAction } from "@/burger/composition";
import { useCompositionDrag } from "@/hooks/useCompositionDrag";
import { DRAG_CANCELLED_MESSAGE, dropConfirmationMessage } from "./dragMessages";

type BuilderDragOptions = {
  stageRef: RefObject<HTMLElement | null>;
  composition: Composition;
  dispatch: Dispatch<CompositionAction>;
  stackScale: number | null;
  bunName: string;
  showMessage: (text: string) => void;
};

export function useBuilderDrag({ stageRef, composition, dispatch, stackScale, bunName, showMessage }: BuilderDragOptions) {
  return useCompositionDrag({
    stageRef,
    composition,
    stackScale,
    onDragStart(source) {
      const isAlreadySelected = composition.selectedInstanceId === source.instanceId;
      if (source.kind === "existingLayer" && !isAlreadySelected) {
        dispatch({ type: "toggleLayerSelection", instanceId: source.instanceId });
      }
    },
    onDrop(source, index, ingredientId) {
      dispatch({ type: "placeDraggedItem", source, index });
      const resultingLayers = placeDraggedItem(composition.layers, source, index);
      showMessage(dropConfirmationMessage(source, ingredientId, resultingLayers, bunName));
    },
    onCancel() {
      showMessage(DRAG_CANCELLED_MESSAGE);
    },
  });
}
