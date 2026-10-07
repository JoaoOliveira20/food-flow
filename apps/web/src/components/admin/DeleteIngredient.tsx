"use client";

import { deleteIngredient } from "@/api/admin/mutations";
import type { AdminIngredient } from "@/api/admin/types";
import { DeleteCard } from "./DeleteCard";

type DeleteIngredientProps = {
  ingredient: AdminIngredient;
};

export function DeleteIngredient({ ingredient }: DeleteIngredientProps) {
  return (
    <DeleteCard
      title="Excluir ingrediente"
      hint="A exclusão é definitiva e apaga a imagem. Para tirar o ingrediente do montador sem perdê-lo, prefira ocultar."
      question={`Excluir ${ingredient.name} definitivamente?`}
      onDelete={() => deleteIngredient(ingredient.id)}
    />
  );
}
