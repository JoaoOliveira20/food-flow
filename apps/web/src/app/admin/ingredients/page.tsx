import Image from "next/image";
import Link from "next/link";
import { getAdminBuilder, listIngredients } from "@/api/admin/queries";
import { AdminStatus } from "@/components/admin/AdminStatus";
import { CatalogBrowser, type CatalogItem } from "@/components/admin/CatalogBrowser";
import { Icon } from "@/components/admin/Icon";
import { PageHeader } from "@/components/admin/PageHeader";
import { VisibilityPill } from "@/components/admin/StatusPill";
import styles from "@/components/admin/admin.module.css";

export const metadata = { title: "Ingredientes" };

function usage(count: number): string {
  if (count === 0) return "Não usado em presets";
  return count === 1 ? "Usado em 1 preset" : `Usado em ${count} presets`;
}

export default async function IngredientsPage() {
  const builder = await getAdminBuilder();
  if (!builder) return <AdminStatus title="Nenhum montador cadastrado" message="Rode os dados iniciais da API." />;
  const ingredients = await listIngredients(builder.id);

  const items = ingredients.map(
    (ingredient): CatalogItem => ({
      key: String(ingredient.id),
      href: `/admin/ingredients/${ingredient.id}`,
      title: ingredient.name,
      meta: usage(ingredient.presetsCount ?? 0),
      filter: ingredient.isVisible ? "visible" : "hidden",
      badge: <VisibilityPill isVisible={ingredient.isVisible} />,
      media: (
        <Image
          src={ingredient.image.url}
          alt=""
          width={ingredient.image.width}
          height={ingredient.image.height}
          unoptimized
        />
      ),
    }),
  );
  const newButton = (
    <Link href="/admin/ingredients/new" className={styles.buttonPrimary}>
      <Icon name="plus" />
      Novo ingrediente
    </Link>
  );

  return (
    <>
      <PageHeader
        title="Ingredientes"
        description="Camadas que o público pode adicionar ao hambúrguer. Novos ingredientes começam ocultos até serem publicados."
        actions={newButton}
      />
      <CatalogBrowser
        items={items}
        filters={[
          { value: "visible", label: "Publicados" },
          { value: "hidden", label: "Ocultos" },
        ]}
        searchLabel="Buscar ingrediente"
        emptyIcon="ingredient"
        emptyTitle="Nenhum ingrediente ainda"
        emptyText="Cadastre o primeiro ingrediente com uma foto em PNG transparente."
        emptyAction={newButton}
      />
    </>
  );
}
