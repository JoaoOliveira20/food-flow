import type { Composition } from "./composition";
import {
  BOTTOM_BUN_SHAPE,
  findBunVariant,
  findIngredient,
  TOP_BUN_SHAPE,
  type BuilderCatalog,
  type ImageSize,
  type StackShape,
} from "./catalog";

export const STACK_BASE_WIDTH = 340;
export const STACK_BASELINE_RATIO = 0.06;
const MAX_STACK_SCALE = 1.25;
const STAGE_WIDTH_USAGE = 0.92;
const STAGE_HEIGHT_USAGE = 0.86;
const MIN_HIT_AREA_HEIGHT = 18;

export type StageSize = {
  width: number;
  height: number;
};

export type HitArea = {
  bottom: number;
  height: number;
};

export type PositionedLayer = {
  key: string;
  kind: "bun" | "ingredient";
  name: string;
  imagePath: string;
  imageSize: ImageSize;
  width: number;
  height: number;
  bottom: number;
  zIndex: number;
  hitArea: HitArea | null;
};

export type StackLayout = {
  layers: PositionedLayer[];
  height: number;
};

type StackEntry = {
  key: string;
  kind: PositionedLayer["kind"];
  name: string;
  imagePath: string;
  imageSize: ImageSize;
  shape: StackShape;
};

function buildStackEntries(composition: Composition, catalog: BuilderCatalog): StackEntry[] {
  const bunVariant = findBunVariant(catalog, composition.bunVariantId);
  const ingredientEntries = composition.layers.map((layer): StackEntry => {
    const ingredient = findIngredient(catalog, layer.ingredientId);
    return {
      key: layer.instanceId,
      kind: "ingredient",
      name: ingredient.name,
      imagePath: ingredient.imagePath,
      imageSize: ingredient.imageSize,
      shape: ingredient.shape,
    };
  });
  return [
    { key: "bottom-bun", kind: "bun", name: `Pão inferior ${bunVariant.name}`, ...bunVariant.bottomBun, shape: BOTTOM_BUN_SHAPE },
    ...ingredientEntries,
    { key: "top-bun", kind: "bun", name: `Pão superior ${bunVariant.name}`, ...bunVariant.topBun, shape: TOP_BUN_SHAPE },
  ];
}

function hitAreaBetween(lowerSurface: number, upperSurface: number): HitArea {
  const height = Math.max(MIN_HIT_AREA_HEIGHT, upperSurface - lowerSurface);
  return { bottom: lowerSurface + (upperSurface - lowerSurface - height) / 2, height };
}

function hitAreaTop(hitArea: HitArea): number {
  return hitArea.bottom + hitArea.height;
}

function boundaryBetween(lower: HitArea, upper: HitArea): number {
  return (hitAreaTop(lower) + upper.bottom) / 2;
}

function separateHitAreas(layers: PositionedLayer[]): PositionedLayer[] {
  return layers.map((layer, index) => {
    if (!layer.hitArea) return layer;
    const below = layers[index - 1]?.hitArea;
    const above = layers[index + 1]?.hitArea;
    const bottom = below ? Math.max(layer.hitArea.bottom, boundaryBetween(below, layer.hitArea)) : layer.hitArea.bottom;
    const top = above ? Math.min(hitAreaTop(layer.hitArea), boundaryBetween(layer.hitArea, above)) : hitAreaTop(layer.hitArea);
    return { ...layer, hitArea: { bottom, height: top - bottom } };
  });
}

export function computeStackLayout(composition: Composition, catalog: BuilderCatalog): StackLayout {
  const layers: PositionedLayer[] = [];
  let restingSurface = 0;
  let stackHeight = 0;

  buildStackEntries(composition, catalog).forEach((entry, index) => {
    const { displayWidth, restingSurfaceRatio, sinkRatio } = entry.shape;
    const height = (displayWidth * entry.imageSize.height) / entry.imageSize.width;
    const bottom = Math.max(0, restingSurface - sinkRatio * height);
    const nextRestingSurface = bottom + restingSurfaceRatio * height;

    layers.push({
      key: entry.key,
      kind: entry.kind,
      name: entry.name,
      imagePath: entry.imagePath,
      imageSize: entry.imageSize,
      width: displayWidth,
      height,
      bottom,
      zIndex: index + 1,
      hitArea: entry.kind === "ingredient" ? hitAreaBetween(restingSurface, nextRestingSurface) : null,
    });

    restingSurface = Math.max(restingSurface, nextRestingSurface);
    stackHeight = Math.max(stackHeight, bottom + height);
  });

  return { layers: separateHitAreas(layers), height: stackHeight };
}

export function scaleStackToStage(layout: StackLayout, stage: StageSize): number {
  const scaleByWidth = (stage.width * STAGE_WIDTH_USAGE) / STACK_BASE_WIDTH;
  const scaleByHeight = (stage.height * STAGE_HEIGHT_USAGE) / layout.height;
  return Math.min(MAX_STACK_SCALE, scaleByWidth, scaleByHeight);
}

export function hitAreaCenter(hitArea: HitArea): number {
  return hitArea.bottom + hitArea.height / 2;
}
