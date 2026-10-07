"use client";

import { updateBunVariant } from "@/api/admin/mutations";
import type { AdminBunVariant } from "@/api/admin/types";
import { VisibilityCard } from "./VisibilityCard";

type BunVariantVisibilityProps = {
  bunVariant: AdminBunVariant;
};

export function BunVariantVisibility({ bunVariant }: BunVariantVisibilityProps) {
  const presets = bunVariant.presets ?? [];
  return (
    <VisibilityCard
      isVisible={bunVariant.isVisible}
      visibleHint="O tipo de pão aparece para todos no montador público."
      hiddenHint="Só o admin vê este tipo de pão. Confira o preview e publique quando estiver pronto."
      presets={presets}
      hideWarning={(names) =>
        `Ao ocultar, ${presets.length === 1 ? "este preset fica indisponível" : "estes presets ficam indisponíveis"} no montador até o pão voltar: ${names}.`
      }
      onChange={(isVisible) => updateBunVariant(bunVariant.id, { isVisible })}
    />
  );
}
