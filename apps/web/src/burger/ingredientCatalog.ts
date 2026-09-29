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

const ingredientImagePath = (fileName: string) => `/assets/ingredients/${fileName}.png`;

const SAUCE_SHAPE: StackShape = { displayWidth: 256, restingSurfaceRatio: 0.95, sinkRatio: 0.78 };

export const INGREDIENTS: Ingredient[] = [
  {
    id: "beef",
    name: "Carne",
    imagePath: ingredientImagePath("beef-patty"),
    imageSize: { width: 336, height: 198 },
    shape: { displayWidth: 292, restingSurfaceRatio: 0.5, sinkRatio: 0.1 },
  },
  {
    id: "cheddar",
    name: "Cheddar",
    imagePath: ingredientImagePath("cheddar"),
    imageSize: { width: 366, height: 174 },
    shape: { displayWidth: 304, restingSurfaceRatio: 0.4, sinkRatio: 0.3 },
  },
  {
    id: "swiss",
    name: "Queijo suíço",
    imagePath: ingredientImagePath("swiss-cheese"),
    imageSize: { width: 336, height: 179 },
    shape: { displayWidth: 296, restingSurfaceRatio: 0.4, sinkRatio: 0.3 },
  },
  {
    id: "bacon",
    name: "Bacon",
    imagePath: ingredientImagePath("bacon"),
    imageSize: { width: 407, height: 216 },
    shape: { displayWidth: 300, restingSurfaceRatio: 0.32, sinkRatio: 0.22 },
  },
  {
    id: "lettuce",
    name: "Alface",
    imagePath: ingredientImagePath("lettuce"),
    imageSize: { width: 385, height: 208 },
    shape: { displayWidth: 318, restingSurfaceRatio: 0.4, sinkRatio: 0.24 },
  },
  {
    id: "tomato",
    name: "Tomate",
    imagePath: ingredientImagePath("tomato"),
    imageSize: { width: 328, height: 177 },
    shape: { displayWidth: 282, restingSurfaceRatio: 0.42, sinkRatio: 0.16 },
  },
  {
    id: "onion",
    name: "Cebola roxa",
    imagePath: ingredientImagePath("red-onion"),
    imageSize: { width: 343, height: 162 },
    shape: { displayWidth: 276, restingSurfaceRatio: 0.36, sinkRatio: 0.16 },
  },
  {
    id: "pickles",
    name: "Picles",
    imagePath: ingredientImagePath("pickles"),
    imageSize: { width: 289, height: 156 },
    shape: { displayWidth: 240, restingSurfaceRatio: 0.34, sinkRatio: 0.2 },
  },
  {
    id: "egg",
    name: "Ovo",
    imagePath: ingredientImagePath("fried-egg"),
    imageSize: { width: 325, height: 160 },
    shape: { displayWidth: 280, restingSurfaceRatio: 0.32, sinkRatio: 0.2 },
  },
  {
    id: "mayo",
    name: "Maionese",
    imagePath: ingredientImagePath("mayonnaise"),
    imageSize: { width: 1389, height: 319 },
    shape: SAUCE_SHAPE,
  },
  {
    id: "ketchup",
    name: "Ketchup",
    imagePath: ingredientImagePath("ketchup"),
    imageSize: { width: 1426, height: 350 },
    shape: SAUCE_SHAPE,
  },
  {
    id: "mustard",
    name: "Mostarda",
    imagePath: ingredientImagePath("mustard"),
    imageSize: { width: 1354, height: 338 },
    shape: SAUCE_SHAPE,
  },
  {
    id: "middle-bun",
    name: "Pão do meio",
    imagePath: ingredientImagePath("middle-bun"),
    imageSize: { width: 335, height: 138 },
    shape: { displayWidth: 296, restingSurfaceRatio: 0.56, sinkRatio: 0.1 },
  },
];

export const TOP_BUN_SHAPE: StackShape = { displayWidth: 318, restingSurfaceRatio: 1, sinkRatio: 0.14 };
export const BOTTOM_BUN_SHAPE: StackShape = { displayWidth: 300, restingSurfaceRatio: 0.5, sinkRatio: 0 };

export const BUN_VARIANTS: BunVariant[] = [
  {
    id: "classic",
    name: "Clássico",
    topBun: { imagePath: ingredientImagePath("bun-top-classic"), imageSize: { width: 375, height: 208 } },
    bottomBun: { imagePath: ingredientImagePath("bun-bottom-classic"), imageSize: { width: 336, height: 146 } },
  },
  {
    id: "brioche",
    name: "Brioche",
    topBun: { imagePath: ingredientImagePath("bun-top-brioche"), imageSize: { width: 345, height: 202 } },
    bottomBun: { imagePath: ingredientImagePath("bun-bottom-brioche"), imageSize: { width: 327, height: 146 } },
  },
  {
    id: "multigrain",
    name: "Multigrãos",
    topBun: { imagePath: ingredientImagePath("bun-top-multigrain"), imageSize: { width: 350, height: 220 } },
    bottomBun: { imagePath: ingredientImagePath("bun-bottom-multigrain"), imageSize: { width: 345, height: 141 } },
  },
  {
    id: "charcoal",
    name: "Escuro",
    topBun: { imagePath: ingredientImagePath("bun-top-charcoal"), imageSize: { width: 338, height: 205 } },
    bottomBun: { imagePath: ingredientImagePath("bun-bottom-charcoal"), imageSize: { width: 321, height: 141 } },
  },
];

const ingredientsById = new Map(INGREDIENTS.map((ingredient) => [ingredient.id, ingredient]));
const bunVariantsById = new Map(BUN_VARIANTS.map((variant) => [variant.id, variant]));

export function findIngredient(ingredientId: string): Ingredient {
  const ingredient = ingredientsById.get(ingredientId);
  if (!ingredient) throw new Error(`Unknown ingredient: ${ingredientId}`);
  return ingredient;
}

export function findBunVariant(bunVariantId: string): BunVariant {
  const variant = bunVariantsById.get(bunVariantId);
  if (!variant) throw new Error(`Unknown bun variant: ${bunVariantId}`);
  return variant;
}
