import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdminBuilder, getAdminCatalog, getIngredient, listIngredients } from "@/api/admin/queries";
import { DeleteIngredient } from "@/components/admin/DeleteIngredient";
import { IngredientForm } from "@/components/admin/IngredientForm";
import { IngredientVisibility } from "@/components/admin/IngredientVisibility";
import styles from "@/components/admin/admin.module.css";

export default async function EditIngredientPage({ params, searchParams }: PageProps<"/admin/ingredients/[id]">) {
  const { id } = await params;
  const { created } = await searchParams;
  const ingredientId = Number(id);
  if (!Number.isInteger(ingredientId) || ingredientId <= 0) notFound();

  const [builder, ingredient] = await Promise.all([getAdminBuilder(), getIngredient(ingredientId)]);
  if (!builder || !ingredient) notFound();
  const catalog = await getAdminCatalog(builder, await listIngredients(builder.id));

  return (
    <>
      <div className={styles.pageHeader}>
        <div>
          <p className={styles.breadcrumb}>
            <Link href="/admin">Painel</Link> / Ingredientes / {ingredient.name}
          </p>
          <h1 className={styles.pageTitle}>{ingredient.name}</h1>
          <p className={styles.pageSubtitle}>
            Identificador <code>{ingredient.slug}</code> · usado em{" "}
            {ingredient.presets?.length === 1 ? "1 preset" : `${ingredient.presets?.length ?? 0} presets`}
          </p>
        </div>
      </div>
      {created && (
        <p className={styles.success} role="status">
          Ingrediente criado e oculto. Confira o preview abaixo e publique quando estiver pronto.
        </p>
      )}
      <IngredientVisibility ingredient={ingredient} />
      <IngredientForm key={ingredient.updatedAt} builderId={builder.id} catalog={catalog} ingredient={ingredient} />
      <DeleteIngredient ingredient={ingredient} />
    </>
  );
}
