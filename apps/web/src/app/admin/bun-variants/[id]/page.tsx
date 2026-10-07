import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getAdminBuilder,
  getAdminCatalog,
  getBunVariant,
  listBunVariants,
  listIngredients,
  listPresets,
} from "@/api/admin/queries";
import { BunVariantForm } from "@/components/admin/BunVariantForm";
import { BunVariantVisibility } from "@/components/admin/BunVariantVisibility";
import { DeleteBunVariant } from "@/components/admin/DeleteBunVariant";
import styles from "@/components/admin/admin.module.css";

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
  const usage = bunVariant.presets?.length ?? 0;

  return (
    <>
      <div className={styles.pageHeader}>
        <div>
          <p className={styles.breadcrumb}>
            <Link href="/admin">Painel</Link> / Tipos de pão / {bunVariant.name}
          </p>
          <h1 className={styles.pageTitle}>{bunVariant.name}</h1>
          <p className={styles.pageSubtitle}>
            Identificador <code>{bunVariant.slug}</code> · usado em {usage === 1 ? "1 preset" : `${usage} presets`}
          </p>
        </div>
      </div>
      {created && (
        <p className={styles.success} role="status">
          Tipo de pão criado e oculto. Confira o preview abaixo e publique quando estiver pronto.
        </p>
      )}
      <BunVariantVisibility bunVariant={bunVariant} />
      <BunVariantForm key={bunVariant.updatedAt} builderId={builder.id} catalog={catalog} bunVariant={bunVariant} />
      <DeleteBunVariant bunVariant={bunVariant} />
    </>
  );
}
