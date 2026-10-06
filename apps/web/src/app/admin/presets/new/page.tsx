import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdminBuilder, getAdminCatalog, listIngredients, listPresets } from "@/api/admin/queries";
import { AdminStatus } from "@/components/admin/AdminStatus";
import { PresetEditor } from "@/components/admin/PresetEditor";
import styles from "@/components/admin/admin.module.css";

export default async function NewPresetPage() {
  const builder = await getAdminBuilder();
  if (!builder) notFound();
  const [ingredients, presets] = await Promise.all([listIngredients(builder.id), listPresets(builder.id)]);
  const catalog = await getAdminCatalog(builder, ingredients, presets);
  const hiddenIngredientIds = ingredients.filter((ingredient) => !ingredient.isVisible).map((ingredient) => String(ingredient.id));

  return (
    <>
      <div className={styles.pageHeader}>
        <div>
          <p className={styles.breadcrumb}>
            <Link href="/admin">Painel</Link> / Novo preset
          </p>
          <h1 className={styles.pageTitle}>Novo preset</h1>
          <p className={styles.pageSubtitle}>
            Monte o hambúrguer como no montador: clique ou arraste ingredientes, escolha o pão ou comece a partir de um
            preset existente.
          </p>
        </div>
      </div>
      {catalog ? (
        <PresetEditor builderId={builder.id} catalog={catalog} hiddenIngredientIds={hiddenIngredientIds} preset={null} />
      ) : (
        <AdminStatus title="Sem tipos de pão" message="Cadastre um tipo de pão antes de criar presets." />
      )}
    </>
  );
}
