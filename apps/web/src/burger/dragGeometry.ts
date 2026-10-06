import type { BuilderCatalog } from "./catalog";
import { placeDraggedItem, type Composition, type DragSource } from "./composition";
import { hitAreaCenter, computeStackLayout, scaleStackToStage, STACK_BASELINE_RATIO } from "./stackLayout";

const STAGE_DROP_MARGIN = 16;
const GHOST_SCALE = 0.45;
const GHOST_MOUSE_GAP = 18;
const GHOST_TOUCH_GAP = 40;

export type Point = {
  x: number;
  y: number;
};

export type GhostPlacement = {
  size: { width: number; height: number };
  offset: Point;
};

export function isPointNearStage(point: Point, stage: DOMRect): boolean {
  return (
    point.x >= stage.left - STAGE_DROP_MARGIN &&
    point.x <= stage.right + STAGE_DROP_MARGIN &&
    point.y >= stage.top - STAGE_DROP_MARGIN &&
    point.y <= stage.bottom + STAGE_DROP_MARGIN
  );
}

export function stackBaselineY(stage: DOMRect): number {
  return stage.bottom - stage.height * STACK_BASELINE_RATIO;
}

type InsertionQuery = {
  composition: Composition;
  catalog: BuilderCatalog;
  source: DragSource;
  currentIndex: number | null;
  pointer: Point;
  stage: DOMRect;
};

export function insertionIndexAt({
  composition,
  catalog,
  source,
  currentIndex,
  pointer,
  stage,
}: InsertionQuery): number | null {
  if (!isPointNearStage(pointer, stage)) return null;
  const displayedLayers =
    currentIndex === null ? composition.layers : placeDraggedItem(composition, source, currentIndex);
  const displayedLayout = computeStackLayout({ ...composition, layers: displayedLayers }, catalog);
  const scale = scaleStackToStage(displayedLayout, { width: stage.width, height: stage.height });
  const pointerHeight = (stackBaselineY(stage) - pointer.y) / scale;
  return displayedLayout.layers.filter(
    (layer) => layer.hitArea && layer.key !== source.instanceId && pointerHeight > hitAreaCenter(layer.hitArea),
  ).length;
}

export function placeGhostNearPointer(pointerType: string, width: number, height: number): GhostPlacement {
  const size = { width: width * GHOST_SCALE, height: height * GHOST_SCALE };
  const offset =
    pointerType === "touch"
      ? { x: -size.width / 2, y: -size.height - GHOST_TOUCH_GAP }
      : { x: GHOST_MOUSE_GAP, y: -size.height / 2 };
  return { size, offset };
}
