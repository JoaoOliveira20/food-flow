import type { DragSource, LayerInstance } from "@/burger/composition";
import { findIngredient } from "@/burger/ingredientCatalog";
import type { DragState } from "@/hooks/useCompositionDrag";

export const DRAG_CANCELLED_MESSAGE = "↺ Arraste cancelado. Nada foi alterado.";

export function describeLayerNeighbors(layers: LayerInstance[], instanceId: string, bunName: string): string {
  const index = layers.findIndex((layer) => layer.instanceId === instanceId);
  const layerBelow = index > 0 ? findIngredient(layers[index - 1].ingredientId).name : `pão inferior ${bunName}`;
  const layerAbove = index < layers.length - 1 ? findIngredient(layers[index + 1].ingredientId).name : "pão superior";
  return `entre ${layerBelow} e ${layerAbove}`;
}

export function dragHintMessage(drag: DragState, previewLayers: LayerInstance[], bunName: string): string {
  if (drag.insertionIndex === null) return "✕ Fora do hambúrguer: soltar cancela.";
  return `↕ Soltar ${describeLayerNeighbors(previewLayers, drag.source.instanceId, bunName)}`;
}

export function dropConfirmationMessage(
  source: DragSource,
  ingredientId: string,
  layers: LayerInstance[],
  bunName: string,
): string {
  const ingredientName = findIngredient(ingredientId).name;
  const action = source.kind === "newIngredient" ? "adicionado" : "movido";
  return `✓ ${ingredientName} ${action} ${describeLayerNeighbors(layers, source.instanceId, bunName)}.`;
}
