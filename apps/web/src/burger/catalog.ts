import type { CompositionRecipe } from "./composition";

export type ImageSize = {
  width: number;
  height: number;
};

export type StackShape = {
  displayWidth: number;
  restingSurfaceRatio: number;
  sinkRatio: number;
};

export type Ingredient = {
  id: string;
  name: string;
  imagePath: string;
  imageSize: ImageSize;
  shape: StackShape;
};

export type BunImage = {
  imagePath: string;
  imageSize: ImageSize;
};

export type BunVariant = {
  id: string;
  name: string;
  topBun: BunImage;
  bottomBun: BunImage;
};

export type CompositionPreset = CompositionRecipe & {
  id: string;
  name: string;
};

export type BuilderCatalog = {
  maxLayers: number;
  ingredients: Ingredient[];
  bunVariants: BunVariant[];
  presets: CompositionPreset[];
  initialRecipe: CompositionRecipe;
};

export const TOP_BUN_SHAPE: StackShape = { displayWidth: 318, restingSurfaceRatio: 1, sinkRatio: 0.14 };
export const BOTTOM_BUN_SHAPE: StackShape = { displayWidth: 300, restingSurfaceRatio: 0.5, sinkRatio: 0 };

export function findIngredient(catalog: BuilderCatalog, ingredientId: string): Ingredient {
  const ingredient = catalog.ingredients.find((item) => item.id === ingredientId);
  if (!ingredient) throw new Error(`Unknown ingredient: ${ingredientId}`);
  return ingredient;
}

export function findBunVariant(catalog: BuilderCatalog, bunVariantId: string): BunVariant {
  const variant = catalog.bunVariants.find((item) => item.id === bunVariantId);
  if (!variant) throw new Error(`Unknown bun variant: ${bunVariantId}`);
  return variant;
}
