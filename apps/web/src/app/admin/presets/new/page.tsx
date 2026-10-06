import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdminBuilder, getAdminCatalog, listIngredients } from "@/api/admin/queries";
import { AdminStatus } from "@/components/admin/AdminStatus";
import { PresetForm } from "@/components/admin/PresetForm";
import styles from "@/components/admin/admin.module.css";

export default async function NewPresetPage() {
  const builder = await getAdminBuilder();
  if (!builder) notFound();
  const ingredients = await listIngredients(builder.id);
  const catalog = await getAdminCatalog(builder, ingredients);

  return (
    <>
      <div className={styles.pageHeader}>
        <div>
          <p className={styles.breadcrumb}>
            <Link href="/admin">Painel</Link> / Novo preset
          </p>
          <h1 className={styles.pageTitle}>Novo preset</h1>
          <p className={styles.pageSubtitle}>Aparece no montador assim que é salvo, se todos os ingredientes forem visíveis.</p>
        </div>
      </div>
      {catalog ? (
        <PresetForm builderId={builder.id} maxLayers={builder.maxLayers} catalog={catalog} ingredients={ingredients} preset={null} />
      ) : (
        <AdminStatus title="Sem tipos de pão" message="Cadastre um tipo de pão antes de criar presets." />
      )}
    </>
  );
}
