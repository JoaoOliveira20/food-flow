import { notFound } from "next/navigation";
import { getAdminBuilder, getAdminCatalog, listBunVariants, listIngredients, listPresets } from "@/api/admin/queries";
import { AdminStatus } from "@/components/admin/AdminStatus";
import { PageHeader } from "@/components/admin/PageHeader";
import { PresetEditor } from "@/components/admin/PresetEditor";

export const metadata = { title: "Novo preset" };

export default async function NewPresetPage() {
  const builder = await getAdminBuilder();
  if (!builder) notFound();
  const [ingredients, presets, bunVariants] = await Promise.all([
    listIngredients(builder.id),
    listPresets(builder.id),
    listBunVariants(builder.id),
  ]);
  const catalog = getAdminCatalog(builder, { bunVariants, ingredients, presets });
  const hiddenIngredientIds = ingredients.filter((ingredient) => !ingredient.isVisible).map((ingredient) => String(ingredient.id));
  const hiddenBunVariantIds = bunVariants.filter((variant) => !variant.isVisible).map((variant) => String(variant.id));

  return (
    <>
      <PageHeader
        isTitleHidden
        crumbs={[{ label: "Presets", href: "/admin/presets" }, { label: "Novo" }]}
        title="Novo preset"
        description="Monte como no montador: clique ou arraste ingredientes, escolha o pão ou comece de um preset existente."
      />
      {catalog ? (
        <PresetEditor
          builderId={builder.id}
          catalog={catalog}
          hiddenIngredientIds={hiddenIngredientIds}
          hiddenBunVariantIds={hiddenBunVariantIds}
          preset={null}
        />
      ) : (
        <AdminStatus title="Sem tipos de pão" message="Cadastre um tipo de pão antes de criar presets." />
      )}
    </>
  );
}
