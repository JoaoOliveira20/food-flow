import { describe, expect, it } from "vitest";
import { BURGER_CATALOG } from "./burgerCatalog";
import {
  compositionReducer,
  createInitialComposition,
  hasChangedSinceAppliedRecipe,
  matchesRecipe,
  placeDraggedItem,
  type Composition,
  type CompositionRecipe,
  type LayerInstance,
} from "./composition";

const INITIAL_RECIPE = BURGER_CATALOG.initialRecipe;
const MAX_LAYERS = BURGER_CATALOG.maxLayers;
const INITIAL_COMPOSITION = createInitialComposition(INITIAL_RECIPE, MAX_LAYERS);

function compositionWith(ingredientIds: string[], overrides: Partial<Composition> = {}): Composition {
  return {
    ...INITIAL_COMPOSITION,
    layers: ingredientIds.map((ingredientId, index) => ({ instanceId: `layer-${index}`, ingredientId })),
    ...overrides,
  };
}

function ingredientIdsOf(layers: LayerInstance[]): string[] {
  return layers.map((layer) => layer.ingredientId);
}

function instanceIdsOf(layers: LayerInstance[]): string[] {
  return layers.map((layer) => layer.instanceId);
}

describe("addIngredient", () => {
  it("adds the new instance on top of the ingredient stack", () => {
    const state = compositionWith(["beef", "cheddar"]);
    const next = compositionReducer(state, { type: "addIngredient", ingredientId: "bacon", instanceId: "new" });
    expect(ingredientIdsOf(next.layers)).toEqual(["beef", "cheddar", "bacon"]);
    expect(next.layers.at(-1)?.instanceId).toBe("new");
  });

  it("ignores additions beyond the layer limit", () => {
    const state = compositionWith(Array.from({ length: MAX_LAYERS }, () => "beef"));
    const next = compositionReducer(state, { type: "addIngredient", ingredientId: "bacon", instanceId: "new" });
    expect(next).toBe(state);
  });
});

describe("duplicateLayer", () => {
  it("inserts a copy with its own identity right above the original and selects it", () => {
    const state = compositionWith(["beef", "cheddar", "tomato"]);
    const next = compositionReducer(state, { type: "duplicateLayer", instanceId: "layer-1", copyInstanceId: "copy" });
    expect(ingredientIdsOf(next.layers)).toEqual(["beef", "cheddar", "cheddar", "tomato"]);
    expect(instanceIdsOf(next.layers)).toEqual(["layer-0", "layer-1", "copy", "layer-2"]);
    expect(next.selectedInstanceId).toBe("copy");
  });

  it("does not duplicate when the composition is full", () => {
    const state = compositionWith(Array.from({ length: MAX_LAYERS }, () => "beef"));
    const next = compositionReducer(state, { type: "duplicateLayer", instanceId: "layer-0", copyInstanceId: "copy" });
    expect(next).toBe(state);
  });
});

describe("removeLayer", () => {
  it("removes only the given instance, even among duplicates", () => {
    const state = compositionWith(["beef", "cheddar", "beef"], { selectedInstanceId: "layer-2" });
    const next = compositionReducer(state, { type: "removeLayer", instanceId: "layer-2" });
    expect(instanceIdsOf(next.layers)).toEqual(["layer-0", "layer-1"]);
    expect(next.selectedInstanceId).toBeNull();
  });

  it("keeps an unrelated selection", () => {
    const state = compositionWith(["beef", "cheddar"], { selectedInstanceId: "layer-0" });
    const next = compositionReducer(state, { type: "removeLayer", instanceId: "layer-1" });
    expect(next.selectedInstanceId).toBe("layer-0");
  });
});

describe("replaceSelectedLayer", () => {
  it("keeps the logical position of the replaced layer with a new identity", () => {
    const state = compositionWith(["beef", "lettuce", "tomato"], {
      selectedInstanceId: "layer-1",
      isReplacingSelection: true,
    });
    const next = compositionReducer(state, { type: "replaceSelectedLayer", ingredientId: "bacon", instanceId: "new" });
    expect(ingredientIdsOf(next.layers)).toEqual(["beef", "bacon", "tomato"]);
    expect(next.layers[1].instanceId).toBe("new");
    expect(next.selectedInstanceId).toBe("new");
    expect(next.isReplacingSelection).toBe(false);
  });

  it("does nothing without a selection", () => {
    const state = compositionWith(["beef"]);
    const next = compositionReducer(state, { type: "replaceSelectedLayer", ingredientId: "bacon", instanceId: "new" });
    expect(next).toBe(state);
  });
});

describe("moveLayer", () => {
  it("swaps the layer with its upper neighbour", () => {
    const state = compositionWith(["beef", "cheddar", "tomato"]);
    const next = compositionReducer(state, { type: "moveLayer", instanceId: "layer-0", direction: "up" });
    expect(instanceIdsOf(next.layers)).toEqual(["layer-1", "layer-0", "layer-2"]);
  });

  it("does not move past the buns", () => {
    const state = compositionWith(["beef", "cheddar"]);
    expect(compositionReducer(state, { type: "moveLayer", instanceId: "layer-1", direction: "up" })).toBe(state);
    expect(compositionReducer(state, { type: "moveLayer", instanceId: "layer-0", direction: "down" })).toBe(state);
  });
});

describe("placeDraggedItem", () => {
  const composition = compositionWith(["beef", "cheddar", "tomato", "lettuce"]);
  const layers = composition.layers;

  it("moves an existing layer to the requested index", () => {
    const next = placeDraggedItem(composition, { kind: "existingLayer", instanceId: "layer-0" }, 3);
    expect(instanceIdsOf(next)).toEqual(["layer-1", "layer-2", "layer-3", "layer-0"]);
  });

  it("inserts a new ingredient at the requested index", () => {
    const next = placeDraggedItem(composition, { kind: "newIngredient", instanceId: "new", ingredientId: "bacon" }, 1);
    expect(ingredientIdsOf(next)).toEqual(["beef", "bacon", "cheddar", "tomato", "lettuce"]);
  });

  it("clamps the index to the stack bounds", () => {
    const next = placeDraggedItem(composition, { kind: "existingLayer", instanceId: "layer-3" }, 99);
    expect(instanceIdsOf(next)).toEqual(instanceIdsOf(layers));
  });

  it("returns the same layers when a new ingredient does not fit", () => {
    const full = compositionWith(Array.from({ length: MAX_LAYERS }, () => "beef"));
    const next = placeDraggedItem(full, { kind: "newIngredient", instanceId: "new", ingredientId: "bacon" }, 0);
    expect(next).toBe(full.layers);
  });

  it("returns the same layers when the dragged layer no longer exists", () => {
    const next = placeDraggedItem(composition, { kind: "existingLayer", instanceId: "missing" }, 0);
    expect(next).toBe(layers);
  });

  it("selects the dropped layer when committed through the reducer", () => {
    const state = compositionWith(["beef", "cheddar"]);
    const next = compositionReducer(state, {
      type: "placeDraggedItem",
      source: { kind: "existingLayer", instanceId: "layer-1" },
      index: 0,
    });
    expect(instanceIdsOf(next.layers)).toEqual(["layer-1", "layer-0"]);
    expect(next.selectedInstanceId).toBe("layer-1");
  });
});

describe("selection", () => {
  it("toggles the selection of a layer and leaves replacing mode", () => {
    const state = compositionWith(["beef"], { selectedInstanceId: "layer-0", isReplacingSelection: true });
    const next = compositionReducer(state, { type: "toggleLayerSelection", instanceId: "layer-0" });
    expect(next.selectedInstanceId).toBeNull();
    expect(next.isReplacingSelection).toBe(false);
  });

  it("only enters replacing mode with a selected layer", () => {
    const state = compositionWith(["beef"]);
    expect(compositionReducer(state, { type: "toggleReplacing" })).toBe(state);
  });
});

describe("applyRecipe", () => {
  const recipe: CompositionRecipe = { bunVariantId: "brioche", ingredientIds: ["beef", "bacon", "beef"] };

  it("replaces the layers and the bun with the recipe, using the given identities", () => {
    const state = compositionWith(["tomato"], { selectedInstanceId: "layer-0", isReplacingSelection: true });
    const next = compositionReducer(state, { type: "applyRecipe", recipe, instanceIds: ["a", "b", "c"] });
    expect(ingredientIdsOf(next.layers)).toEqual(["beef", "bacon", "beef"]);
    expect(instanceIdsOf(next.layers)).toEqual(["a", "b", "c"]);
    expect(next.bunVariantId).toBe("brioche");
    expect(next.selectedInstanceId).toBeNull();
    expect(next.isReplacingSelection).toBe(false);
    expect(next.appliedRecipe).toBe(recipe);
  });

  it("restores the initial composition on reset", () => {
    const edited = compositionReducer(INITIAL_COMPOSITION, { type: "selectBunVariant", bunVariantId: "charcoal" });
    const next = compositionReducer(edited, {
      type: "applyRecipe",
      recipe: INITIAL_RECIPE,
      instanceIds: INITIAL_RECIPE.ingredientIds.map((_, index) => `reset-${index}`),
    });
    expect(matchesRecipe(next, INITIAL_RECIPE)).toBe(true);
    expect(hasChangedSinceAppliedRecipe(next)).toBe(false);
  });
});

describe("hasChangedSinceAppliedRecipe", () => {
  it("is false for the initial composition", () => {
    expect(hasChangedSinceAppliedRecipe(INITIAL_COMPOSITION)).toBe(false);
  });

  it("ignores selection changes", () => {
    const next = compositionReducer(INITIAL_COMPOSITION, {
      type: "toggleLayerSelection",
      instanceId: INITIAL_COMPOSITION.layers[0].instanceId,
    });
    expect(hasChangedSinceAppliedRecipe(next)).toBe(false);
  });

  it("detects a different bun, a new layer and a new order", () => {
    const [firstLayer] = INITIAL_COMPOSITION.layers;
    const actions = [
      { type: "selectBunVariant", bunVariantId: "brioche" },
      { type: "addIngredient", ingredientId: "bacon", instanceId: "new" },
      { type: "moveLayer", instanceId: firstLayer.instanceId, direction: "up" },
    ] as const;
    actions.forEach((action) => {
      expect(hasChangedSinceAppliedRecipe(compositionReducer(INITIAL_COMPOSITION, action))).toBe(true);
    });
  });

  it("is false again when the edits are undone", () => {
    const [firstLayer] = INITIAL_COMPOSITION.layers;
    const movedUp = compositionReducer(INITIAL_COMPOSITION, { type: "moveLayer", instanceId: firstLayer.instanceId, direction: "up" });
    const movedBack = compositionReducer(movedUp, { type: "moveLayer", instanceId: firstLayer.instanceId, direction: "down" });
    expect(hasChangedSinceAppliedRecipe(movedBack)).toBe(false);
  });
});
