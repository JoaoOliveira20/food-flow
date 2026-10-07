import { notFound } from "next/navigation";
import {
  getAdminBuilder,
  getAdminCatalog,
  getBunVariant,
  listBunVariants,
  listIngredients,
  listPresets,
} from "@/api/admin/queries";
import { BunVariantStudio } from "@/components/admin/BunVariantStudio";
import { CreatedToast } from "@/components/admin/CreatedToast";
import { DeleteBunVariant } from "@/components/admin/DeleteBunVariant";
import { PageHeader } from "@/components/admin/PageHeader";

export default async function EditBunVariantPage({ params, searchParams }: PageProps<"/admin/bun-variants/[id]">) {
  const { id } = await params;
  const { created } = await searchParams;
  const bunVariantId = Number(id);
  if (!Number.isInteger(bunVariantId) || bunVariantId <= 0) notFound();

  const [builder, bunVariant] = await Promise.all([getAdminBuilder(), getBunVariant(bunVariantId)]);
  if (!builder || !bunVariant) notFound();
  const [ingredients, presets, bunVariants] = await Promise.all([
    listIngredients(builder.id),
    listPresets(builder.id),
    listBunVariants(builder.id),
  ]);
  const catalog = getAdminCatalog(builder, { bunVariants, ingredients, presets });
  if (!catalog) notFound();

  return (
    <>
      {created && <CreatedToast title="Tipo de pão criado" detail="Ele está oculto: confira o preview e publique." />}
      <PageHeader
        isTitleHidden
        crumbs={[{ label: "Tipos de pão", href: "/admin/bun-variants" }, { label: bunVariant.name }]}
        title={bunVariant.name}
        description={
          <>
            Identificador <code>{bunVariant.slug}</code>
          </>
        }
      />
      <BunVariantStudio key={bunVariant.updatedAt} builderId={builder.id} catalog={catalog} bunVariant={bunVariant} />
      <DeleteBunVariant bunVariant={bunVariant} />
    </>
  );
}
