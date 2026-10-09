import Image from "next/image";
import Link from "next/link";
import { getAdminBuilder, listBunVariants } from "@/api/admin/queries";
import { AdminStatus } from "@/components/admin/AdminStatus";
import { CatalogBrowser, type CatalogItem } from "@/components/admin/CatalogBrowser";
import { Icon } from "@/components/admin/Icon";
import { PageHeader } from "@/components/admin/PageHeader";
import { VisibilityPill } from "@/components/admin/StatusPill";
import styles from "@/components/admin/admin.module.css";

const EAGER_TILES = 8;

export const metadata = { title: "Tipos de pão" };

export default async function BunVariantsPage() {
  const builder = await getAdminBuilder();
  if (!builder) return <AdminStatus title="Nenhum montador cadastrado" message="Rode os dados iniciais da API." />;
  const bunVariants = await listBunVariants(builder.id);

  const items = bunVariants.map(
    (variant, index): CatalogItem => ({
      key: String(variant.id),
      href: `/admin/bun-variants/${variant.id}`,
      title: variant.name,
      meta:
        (variant.presetsCount ?? 0) === 0
          ? "Não usado em presets"
          : variant.presetsCount === 1
            ? "Usado em 1 preset"
            : `Usado em ${variant.presetsCount} presets`,
      filter: variant.isVisible ? "visible" : "hidden",
      badge: <VisibilityPill isVisible={variant.isVisible} />,
      media: (
        <span className={styles.tileStack}>
          <Image
            src={variant.topImage.url}
            alt=""
            width={variant.topImage.width}
            height={variant.topImage.height}
            loading={index < EAGER_TILES ? "eager" : "lazy"}
            unoptimized
          />
          <Image
            src={variant.bottomImage.url}
            alt=""
            width={variant.bottomImage.width}
            height={variant.bottomImage.height}
            loading={index < EAGER_TILES ? "eager" : "lazy"}
            unoptimized
          />
        </span>
      ),
    }),
  );
  const newButton = (
    <Link href="/admin/bun-variants/new" className={styles.buttonPrimary}>
      <Icon name="plus" />
      Novo tipo de pão
    </Link>
  );

  return (
    <>
      <PageHeader
        title="Tipos de pão"
        description="Topo e base que envolvem o hambúrguer. O montador precisa de pelo menos um tipo publicado."
        actions={newButton}
      />
      <CatalogBrowser
        items={items}
        filters={[
          { value: "visible", label: "Publicados" },
          { value: "hidden", label: "Ocultos" },
        ]}
        searchLabel="Buscar tipo de pão"
        emptyIcon="bun"
        emptyTitle="Nenhum tipo de pão"
        emptyText="Cadastre um pão com as imagens do topo e da base."
        emptyAction={newButton}
      />
    </>
  );
}
