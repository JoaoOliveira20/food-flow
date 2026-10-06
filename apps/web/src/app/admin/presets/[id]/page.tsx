import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdminBuilder, getAdminCatalog, getPreset, listIngredients } from "@/api/admin/queries";
import { AdminStatus } from "@/components/admin/AdminStatus";
import { DeletePreset } from "@/components/admin/DeletePreset";
import { PresetForm } from "@/components/admin/PresetForm";
import styles from "@/components/admin/admin.module.css";

export default async function EditPresetPage({ params, searchParams }: PageProps<"/admin/presets/[id]">) {
  const { id } = await params;
  const { created } = await searchParams;
  const presetId = Number(id);
  if (!Number.isInteger(presetId) || presetId <= 0) notFound();

  const [builder, preset] = await Promise.all([getAdminBuilder(), getPreset(presetId)]);
  if (!builder || !preset) notFound();
  const ingredients = await listIngredients(builder.id);
  const catalog = await getAdminCatalog(builder, ingredients);

  return (
    <>
      <div className={styles.pageHeader}>
        <div>
          <p className={styles.breadcrumb}>
            <Link href="/admin">Painel</Link> / Presets / {preset.name}
          </p>
          <h1 className={styles.pageTitle}>{preset.name}</h1>
          <p className={styles.pageSubtitle}>
            {preset.isInitial
              ? "Composição inicial: é o hambúrguer que aparece ao abrir o montador (não aparece no painel de presets)."
              : preset.isAvailable
                ? "Disponível no montador."
                : "Indisponível no montador: contém ingrediente oculto."}
          </p>
        </div>
      </div>
      {created && (
        <p className={styles.success} role="status">
          Preset criado.
        </p>
      )}
      {catalog ? (
        <PresetForm
          key={preset.updatedAt}
          builderId={builder.id}
          maxLayers={builder.maxLayers}
          catalog={catalog}
          ingredients={ingredients}
          preset={preset}
        />
      ) : (
        <AdminStatus title="Sem tipos de pão" message="Cadastre um tipo de pão para editar presets." />
      )}
      <DeletePreset preset={preset} />
    </>
  );
}
