"use client";

import { updateIngredient } from "@/api/admin/mutations";
import type { AdminIngredient } from "@/api/admin/types";
import { VisibilityCard } from "./VisibilityCard";

type IngredientVisibilityProps = {
  ingredient: AdminIngredient;
};

export function IngredientVisibility({ ingredient }: IngredientVisibilityProps) {
  const presets = ingredient.presets ?? [];
  return (
    <VisibilityCard
      isVisible={ingredient.isVisible}
      visibleHint="O ingrediente aparece para todos no montador público."
      hiddenHint="Só o admin vê este ingrediente. Confira o preview e publique quando estiver pronto."
      presets={presets}
      hideWarning={(names) =>
        `Ao ocultar, ${presets.length === 1 ? "este preset fica indisponível" : "estes presets ficam indisponíveis"} no montador até o ingrediente voltar: ${names}.`
      }
      onChange={(isVisible) => updateIngredient(ingredient.id, { isVisible })}
    />
  );
}
