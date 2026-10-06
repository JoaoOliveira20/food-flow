import Link from "next/link";
import { getAdminBuilder, getAdminCatalog, listIngredients, listPresets } from "@/api/admin/queries";
import { findBunVariant } from "@/burger/catalog";
import { RecipePreview } from "@/components/burger-builder/RecipePreview";
import { AdminStatus } from "@/components/admin/AdminStatus";
import { IngredientThumbnail } from "@/components/admin/IngredientThumbnail";
import { presetRecipe } from "@/components/admin/presetRecipe";
import styles from "@/components/admin/admin.module.css";

function pluralize(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

export default async function AdminDashboard() {
  const builder = await getAdminBuilder();
  if (!builder) {
    return (
      <AdminStatus
        title="Nenhum montador cadastrado"
        message="Rode os dados iniciais da API (kool run setup em apps/api) e recarregue a página."
      />
    );
  }

  const [ingredients, presets] = await Promise.all([listIngredients(builder.id), listPresets(builder.id)]);
  const catalog = await getAdminCatalog(builder, ingredients);

  return (
    <>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Montador de {builder.name.toLowerCase()}</h1>
          <p className={styles.pageSubtitle}>Ingredientes e presets que aparecem no montador público.</p>
        </div>
      </div>

      <section className={styles.stats} aria-label="Resumo">
        <div className={styles.stat}>
          <span className={styles.statValue}>{builder.ingredientsCount}</span>
          <span className={styles.statLabel}>
            Ingredientes · {pluralize(builder.visibleIngredientsCount, "visível", "visíveis")}
          </span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statValue}>{builder.presetsCount}</span>
          <span className={styles.statLabel}>Presets · inclui a composição inicial</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statValue}>{builder.maxLayers}</span>
          <span className={styles.statLabel}>Camadas no máximo por hambúrguer</span>
        </div>
      </section>

      <section className={styles.card} aria-labelledby="ingredients-title">
        <div className={styles.cardHeader}>
          <h2 id="ingredients-title" className={styles.cardTitle}>
            Ingredientes
          </h2>
          <Link href="/admin/ingredients/new" className={styles.buttonPrimary}>
            + Novo ingrediente
          </Link>
        </div>
        {ingredients.length === 0 ? (
          <p className={styles.empty}>Nenhum ingrediente cadastrado.</p>
        ) : (
          <ul className={styles.list}>
            {ingredients.map((ingredient) => (
              <li key={ingredient.id} className={styles.listItem}>
                <IngredientThumbnail image={ingredient.image} />
                <div>
                  <div className={styles.itemName}>{ingredient.name}</div>
                  <div className={styles.itemMeta}>
                    <span className={`${styles.badge} ${ingredient.isVisible ? styles.badgeVisible : styles.badgeHidden}`}>
                      {ingredient.isVisible ? "Visível" : "Oculto"}
                    </span>
                    <span>{pluralize(ingredient.presetsCount ?? 0, "preset usa", "presets usam")}</span>
                  </div>
                </div>
                <Link href={`/admin/ingredients/${ingredient.id}`} className={styles.button}>
                  Editar
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className={styles.card} aria-labelledby="presets-title">
        <div className={styles.cardHeader}>
          <h2 id="presets-title" className={styles.cardTitle}>
            Presets
          </h2>
          <Link href="/admin/presets/new" className={styles.buttonPrimary}>
            + Novo preset
          </Link>
        </div>
        {presets.length === 0 ? (
          <p className={styles.empty}>Nenhum preset cadastrado.</p>
        ) : (
          <ul className={styles.list}>
            {presets.map((preset) => (
              <li key={preset.id} className={styles.listItem}>
                <span className={styles.thumbnail}>
                  {catalog && <RecipePreview catalog={catalog} recipe={presetRecipe(preset)} className="" />}
                </span>
                <div>
                  <div className={styles.itemName}>{preset.name}</div>
                  <div className={styles.itemMeta}>
                    {preset.isInitial && <span className={`${styles.badge} ${styles.badgeVisible}`}>Composição inicial</span>}
                    {!preset.isAvailable && (
                      <span className={`${styles.badge} ${styles.badgeWarning}`}>Indisponível: tem ingrediente oculto</span>
                    )}
                    <span>{pluralize(preset.ingredientIds.length, "ingrediente", "ingredientes")}</span>
                    {catalog && <span>pão {findBunVariant(catalog, String(preset.bunVariantId)).name.toLowerCase()}</span>}
                  </div>
                </div>
                <Link href={`/admin/presets/${preset.id}`} className={styles.button}>
                  Editar
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
