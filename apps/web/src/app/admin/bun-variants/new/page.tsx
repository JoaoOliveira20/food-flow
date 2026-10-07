import { notFound } from "next/navigation";
import { getAdminBuilder, getAdminCatalog, listBunVariants, listIngredients, listPresets } from "@/api/admin/queries";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminStatus } from "@/components/admin/AdminStatus";
import { BunVariantStudio } from "@/components/admin/BunVariantStudio";

export default async function NewBunVariantPage() {
  const builder = await getAdminBuilder();
  if (!builder) notFound();
  const [ingredients, presets, bunVariants] = await Promise.all([
    listIngredients(builder.id),
    listPresets(builder.id),
    listBunVariants(builder.id),
  ]);
  const catalog = getAdminCatalog(builder, { bunVariants, ingredients, presets });

  return (
    <>
      <AdminPageHeader
        trail={["Novo tipo de pão"]}
        title="Novo tipo de pão"
        subtitle="Ele começa oculto: só aparece no montador depois de publicado."
      />
      {catalog ? (
        <BunVariantStudio builderId={builder.id} catalog={catalog} bunVariant={null} />
      ) : (
        <AdminStatus title="Montador sem pães" message="Rode os dados iniciais da API (kool run setup em apps/api)." />
      )}
    </>
  );
}
