export type LayerInstance = {
  instanceId: string;
  ingredientId: string;
};

export type CompositionRecipe = {
  bunVariantId: string;
  ingredientIds: string[];
};

export type Composition = {
  layers: LayerInstance[];
  bunVariantId: string;
  selectedInstanceId: string | null;
  isReplacingSelection: boolean;
  appliedRecipe: CompositionRecipe;
  maxLayers: number;
};

export type DragSource =
  | { kind: "existingLayer"; instanceId: string }
  | { kind: "newIngredient"; instanceId: string; ingredientId: string };

export type CompositionAction =
  | { type: "addIngredient"; ingredientId: string; instanceId: string }
  | { type: "duplicateLayer"; instanceId: string; copyInstanceId: string }
  | { type: "removeLayer"; instanceId: string }
  | { type: "replaceSelectedLayer"; ingredientId: string; instanceId: string }
  | { type: "moveLayer"; instanceId: string; direction: "up" | "down" }
  | { type: "placeDraggedItem"; source: DragSource; index: number }
  | { type: "toggleLayerSelection"; instanceId: string }
  | { type: "clearSelection" }
  | { type: "toggleReplacing" }
  | { type: "selectBunVariant"; bunVariantId: string }
  | { type: "applyRecipe"; recipe: CompositionRecipe; instanceIds: string[] };

let instanceCounter = 0;

export function createInstanceId(): string {
  instanceCounter += 1;
  return `layer-${instanceCounter}`;
}

export function createRecipeInstanceIds(recipe: CompositionRecipe): string[] {
  return recipe.ingredientIds.map(() => createInstanceId());
}

export function createCompositionFromRecipe(
  recipe: CompositionRecipe,
  instanceIds: string[],
  maxLayers: number,
): Composition {
  return {
    layers: recipe.ingredientIds.map((ingredientId, index) => ({ instanceId: instanceIds[index], ingredientId })),
    bunVariantId: recipe.bunVariantId,
    selectedInstanceId: null,
    isReplacingSelection: false,
    appliedRecipe: recipe,
    maxLayers,
  };
}

export function createInitialComposition(recipe: CompositionRecipe, maxLayers: number): Composition {
  const instanceIds = recipe.ingredientIds.map((_, index) => `initial-layer-${index}`);
  return createCompositionFromRecipe(recipe, instanceIds, maxLayers);
}

export function matchesRecipe(composition: Composition, recipe: CompositionRecipe): boolean {
  return (
    composition.bunVariantId === recipe.bunVariantId &&
    composition.layers.length === recipe.ingredientIds.length &&
    composition.layers.every((layer, index) => layer.ingredientId === recipe.ingredientIds[index])
  );
}

export function hasChangedSinceAppliedRecipe(composition: Composition): boolean {
  return !matchesRecipe(composition, composition.appliedRecipe);
}

export function hasReachedLayerLimit(composition: Composition): boolean {
  return composition.layers.length >= composition.maxLayers;
}

function layersWithoutDraggedItem(layers: LayerInstance[], source: DragSource): LayerInstance[] {
  return source.kind === "existingLayer" ? layers.filter((layer) => layer.instanceId !== source.instanceId) : layers;
}

function findDraggedLayer(composition: Composition, source: DragSource): LayerInstance | undefined {
  if (source.kind === "existingLayer") return composition.layers.find((layer) => layer.instanceId === source.instanceId);
  if (hasReachedLayerLimit(composition)) return undefined;
  return { instanceId: source.instanceId, ingredientId: source.ingredientId };
}

export function placeDraggedItem(composition: Composition, source: DragSource, index: number): LayerInstance[] {
  const draggedLayer = findDraggedLayer(composition, source);
  if (!draggedLayer) return composition.layers;
  const remainingLayers = layersWithoutDraggedItem(composition.layers, source);
  const insertionIndex = Math.max(0, Math.min(index, remainingLayers.length));
  return [...remainingLayers.slice(0, insertionIndex), draggedLayer, ...remainingLayers.slice(insertionIndex)];
}

function addIngredient(state: Composition, ingredientId: string, instanceId: string): Composition {
  if (hasReachedLayerLimit(state)) return state;
  return { ...state, layers: [...state.layers, { instanceId, ingredientId }] };
}

function duplicateLayer(state: Composition, instanceId: string, copyInstanceId: string): Composition {
  const index = state.layers.findIndex((layer) => layer.instanceId === instanceId);
  if (index === -1 || hasReachedLayerLimit(state)) return state;
  const copy = { instanceId: copyInstanceId, ingredientId: state.layers[index].ingredientId };
  const layers = [...state.layers.slice(0, index + 1), copy, ...state.layers.slice(index + 1)];
  return { ...state, layers, selectedInstanceId: copyInstanceId };
}

function removeLayer(state: Composition, instanceId: string): Composition {
  return {
    ...state,
    layers: state.layers.filter((layer) => layer.instanceId !== instanceId),
    selectedInstanceId: state.selectedInstanceId === instanceId ? null : state.selectedInstanceId,
    isReplacingSelection: false,
  };
}

function replaceSelectedLayer(state: Composition, ingredientId: string, instanceId: string): Composition {
  if (!state.selectedInstanceId) return state;
  const layers = state.layers.map((layer) =>
    layer.instanceId === state.selectedInstanceId ? { instanceId, ingredientId } : layer,
  );
  return { ...state, layers, selectedInstanceId: instanceId, isReplacingSelection: false };
}

function moveLayer(state: Composition, instanceId: string, direction: "up" | "down"): Composition {
  const index = state.layers.findIndex((layer) => layer.instanceId === instanceId);
  const targetIndex = direction === "up" ? index + 1 : index - 1;
  if (index === -1 || targetIndex < 0 || targetIndex >= state.layers.length) return state;
  const layers = [...state.layers];
  [layers[index], layers[targetIndex]] = [layers[targetIndex], layers[index]];
  return { ...state, layers };
}

function placeDraggedItemInComposition(state: Composition, source: DragSource, index: number): Composition {
  const layers = placeDraggedItem(state, source, index);
  if (layers === state.layers) return state;
  return { ...state, layers, selectedInstanceId: source.instanceId, isReplacingSelection: false };
}

function toggleLayerSelection(state: Composition, instanceId: string): Composition {
  const selectedInstanceId = state.selectedInstanceId === instanceId ? null : instanceId;
  return { ...state, selectedInstanceId, isReplacingSelection: false };
}

export function compositionReducer(state: Composition, action: CompositionAction): Composition {
  switch (action.type) {
    case "addIngredient":
      return addIngredient(state, action.ingredientId, action.instanceId);
    case "duplicateLayer":
      return duplicateLayer(state, action.instanceId, action.copyInstanceId);
    case "removeLayer":
      return removeLayer(state, action.instanceId);
    case "replaceSelectedLayer":
      return replaceSelectedLayer(state, action.ingredientId, action.instanceId);
    case "moveLayer":
      return moveLayer(state, action.instanceId, action.direction);
    case "placeDraggedItem":
      return placeDraggedItemInComposition(state, action.source, action.index);
    case "toggleLayerSelection":
      return toggleLayerSelection(state, action.instanceId);
    case "clearSelection":
      return { ...state, selectedInstanceId: null, isReplacingSelection: false };
    case "toggleReplacing":
      return state.selectedInstanceId ? { ...state, isReplacingSelection: !state.isReplacingSelection } : state;
    case "selectBunVariant":
      return { ...state, bunVariantId: action.bunVariantId };
    case "applyRecipe":
      return createCompositionFromRecipe(action.recipe, action.instanceIds, state.maxLayers);
  }
}
