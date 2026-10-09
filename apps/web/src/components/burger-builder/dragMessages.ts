import { findIngredient, type BuilderCatalog } from "@/burger/catalog";
import type { DragSource, LayerInstance } from "@/burger/composition";
import type { DragState } from "@/hooks/useCompositionDrag";

export const DRAG_CANCELLED_MESSAGE = "↺ Arraste cancelado. Nada foi alterado.";

export function describeLayerNeighbors(
  catalog: BuilderCatalog,
  layers: LayerInstance[],
  instanceId: string,
  bunName: string,
): string {
  const index = layers.findIndex((layer) => layer.instanceId === instanceId);
  const layerBelow = index > 0 ? findIngredient(catalog, layers[index - 1].ingredientId).name : `pão inferior ${bunName}`;
  const layerAbove = index < layers.length - 1 ? findIngredient(catalog, layers[index + 1].ingredientId).name : "pão superior";
  return `entre ${layerBelow} e ${layerAbove}`;
}

export function dragHintMessage(
  catalog: BuilderCatalog,
  drag: DragState,
  previewLayers: LayerInstance[],
  bunName: string,
): string {
  if (drag.insertionIndex === null) return "✕ Fora do hambúrguer: soltar cancela.";
  return `↕ Soltar ${describeLayerNeighbors(catalog, previewLayers, drag.source.instanceId, bunName)}`;
}

export function dropConfirmationMessage(
  catalog: BuilderCatalog,
  source: DragSource,
  ingredientId: string,
  layers: LayerInstance[],
  bunName: string,
): string {
  const ingredientName = findIngredient(catalog, ingredientId).name;
  const action = source.kind === "newIngredient" ? "adicionado" : "movido";
  return `✓ ${ingredientName} ${action} ${describeLayerNeighbors(catalog, layers, source.instanceId, bunName)}.`;
}
