import type { CompositionRecipe } from "@/burger/composition";
import type { AdminPreset } from "@/api/admin/types";

export function presetRecipe(preset: Pick<AdminPreset, "bunVariantId" | "ingredientIds">): CompositionRecipe {
  return { bunVariantId: String(preset.bunVariantId), ingredientIds: preset.ingredientIds.map(String) };
}
