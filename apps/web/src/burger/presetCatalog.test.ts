import { describe, expect, it } from "vitest";
import { INITIAL_RECIPE, MAX_LAYERS, type CompositionRecipe } from "./composition";
import { findBunVariant, findIngredient } from "./ingredientCatalog";
import { PRESETS } from "./presetCatalog";

const namedRecipes: [string, CompositionRecipe][] = [
  ["initial composition", INITIAL_RECIPE],
  ...PRESETS.map((preset): [string, CompositionRecipe] => [`preset ${preset.name}`, preset]),
];

describe("recipes", () => {
  it.each(namedRecipes)("%s uses catalog items and respects the layer limit", (_, recipe) => {
    expect(() => findBunVariant(recipe.bunVariantId)).not.toThrow();
    recipe.ingredientIds.forEach((ingredientId) => expect(() => findIngredient(ingredientId)).not.toThrow());
    expect(recipe.ingredientIds.length).toBeLessThanOrEqual(MAX_LAYERS);
  });

  it("gives every preset a unique id", () => {
    const ids = PRESETS.map((preset) => preset.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
