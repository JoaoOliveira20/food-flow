import Link from "next/link";
import { getAdminBuilder, getAdminCatalog, listBunVariants, listIngredients, listPresets } from "@/api/admin/queries";
import { RecipePreview } from "@/components/burger-builder/RecipePreview";
import { AdminStatus } from "@/components/admin/AdminStatus";
import { CatalogBrowser, type CatalogItem } from "@/components/admin/CatalogBrowser";
import { Icon } from "@/components/admin/Icon";
import { PageHeader } from "@/components/admin/PageHeader";
import { presetRecipe } from "@/components/admin/presetRecipe";
import { presetStatus } from "@/components/admin/presetStatus";
import { PresetStatusPill } from "@/components/admin/StatusPill";
import styles from "@/components/admin/admin.module.css";

export const metadata = { title: "Presets" };

export default async function PresetsPage() {
  const builder = await getAdminBuilder();
  if (!builder) return <AdminStatus title="Nenhum montador cadastrado" message="Rode os dados iniciais da API." />;
  const [ingredients, bunVariants, presets] = await Promise.all([
    listIngredients(builder.id),
    listBunVariants(builder.id),
    listPresets(builder.id),
  ]);
  const catalog = getAdminCatalog(builder, { bunVariants, ingredients });
  const bunNames = new Map(bunVariants.map((variant) => [variant.id, variant.name.toLowerCase()]));

  const items = presets.map(
    (preset): CatalogItem => ({
      key: String(preset.id),
      href: `/admin/presets/${preset.id}`,
      title: preset.name,
      meta: `${preset.ingredientIds.length} ${preset.ingredientIds.length === 1 ? "ingrediente" : "ingredientes"} · pão ${bunNames.get(preset.bunVariantId) ?? ""}`,
      filter: presetStatus(preset),
      badge: <PresetStatusPill status={presetStatus(preset)} />,
      media: catalog ? <RecipePreview catalog={catalog} recipe={presetRecipe(preset)} className="" /> : null,
    }),
  );
  const newButton = (
    <Link href="/admin/presets/new" className={styles.buttonPrimary}>
      <Icon name="plus" />
      Novo preset
    </Link>
  );

  return (
    <>
      <PageHeader
        title="Presets"
        description="Hambúrgueres prontos que o público escolhe no montador. Novos presets começam ocultos até serem publicados; a composição inicial é o que aparece ao abrir."
        actions={newButton}
      />
      <CatalogBrowser
        items={items}
        filters={[
          { value: "published", label: "Publicados" },
          { value: "hidden", label: "Ocultos" },
          { value: "unavailable", label: "Indisponíveis" },
          { value: "initial", label: "Inicial" },
        ]}
        searchLabel="Buscar preset"
        emptyIcon="preset"
        emptyTitle="Nenhum preset"
        emptyText="Monte um hambúrguer no editor e salve como preset."
        emptyAction={newButton}
      />
    </>
  );
}
