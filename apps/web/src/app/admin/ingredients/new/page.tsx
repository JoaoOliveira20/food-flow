import { notFound } from "next/navigation";
import { getAdminBuilder, getAdminCatalog, listBunVariants, listIngredients, listPresets } from "@/api/admin/queries";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminStatus } from "@/components/admin/AdminStatus";
import { IngredientStudio } from "@/components/admin/IngredientStudio";

export default async function NewIngredientPage() {
  const builder = await getAdminBuilder();
  if (!builder) notFound();
  const [ingredients, bunVariants, presets] = await Promise.all([
    listIngredients(builder.id),
    listBunVariants(builder.id),
    listPresets(builder.id),
  ]);
  const catalog = getAdminCatalog(builder, { bunVariants, ingredients, presets });

  return (
    <>
      <AdminPageHeader
        trail={["Novo ingrediente"]}
        title="Novo ingrediente"
        subtitle="Ele começa oculto: só aparece no montador depois de publicado."
      />
      {catalog ? (
        <IngredientStudio builderId={builder.id} catalog={catalog} ingredient={null} />
      ) : (
        <AdminStatus title="Montador sem pães" message="Cadastre um tipo de pão antes de criar ingredientes." />
      )}
    </>
  );
}
