import { describe, expect, it } from "vitest";
import { BURGER_CATALOG_FIXTURE } from "../test/burgerCatalogFixture";
import { createInitialComposition, type Composition } from "./composition";
import { computeStackLayout, expandHitArea, scaleStackToStage, STACK_BASE_WIDTH } from "./stackLayout";

const INITIAL_COMPOSITION = createInitialComposition(BURGER_CATALOG_FIXTURE.initialRecipe, BURGER_CATALOG_FIXTURE.maxLayers);
const INGREDIENTS = BURGER_CATALOG_FIXTURE.ingredients;
const BUN_VARIANTS = BURGER_CATALOG_FIXTURE.bunVariants;
const MAX_LAYERS = BURGER_CATALOG_FIXTURE.maxLayers;

function layoutOf(composition: Composition) {
  return computeStackLayout(composition, BURGER_CATALOG_FIXTURE);
}

function compositionWith(ingredientIds: string[], bunVariantId = "classic"): Composition {
  return {
    ...INITIAL_COMPOSITION,
    bunVariantId,
    layers: ingredientIds.map((ingredientId, index) => ({ instanceId: `layer-${index}`, ingredientId })),
  };
}

describe("computeStackLayout", () => {
  it("wraps the ingredients between the bottom and top buns", () => {
    const layout = layoutOf(compositionWith(["beef", "cheddar"]));
    expect(layout.layers.map((layer) => layer.key)).toEqual(["bottom-bun", "layer-0", "layer-1", "top-bun"]);
    expect(layout.layers.map((layer) => layer.zIndex)).toEqual([1, 2, 3, 4]);
  });

  it("keeps only the buns when there are no ingredients", () => {
    const layout = layoutOf(compositionWith([]));
    expect(layout.layers.map((layer) => layer.kind)).toEqual(["bun", "bun"]);
  });

  it("draws every catalog ingredient over the layer it rests on", () => {
    const layout = layoutOf(compositionWith(INGREDIENTS.map((ingredient) => ingredient.id)));
    layout.layers.slice(1).forEach((layer, index) => {
      const layerBelow = layout.layers[index];
      expect(layer.zIndex).toBeGreaterThan(layerBelow.zIndex);
      expect(layer.bottom + layer.height).toBeGreaterThan(layerBelow.bottom);
    });
  });

  it("lets a sauce overlap the layer below while adding little height", () => {
    const withoutSauce = layoutOf(compositionWith(["beef", "cheddar"]));
    const withSauce = layoutOf(compositionWith(["beef", "ketchup", "cheddar"]));
    const [, beef, ketchup] = withSauce.layers;
    expect(ketchup.bottom).toBeLessThan(beef.bottom + beef.height);
    expect(withSauce.height - withoutSauce.height).toBeLessThan(ketchup.height / 2);
  });

  it("keeps the proportions of each PNG", () => {
    const layout = layoutOf(compositionWith(INGREDIENTS.map((ingredient) => ingredient.id)));
    layout.layers.forEach((layer) => {
      expect(layer.width / layer.height).toBeCloseTo(layer.imageSize.width / layer.imageSize.height, 6);
    });
  });

  it.each([
    ["the whole catalog", INGREDIENTS.map((ingredient) => ingredient.id)],
    ["repeated thin layers", ["cheddar", "cheddar", "cheddar", "bacon", "pickles", "egg"]],
  ])("gives each ingredient its own non-overlapping hit area with %s", (_, ingredientIds) => {
    const layout = layoutOf(compositionWith(ingredientIds));
    const hitAreas = layout.layers.flatMap((layer) => (layer.hitArea ? [layer.hitArea] : []));
    expect(hitAreas).toHaveLength(ingredientIds.length);
    hitAreas.forEach((hitArea) => expect(hitArea.height).toBeGreaterThan(0));
    hitAreas.slice(1).forEach((hitArea, index) => {
      const lower = hitAreas[index];
      expect(hitArea.bottom).toBeGreaterThanOrEqual(lower.bottom + lower.height - 1e-9);
    });
  });

  it("uses the images of the selected bun variant", () => {
    BUN_VARIANTS.forEach((variant) => {
      const layout = layoutOf(compositionWith(["beef"], variant.id));
      expect(layout.layers[0].imagePath).toBe(variant.bottomBun.imagePath);
      expect(layout.layers.at(-1)?.imagePath).toBe(variant.topBun.imagePath);
    });
  });

  it("grows with the number of layers", () => {
    const small = layoutOf(compositionWith(["beef"]));
    const large = layoutOf(compositionWith(Array.from({ length: MAX_LAYERS }, () => "beef")));
    expect(large.height).toBeGreaterThan(small.height);
  });
});

describe("scaleStackToStage", () => {
  it("fits a full composition inside a small stage", () => {
    const layout = layoutOf(compositionWith(Array.from({ length: MAX_LAYERS }, () => "beef")));
    const stage = { width: 358, height: 240 };
    const scale = scaleStackToStage(layout, stage);
    expect(layout.height * scale).toBeLessThanOrEqual(stage.height);
    expect(STACK_BASE_WIDTH * scale).toBeLessThanOrEqual(stage.width);
  });

  it("does not enlarge the composition beyond the maximum scale", () => {
    const layout = layoutOf(compositionWith(["beef"]));
    expect(scaleStackToStage(layout, { width: 4000, height: 4000 })).toBe(1.25);
  });
});

describe("expandHitArea", () => {
  it("keeps hit areas that are already big enough", () => {
    expect(expandHitArea({ bottom: 10, height: 50 }, 44)).toEqual({ bottom: 10, height: 50 });
  });

  it("grows thin hit areas around their center", () => {
    expect(expandHitArea({ bottom: 100, height: 10 }, 44)).toEqual({ bottom: 83, height: 44 });
  });
});
