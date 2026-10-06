import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdminBuilder, getAdminCatalog, listIngredients } from "@/api/admin/queries";
import { IngredientForm } from "@/components/admin/IngredientForm";
import styles from "@/components/admin/admin.module.css";

export default async function NewIngredientPage() {
  const builder = await getAdminBuilder();
  if (!builder) notFound();
  const catalog = await getAdminCatalog(builder, await listIngredients(builder.id));

  return (
    <>
      <div className={styles.pageHeader}>
        <div>
          <p className={styles.breadcrumb}>
            <Link href="/admin">Painel</Link> / Novo ingrediente
          </p>
          <h1 className={styles.pageTitle}>Novo ingrediente</h1>
          <p className={styles.pageSubtitle}>Ele começa oculto: só aparece no montador depois de publicado.</p>
        </div>
      </div>
      <IngredientForm builderId={builder.id} catalog={catalog} ingredient={null} />
    </>
  );
}
