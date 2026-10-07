"use client";

import { deletePreset } from "@/api/admin/mutations";
import type { AdminPreset } from "@/api/admin/types";
import { DeleteCard } from "./DeleteCard";

type DeletePresetProps = {
  preset: AdminPreset;
};

export function DeletePreset({ preset }: DeletePresetProps) {
  return (
    <DeleteCard
      title="Excluir preset"
      hint="A exclusão é definitiva. Os ingredientes do preset não são afetados."
      question={`Excluir o preset ${preset.name} definitivamente?`}
      blockedReason={
        preset.isInitial
          ? "Este é o preset da composição inicial: ele define o hambúrguer que aparece ao abrir o montador e por isso não pode ser excluído. Você pode editá-lo normalmente."
          : undefined
      }
      onDelete={() => deletePreset(preset.id)}
    />
  );
}
