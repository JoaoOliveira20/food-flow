"use client";

import { deletePreset } from "@/api/admin/mutations";
import type { AdminPreset } from "@/api/admin/types";
import { DeleteCard } from "./DeleteCard";

export function DeletePreset({ preset }: { preset: AdminPreset }) {
  return (
    <DeleteCard
      title="Excluir preset"
      hint="Apaga o preset para sempre. Os ingredientes e o pão não são afetados."
      question={`Excluir o preset ${preset.name} definitivamente?`}
      deletedMessage={`O preset ${preset.name} foi excluído`}
      listHref="/admin/presets"
      blockedReason={
        preset.isInitial
          ? "Este preset é a composição inicial: define o hambúrguer que aparece ao abrir o montador, por isso não pode ser excluído."
          : undefined
      }
      onDelete={() => deletePreset(preset.id)}
    />
  );
}
