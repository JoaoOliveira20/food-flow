"use client";

import { deleteBunVariant } from "@/api/admin/mutations";
import type { AdminBunVariant } from "@/api/admin/types";
import { DeleteCard } from "./DeleteCard";

type DeleteBunVariantProps = {
  bunVariant: AdminBunVariant;
};

export function DeleteBunVariant({ bunVariant }: DeleteBunVariantProps) {
  return (
    <DeleteCard
      title="Excluir tipo de pão"
      hint="A exclusão é definitiva e apaga as duas imagens. Para tirar o pão do montador sem perdê-lo, prefira ocultar."
      question={`Excluir o pão ${bunVariant.name} definitivamente?`}
      onDelete={() => deleteBunVariant(bunVariant.id)}
    />
  );
}
