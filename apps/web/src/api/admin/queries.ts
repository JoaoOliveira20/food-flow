import { connection } from "next/server";
import type { BuilderCatalog } from "@/burger/catalog";
import { fetchBuilderCatalogData, toBuilderCatalog } from "../builderCatalog";
import { serverApiUrl } from "../config";
import type { AdminBuilder, AdminIngredient, AdminPreset } from "./types";

async function get<T>(path: string): Promise<T | null> {
  await connection();
  const response = await fetch(`${serverApiUrl()}/api${path}`, { headers: { Accept: "application/json" } });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`Admin request to ${path} failed with status ${response.status}.`);
  const { data } = (await response.json()) as { data: T };
  return data;
}

export async function getAdminBuilder(): Promise<AdminBuilder | null> {
  const builders = await get<AdminBuilder[]>("/admin/builders");
  return builders?.[0] ?? null;
}

export async function listIngredients(builderId: number): Promise<AdminIngredient[]> {
  return (await get<AdminIngredient[]>(`/admin/builders/${builderId}/ingredients`)) ?? [];
}

export async function getIngredient(ingredientId: number): Promise<AdminIngredient | null> {
  return get<AdminIngredient>(`/admin/ingredients/${ingredientId}`);
}

export async function listPresets(builderId: number): Promise<AdminPreset[]> {
  return (await get<AdminPreset[]>(`/admin/builders/${builderId}/presets`)) ?? [];
}

export async function getPreset(presetId: number): Promise<AdminPreset | null> {
  return get<AdminPreset>(`/admin/presets/${presetId}`);
}

const HIDDEN_SUFFIX = " (oculto)";

/**
 * Catalog used by the admin previews and the preset editor: every ingredient of the
 * builder, hidden ones included and marked in their names, the given presets and the
 * bun variants of the public catalog. Null when the builder has no bun variant.
 */
export async function getAdminCatalog(
  builder: AdminBuilder,
  ingredients: AdminIngredient[],
  presets: AdminPreset[] = [],
): Promise<BuilderCatalog | null> {
  const data = await fetchBuilderCatalogData(builder.slug);
  if (!data) return null;
  const markedIngredients = ingredients.map((ingredient) =>
    ingredient.isVisible ? ingredient : { ...ingredient, name: `${ingredient.name}${HIDDEN_SUFFIX}` },
  );
  return toBuilderCatalog({ ...data, ingredients: markedIngredients, presets });
}
