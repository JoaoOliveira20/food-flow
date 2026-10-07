import { notFound } from "next/navigation";
import { getAdminBuilder, getAdminCatalog, listBunVariants, getPreset, listIngredients, listPresets } from "@/api/admin/queries";
import { AdminStatus } from "@/components/admin/AdminStatus";
import { CreatedToast } from "@/components/admin/CreatedToast";
import { DeletePreset } from "@/components/admin/DeletePreset";
import { PageHeader } from "@/components/admin/PageHeader";
import { PresetEditor } from "@/components/admin/PresetEditor";
import { presetRecipe } from "@/components/admin/presetRecipe";

export default async function EditPresetPage({ params, searchParams }: PageProps<"/admin/presets/[id]">) {
  const { id } = await params;
  const { created } = await searchParams;
  const presetId = Number(id);
  if (!Number.isInteger(presetId) || presetId <= 0) notFound();

  const [builder, preset] = await Promise.all([getAdminBuilder(), getPreset(presetId)]);
  if (!builder || !preset) notFound();
  const [ingredients, presets, bunVariants] = await Promise.all([
    listIngredients(builder.id),
    listPresets(builder.id),
    listBunVariants(builder.id),
  ]);
  const otherPresets = presets.filter((other) => other.id !== preset.id);
  const catalog = getAdminCatalog(builder, { bunVariants, ingredients, presets: otherPresets });
  const hiddenIngredientIds = ingredients.filter((ingredient) => !ingredient.isVisible).map((ingredient) => String(ingredient.id));
  const hiddenBunVariantIds = bunVariants.filter((variant) => !variant.isVisible).map((variant) => String(variant.id));

  return (
    <>
      {created && <CreatedToast title="Preset criado" detail="Ele já aparece no montador se tudo estiver publicado." />}
      <PageHeader
        isTitleHidden
        crumbs={[{ label: "Presets", href: "/admin/presets" }, { label: preset.name }]}
        title={preset.name}
        description={
          preset.isInitial
            ? "Composição inicial: o hambúrguer que aparece ao abrir o montador (não entra no painel de presets)."
            : preset.isAvailable
              ? "Disponível no montador."
              : "Fora do montador: leva pão ou ingrediente oculto."
        }
      />
      {catalog ? (
        <PresetEditor
          key={preset.updatedAt}
          builderId={builder.id}
          catalog={catalog}
          hiddenIngredientIds={hiddenIngredientIds}
          hiddenBunVariantIds={hiddenBunVariantIds}
          preset={{ id: preset.id, name: preset.name, recipe: presetRecipe(preset) }}
        />
      ) : (
        <AdminStatus title="Sem tipos de pão" message="Cadastre um tipo de pão para editar presets." />
      )}
      <DeletePreset preset={preset} />
    </>
  );
}
