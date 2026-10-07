"use client";

import { deleteIngredient } from "@/api/admin/mutations";
import type { AdminIngredient } from "@/api/admin/types";
import { DeleteCard } from "./DeleteCard";

export function DeleteIngredient({ ingredient }: { ingredient: AdminIngredient }) {
  return (
    <DeleteCard
      title="Excluir ingrediente"
      hint="Apaga o ingrediente e a imagem para sempre. Para só tirar do montador, use Ocultar."
      question={`Excluir ${ingredient.name} definitivamente?`}
      deletedMessage={`${ingredient.name} foi excluído`}
      listHref="/admin/ingredients"
      onDelete={() => deleteIngredient(ingredient.id)}
    />
  );
}
