"use client";

import { deleteBunVariant } from "@/api/admin/mutations";
import type { AdminBunVariant } from "@/api/admin/types";
import { DeleteCard } from "./DeleteCard";

export function DeleteBunVariant({ bunVariant }: { bunVariant: AdminBunVariant }) {
  return (
    <DeleteCard
      title="Excluir tipo de pão"
      hint="Apaga o pão e as duas imagens para sempre. Para só tirar do montador, use Ocultar."
      question={`Excluir o pão ${bunVariant.name} definitivamente?`}
      deletedMessage={`O pão ${bunVariant.name} foi excluído`}
      listHref="/admin/bun-variants"
      onDelete={() => deleteBunVariant(bunVariant.id)}
    />
  );
}
