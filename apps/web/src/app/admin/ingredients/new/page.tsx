import { notFound } from "next/navigation";
import { getAdminBuilder, getAdminCatalog, listBunVariants, listIngredients, listPresets } from "@/api/admin/queries";
import { AdminStatus } from "@/components/admin/AdminStatus";
import { IngredientStudio } from "@/components/admin/IngredientStudio";
import { PageHeader } from "@/components/admin/PageHeader";

export const metadata = { title: "Novo ingrediente" };

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
      <PageHeader
        isTitleHidden
        crumbs={[{ label: "Ingredientes", href: "/admin/ingredients" }, { label: "Novo" }]}
        title="Novo ingrediente"
        description="Envie a foto, ajuste o encaixe e confira no hambúrguer. Ele começa oculto até você publicar."
      />
      {catalog ? (
        <IngredientStudio builderId={builder.id} catalog={catalog} ingredient={null} />
      ) : (
        <AdminStatus title="Montador sem pães" message="Cadastre um tipo de pão antes de criar ingredientes." />
      )}
    </>
  );
}
