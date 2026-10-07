import { notFound } from "next/navigation";
import {
  getAdminBuilder,
  getAdminCatalog,
  getIngredient,
  listBunVariants,
  listIngredients,
  listPresets,
} from "@/api/admin/queries";
import { CreatedToast } from "@/components/admin/CreatedToast";
import { DeleteIngredient } from "@/components/admin/DeleteIngredient";
import { IngredientStudio } from "@/components/admin/IngredientStudio";
import { PageHeader } from "@/components/admin/PageHeader";

export default async function EditIngredientPage({ params, searchParams }: PageProps<"/admin/ingredients/[id]">) {
  const { id } = await params;
  const { created } = await searchParams;
  const ingredientId = Number(id);
  if (!Number.isInteger(ingredientId) || ingredientId <= 0) notFound();

  const [builder, ingredient] = await Promise.all([getAdminBuilder(), getIngredient(ingredientId)]);
  if (!builder || !ingredient) notFound();
  const [ingredients, bunVariants, presets] = await Promise.all([
    listIngredients(builder.id),
    listBunVariants(builder.id),
    listPresets(builder.id),
  ]);
  const catalog = getAdminCatalog(builder, { bunVariants, ingredients, presets });
  if (!catalog) notFound();

  return (
    <>
      {created && <CreatedToast title="Ingrediente criado" detail="Ele está oculto: confira o preview e publique." />}
      <PageHeader
        isTitleHidden
        crumbs={[{ label: "Ingredientes", href: "/admin/ingredients" }, { label: ingredient.name }]}
        title={ingredient.name}
        description={
          <>
            Identificador <code>{ingredient.slug}</code>
          </>
        }
      />
      <IngredientStudio key={ingredient.updatedAt} builderId={builder.id} catalog={catalog} ingredient={ingredient} />
      <DeleteIngredient ingredient={ingredient} />
    </>
  );
}
