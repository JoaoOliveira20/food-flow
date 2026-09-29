import type { CompositionRecipe } from "./composition";

export type CompositionPreset = CompositionRecipe & {
  id: string;
  name: string;
};

export const PRESETS: CompositionPreset[] = [
  {
    id: "classic",
    name: "Clássico",
    bunVariantId: "classic",
    ingredientIds: ["beef", "cheddar", "lettuce", "tomato"],
  },
  {
    id: "bacon",
    name: "Bacon",
    bunVariantId: "brioche",
    ingredientIds: ["beef", "cheddar", "bacon", "onion", "pickles", "ketchup"],
  },
  {
    id: "double",
    name: "Duplo",
    bunVariantId: "classic",
    ingredientIds: ["beef", "cheddar", "lettuce", "pickles", "middle-bun", "beef", "cheddar", "lettuce", "onion"],
  },
];
