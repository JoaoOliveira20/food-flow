import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { getAdminBuilder, getAdminCatalog, listBunVariants, listIngredients, listPresets } from "@/api/admin/queries";
import type { AdminImage } from "@/api/admin/types";
import { RecipePreview } from "@/components/burger-builder/RecipePreview";
import { AdminStatus } from "@/components/admin/AdminStatus";
import { Icon, type IconName } from "@/components/admin/Icon";
import { PageHeader } from "@/components/admin/PageHeader";
import { presetRecipe } from "@/components/admin/presetRecipe";
import { relativeTime } from "@/components/admin/relativeTime";
import styles from "@/components/admin/admin.module.css";

type Row = {
  key: string;
  href: string;
  title: string;
  meta: string;
  media: ReactNode;
  updatedAt: string;
};

function Thumb({ image }: { image: AdminImage }) {
  return <Image src={image.url} alt="" width={image.width} height={image.height} unoptimized />;
}

function Kpi({
  href,
  icon,
  label,
  value,
  part,
  caption,
}: {
  href: string;
  icon: IconName;
  label: string;
  value: number;
  part: number;
  caption: string;
}) {
  const ratio = value === 0 ? 0 : Math.round((part / value) * 100);
  return (
    <Link href={href} className={`${styles.panel} ${styles.kpi}`}>
      <span className={styles.kpiLabel}>
        <Icon name={icon} />
        {label}
      </span>
      <span className={styles.kpiValue}>{value}</span>
      <span className={styles.kpiMeter} aria-hidden="true">
        <span style={{ width: `${ratio}%` }} />
      </span>
      <span className={styles.kpiCaption}>{caption}</span>
    </Link>
  );
}

function RowList({ rows, end }: { rows: Row[]; end: (row: Row) => ReactNode }) {
  return (
    <ul className={styles.rows}>
      {rows.map((row) => (
        <li key={row.key}>
          <Link href={row.href} className={styles.row}>
            <span className={styles.rowMedia}>{row.media}</span>
            <span className={styles.rowText}>
              <span className={styles.rowTitle}>{row.title}</span>
              <span className={styles.rowMeta}>{row.meta}</span>
            </span>
            <span className={styles.rowEnd}>{end(row)}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export default async function AdminOverview() {
  const builder = await getAdminBuilder();
  if (!builder) {
    return (
      <AdminStatus
        title="Nenhum montador cadastrado"
        message="Rode os dados iniciais da API (kool run setup em apps/api) e recarregue a página."
      />
    );
  }

  const [ingredients, bunVariants, presets] = await Promise.all([
    listIngredients(builder.id),
    listBunVariants(builder.id),
    listPresets(builder.id),
  ]);
  const catalog = getAdminCatalog(builder, { bunVariants, ingredients });
  const presetMedia = (preset: (typeof presets)[number]) =>
    catalog ? <RecipePreview catalog={catalog} recipe={presetRecipe(preset)} className="" /> : null;

  const ingredientRows = ingredients.map(
    (item): Row => ({
      key: `ingredient-${item.id}`,
      href: `/admin/ingredients/${item.id}`,
      title: item.name,
      meta: "Ingrediente",
      media: <Thumb image={item.image} />,
      updatedAt: item.updatedAt,
    }),
  );
  const bunRows = bunVariants.map(
    (item): Row => ({
      key: `bun-${item.id}`,
      href: `/admin/bun-variants/${item.id}`,
      title: item.name,
      meta: "Tipo de pão",
      media: <Thumb image={item.topImage} />,
      updatedAt: item.updatedAt,
    }),
  );
  const presetRows = presets.map(
    (item): Row => ({
      key: `preset-${item.id}`,
      href: `/admin/presets/${item.id}`,
      title: item.name,
      meta: item.isInitial ? "Composição inicial" : "Preset",
      media: presetMedia(item),
      updatedAt: item.updatedAt,
    }),
  );

  const attention: Row[] = [
    ...ingredientRows
      .filter((_, index) => !ingredients[index].isVisible)
      .map((row) => ({ ...row, meta: "Ingrediente oculto · publique para aparecer no montador" })),
    ...bunRows
      .filter((_, index) => !bunVariants[index].isVisible)
      .map((row) => ({ ...row, meta: "Tipo de pão oculto · publique para aparecer no montador" })),
    ...presetRows
      .filter((_, index) => !presets[index].isAvailable)
      .map((row) => ({ ...row, meta: "Preset fora do montador · leva pão ou ingrediente oculto" })),
  ];
  const recent = [...ingredientRows, ...bunRows, ...presetRows]
    .sort((first, second) => second.updatedAt.localeCompare(first.updatedAt))
    .slice(0, 6);

  const visibleIngredients = ingredients.filter((item) => item.isVisible).length;
  const visibleBuns = bunVariants.filter((item) => item.isVisible).length;
  const availablePresets = presets.filter((item) => item.isAvailable).length;

  return (
    <>
      <PageHeader
        title="Visão geral"
        description={`Montador de ${builder.name.toLowerCase()} · o que está publicado, o que precisa de atenção e o que mudou por último.`}
        actions={
          <>
            <a href="/" target="_blank" rel="noopener" className={styles.button}>
              <Icon name="external" />
              Abrir montador
            </a>
            <Link href="/admin/ingredients/new" className={styles.buttonPrimary}>
              <Icon name="plus" />
              Novo ingrediente
            </Link>
          </>
        }
      />

      <section className={styles.kpis} aria-label="Indicadores">
        <Kpi
          href="/admin/ingredients"
          icon="ingredient"
          label="Ingredientes"
          value={ingredients.length}
          part={visibleIngredients}
          caption={`${visibleIngredients} publicados · ${ingredients.length - visibleIngredients} ocultos`}
        />
        <Kpi
          href="/admin/bun-variants"
          icon="bun"
          label="Tipos de pão"
          value={bunVariants.length}
          part={visibleBuns}
          caption={`${visibleBuns} publicados · ${bunVariants.length - visibleBuns} ocultos`}
        />
        <Kpi
          href="/admin/presets"
          icon="preset"
          label="Presets"
          value={presets.length}
          part={availablePresets}
          caption={`${availablePresets} disponíveis no montador`}
        />
        <Kpi
          href="/admin/presets"
          icon="sparkle"
          label="Camadas por hambúrguer"
          value={builder.maxLayers}
          part={builder.maxLayers}
          caption="Limite do montador"
        />
      </section>

      <div className={styles.overviewGrid}>
        <section className={styles.panel} aria-labelledby="attention-title">
          <div className={styles.panelHeader}>
            <div>
              <h2 id="attention-title" className={styles.panelTitle}>
                Precisa de atenção
              </h2>
              <p className={styles.panelHint}>Itens que não aparecem no montador público.</p>
            </div>
            {attention.length > 0 && <span className={`${styles.status} ${styles.statusWarning}`}>{attention.length}</span>}
          </div>
          {attention.length === 0 ? (
            <p className={styles.allGood}>
              <Icon name="checkCircle" />
              Tudo publicado e disponível no montador.
            </p>
          ) : (
            <RowList
              rows={attention}
              end={() => (
                <>
                  Revisar <Icon name="chevronRight" />
                </>
              )}
            />
          )}
        </section>

        <section className={styles.panel} aria-labelledby="recent-title">
          <div className={styles.panelHeader}>
            <div>
              <h2 id="recent-title" className={styles.panelTitle}>
                Editados recentemente
              </h2>
              <p className={styles.panelHint}>As últimas alterações no catálogo.</p>
            </div>
          </div>
          <RowList rows={recent} end={(row) => relativeTime(row.updatedAt)} />
        </section>
      </div>

      <section className={styles.quickActions} aria-label="Criar">
        {(
          [
            ["/admin/ingredients/new", "ingredient", "Novo ingrediente", "Envie a foto e ajuste o encaixe na pilha."],
            ["/admin/bun-variants/new", "bun", "Novo tipo de pão", "Topo e base, comparados com os pães atuais."],
            ["/admin/presets/new", "preset", "Novo preset", "Monte no próprio montador e salve."],
          ] as const
        ).map(([href, icon, title, text]) => (
          <Link key={href} href={href} className={`${styles.panel} ${styles.quickAction}`}>
            <span className={styles.quickIcon}>
              <Icon name={icon} />
            </span>
            <span>
              <span className={styles.quickTitle}>{title}</span>
              <span className={styles.quickText}>{text}</span>
            </span>
          </Link>
        ))}
      </section>
    </>
  );
}
