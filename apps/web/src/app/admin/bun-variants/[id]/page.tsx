import { notFound } from "next/navigation";
import {
  getAdminBuilder,
  getAdminCatalog,
  getBunVariant,
  listBunVariants,
  listIngredients,
  listPresets,
} from "@/api/admin/queries";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { BunVariantStudio } from "@/components/admin/BunVariantStudio";
import { DeleteBunVariant } from "@/components/admin/DeleteBunVariant";

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
      <AdminPageHeader
        trail={["Tipos de pão", bunVariant.name]}
        title={bunVariant.name}
        subtitle={
          <>
            Identificador <code>{bunVariant.slug}</code>
          </>
        }
        notice={created ? "Tipo de pão criado e oculto. Confira o preview e publique quando estiver pronto." : null}
      />
      <BunVariantStudio key={bunVariant.updatedAt} builderId={builder.id} catalog={catalog} bunVariant={bunVariant} />
      <DeleteBunVariant bunVariant={bunVariant} />
    </>
  );
}
