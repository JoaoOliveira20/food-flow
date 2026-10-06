import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { BURGER_CATALOG } from "./burgerCatalog";
import { findBunVariant, findIngredient, type ImageSize } from "./catalog";
import type { CompositionRecipe } from "./composition";

const PUBLIC_DIRECTORY = join(__dirname, "..", "..", "public");
const PNG_WIDTH_OFFSET = 16;
const PNG_HEIGHT_OFFSET = 20;

function readPngSize(imagePath: string): ImageSize {
  const header = readFileSync(join(PUBLIC_DIRECTORY, imagePath)).subarray(0, 24);
  return { width: header.readUInt32BE(PNG_WIDTH_OFFSET), height: header.readUInt32BE(PNG_HEIGHT_OFFSET) };
}

const catalogImages = [
  ...BURGER_CATALOG.ingredients.map((ingredient) => ({ name: ingredient.name, image: ingredient })),
  ...BURGER_CATALOG.bunVariants.flatMap((variant) => [
    { name: `${variant.name} (topo)`, image: variant.topBun },
    { name: `${variant.name} (base)`, image: variant.bottomBun },
  ]),
];

describe("catalog images", () => {
  it.each(catalogImages)("$name declares the natural size of its PNG", ({ image }) => {
    expect(image.imageSize).toEqual(readPngSize(image.imagePath));
  });
});

const namedRecipes: [string, CompositionRecipe][] = [
  ["initial composition", BURGER_CATALOG.initialRecipe],
  ...BURGER_CATALOG.presets.map((preset): [string, CompositionRecipe] => [`preset ${preset.name}`, preset]),
];

describe("recipes", () => {
  it.each(namedRecipes)("%s uses catalog items and respects the layer limit", (_, recipe) => {
    expect(() => findBunVariant(BURGER_CATALOG, recipe.bunVariantId)).not.toThrow();
    recipe.ingredientIds.forEach((ingredientId) =>
      expect(() => findIngredient(BURGER_CATALOG, ingredientId)).not.toThrow(),
    );
    expect(recipe.ingredientIds.length).toBeLessThanOrEqual(BURGER_CATALOG.maxLayers);
  });

  it("gives every preset a unique id", () => {
    const ids = BURGER_CATALOG.presets.map((preset) => preset.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
