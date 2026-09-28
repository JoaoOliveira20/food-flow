"use client";

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type RefObject } from "react";
import { createInstanceId, hasReachedLayerLimit, type Composition, type DragSource } from "@/burger/composition";
import {
  insertionIndexAt,
  placeGhostNearPointer,
  type GhostPlacement,
  type Point,
} from "@/burger/dragGeometry";
import { findIngredient } from "@/burger/ingredientCatalog";
import type { PositionedLayer } from "@/burger/stackLayout";

const DRAG_START_DISTANCE = 6;
const TOUCH_HOLD_DURATION_MS = 280;
const TOUCH_HOLD_TOLERANCE = 10;

export type DragState = GhostPlacement & {
  source: DragSource;
  ingredientId: string;
  insertionIndex: number | null;
};

type PendingDrag = Omit<DragState, "insertionIndex"> & {
  pointerId: number;
  originElement: Element;
  startPoint: Point;
  requiresHold: boolean;
  isHoldComplete: boolean;
  holdTimer: number | null;
};

type DragStartOptions = Pick<PendingDrag, "source" | "ingredientId" | "size" | "offset" | "requiresHold">;

type CompositionDragOptions = {
  stageRef: RefObject<HTMLElement | null>;
  composition: Composition;
  stackScale: number | null;
  onDragStart: (source: DragSource) => void;
  onDrop: (source: DragSource, index: number, ingredientId: string) => void;
  onCancel: () => void;
};

function tryCapturePointer(element: Element, pointerId: number): boolean {
  try {
    element.setPointerCapture(pointerId);
    return true;
  } catch {
    return false;
  }
}

export function useCompositionDrag(options: CompositionDragOptions) {
  const [drag, setDrag] = useState<DragState | null>(null);
  const latestOptions = useRef(options);
  const activeDrag = useRef<DragState | null>(null);
  const pendingDrag = useRef<PendingDrag | null>(null);
  const pointer = useRef<Point>({ x: 0, y: 0 });
  const ghostElement = useRef<HTMLDivElement | null>(null);
  const detachListeners = useRef<(() => void) | null>(null);

  useEffect(() => {
    latestOptions.current = options;
  });

  useEffect(() => () => detachListeners.current?.(), []);

  function findInsertionIndex(state: DragState): number | null {
    const stage = latestOptions.current.stageRef.current;
    if (!stage) return null;
    return insertionIndexAt({
      composition: latestOptions.current.composition,
      source: state.source,
      currentIndex: state.insertionIndex,
      pointer: pointer.current,
      stage: stage.getBoundingClientRect(),
    });
  }

  function moveGhostToPointer() {
    const state = activeDrag.current;
    if (!ghostElement.current || !state) return;
    const { x, y } = pointer.current;
    ghostElement.current.style.transform = `translate(${x + state.offset.x}px, ${y + state.offset.y}px)`;
  }

  function updateDrag(next: DragState | null) {
    activeDrag.current = next;
    setDrag(next);
  }

  function beginDrag(pending: PendingDrag) {
    const { source, ingredientId, size, offset } = pending;
    const state: DragState = { source, ingredientId, size, offset, insertionIndex: null };
    state.insertionIndex = findInsertionIndex(state);
    tryCapturePointer(pending.originElement, pending.pointerId);
    document.documentElement.dataset.dragging = "";
    updateDrag(state);
    latestOptions.current.onDragStart(source);
  }

  function ignoreNextClickOn(element: Element | undefined) {
    const ignoreClick = (event: Event) => {
      if (!element || !(event.target instanceof Node) || !element.contains(event.target)) return;
      event.stopPropagation();
      event.preventDefault();
      window.removeEventListener("click", ignoreClick, { capture: true });
    };
    window.addEventListener("click", ignoreClick, { capture: true });
    window.setTimeout(() => window.removeEventListener("click", ignoreClick, { capture: true }), 0);
  }

  function finishDrag(shouldCommit: boolean) {
    const state = activeDrag.current;
    const originElement = pendingDrag.current?.originElement;
    detachListeners.current?.();
    if (!state) return;
    updateDrag(null);
    if (shouldCommit && state.insertionIndex !== null) {
      latestOptions.current.onDrop(state.source, state.insertionIndex, state.ingredientId);
    } else {
      latestOptions.current.onCancel();
    }
    ignoreNextClickOn(originElement);
  }

  function handlePendingMove(pending: PendingDrag, event: PointerEvent) {
    const distance = Math.hypot(event.clientX - pending.startPoint.x, event.clientY - pending.startPoint.y);
    if (pending.requiresHold && !pending.isHoldComplete) {
      if (distance > TOUCH_HOLD_TOLERANCE) detachListeners.current?.();
      return;
    }
    if (pending.isHoldComplete || distance > DRAG_START_DISTANCE) beginDrag(pending);
  }

  function handleActiveMove(state: DragState) {
    moveGhostToPointer();
    const insertionIndex = findInsertionIndex(state);
    if (insertionIndex !== state.insertionIndex) updateDrag({ ...state, insertionIndex });
  }

  function attachListeners() {
    const handlePointerMove = (event: PointerEvent) => {
      const pending = pendingDrag.current;
      if (!pending || event.pointerId !== pending.pointerId) return;
      pointer.current = { x: event.clientX, y: event.clientY };
      if (activeDrag.current) handleActiveMove(activeDrag.current);
      else handlePendingMove(pending, event);
    };
    const handlePointerUp = (event: PointerEvent) => {
      if (event.pointerId === pendingDrag.current?.pointerId) finishDrag(true);
    };
    const cancelDrag = () => finishDrag(false);
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && activeDrag.current) finishDrag(false);
    };
    const preventScrollWhileDragging = (event: TouchEvent) => {
      if (activeDrag.current || pendingDrag.current?.isHoldComplete) event.preventDefault();
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", cancelDrag);
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("blur", cancelDrag);
    document.addEventListener("touchmove", preventScrollWhileDragging, { passive: false });

    detachListeners.current = () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", cancelDrag);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("blur", cancelDrag);
      document.removeEventListener("touchmove", preventScrollWhileDragging);
      if (pendingDrag.current?.holdTimer) window.clearTimeout(pendingDrag.current.holdTimer);
      pendingDrag.current = null;
      delete document.documentElement.dataset.dragging;
      detachListeners.current = null;
    };
  }

  function prepareDrag(event: ReactPointerEvent, options: DragStartOptions) {
    if (event.button !== 0 || !event.isPrimary) return;
    if (activeDrag.current) finishDrag(false);
    detachListeners.current?.();
    pointer.current = { x: event.clientX, y: event.clientY };
    const pending: PendingDrag = {
      ...options,
      pointerId: event.pointerId,
      originElement: event.currentTarget,
      startPoint: { x: event.clientX, y: event.clientY },
      isHoldComplete: false,
      holdTimer: null,
    };
    if (pending.requiresHold) {
      pending.holdTimer = window.setTimeout(() => {
        pending.isHoldComplete = true;
      }, TOUCH_HOLD_DURATION_MS);
    }
    pendingDrag.current = pending;
    attachListeners();
  }

  function startLayerDrag(event: ReactPointerEvent, layer: PositionedLayer, ingredientId: string) {
    const { stackScale } = latestOptions.current;
    if (!stackScale) return;
    prepareDrag(event, {
      source: { kind: "existingLayer", instanceId: layer.key },
      ingredientId,
      ...placeGhostNearPointer(event.pointerType, layer.width * stackScale, layer.height * stackScale),
      requiresHold: false,
    });
  }

  function startIngredientDrag(event: ReactPointerEvent, ingredientId: string) {
    const { stackScale, composition } = latestOptions.current;
    if (!stackScale || hasReachedLayerLimit(composition.layers)) return;
    const { shape, imageSize } = findIngredient(ingredientId);
    const width = shape.displayWidth * stackScale;
    prepareDrag(event, {
      source: { kind: "newIngredient", instanceId: createInstanceId(), ingredientId },
      ingredientId,
      ...placeGhostNearPointer(event.pointerType, width, (width * imageSize.height) / imageSize.width),
      requiresHold: event.pointerType === "touch",
    });
  }

  function attachGhostElement(element: HTMLDivElement | null) {
    ghostElement.current = element;
    moveGhostToPointer();
  }

  return { drag, startLayerDrag, startIngredientDrag, attachGhostElement };
}
