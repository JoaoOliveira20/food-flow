import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdminBuilder, getAdminCatalog, listBunVariants, listIngredients, listPresets } from "@/api/admin/queries";
import { AdminStatus } from "@/components/admin/AdminStatus";
import { BunVariantForm } from "@/components/admin/BunVariantForm";
import styles from "@/components/admin/admin.module.css";

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
      <div className={styles.pageHeader}>
        <div>
          <p className={styles.breadcrumb}>
            <Link href="/admin">Painel</Link> / Novo tipo de pão
          </p>
          <h1 className={styles.pageTitle}>Novo tipo de pão</h1>
          <p className={styles.pageSubtitle}>Ele começa oculto: só aparece no montador depois de publicado.</p>
        </div>
      </div>
      {catalog ? (
        <BunVariantForm builderId={builder.id} catalog={catalog} bunVariant={null} />
      ) : (
        <AdminStatus title="Montador sem pães" message="Rode os dados iniciais da API (kool run setup em apps/api)." />
      )}
    </>
  );
}
