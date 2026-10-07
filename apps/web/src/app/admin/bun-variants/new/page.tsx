import { notFound } from "next/navigation";
import { getAdminBuilder, getAdminCatalog, listBunVariants, listIngredients, listPresets } from "@/api/admin/queries";
import { AdminStatus } from "@/components/admin/AdminStatus";
import { BunVariantStudio } from "@/components/admin/BunVariantStudio";
import { PageHeader } from "@/components/admin/PageHeader";

export const metadata = { title: "Novo tipo de pão" };

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
      <PageHeader
        isTitleHidden
        crumbs={[{ label: "Tipos de pão", href: "/admin/bun-variants" }, { label: "Novo" }]}
        title="Novo tipo de pão"
        description="Envie o topo e a base e compare com os pães atuais. Ele começa oculto até você publicar."
      />
      {catalog ? (
        <BunVariantStudio builderId={builder.id} catalog={catalog} bunVariant={null} />
      ) : (
        <AdminStatus title="Montador sem pães" message="Rode os dados iniciais da API (kool run setup em apps/api)." />
      )}
    </>
  );
}
