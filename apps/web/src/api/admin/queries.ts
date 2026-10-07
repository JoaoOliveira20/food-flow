import { connection } from "next/server";
import type { BuilderCatalog } from "@/burger/catalog";
import { toBuilderCatalog } from "../builderCatalog";
import { serverApiUrl } from "../config";
import type { AdminBuilder, AdminBunVariant, AdminIngredient, AdminPreset } from "./types";

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

export async function listBunVariants(builderId: number): Promise<AdminBunVariant[]> {
  return (await get<AdminBunVariant[]>(`/admin/builders/${builderId}/bun-variants`)) ?? [];
}

export async function getBunVariant(bunVariantId: number): Promise<AdminBunVariant | null> {
  return get<AdminBunVariant>(`/admin/bun-variants/${bunVariantId}`);
}

export async function listPresets(builderId: number): Promise<AdminPreset[]> {
  return (await get<AdminPreset[]>(`/admin/builders/${builderId}/presets`)) ?? [];
}

export async function getPreset(presetId: number): Promise<AdminPreset | null> {
  return get<AdminPreset>(`/admin/presets/${presetId}`);
}

const HIDDEN_SUFFIX = " (oculto)";

function markHidden<T extends { name: string; isVisible: boolean }>(item: T): T {
  return item.isVisible ? item : { ...item, name: `${item.name}${HIDDEN_SUFFIX}` };
}

/**
 * Catalog used by the admin previews and the preset editor: every bun variant and
 * ingredient of the builder, hidden ones included and marked in their names, and the
 * given presets. Null when the builder has no bun variant.
 */
export function getAdminCatalog(
  builder: AdminBuilder,
  { bunVariants, ingredients, presets = [] }: { bunVariants: AdminBunVariant[]; ingredients: AdminIngredient[]; presets?: AdminPreset[] },
): BuilderCatalog | null {
  const firstBunVariant = bunVariants[0];
  if (!firstBunVariant) return null;
  return toBuilderCatalog({
    slug: builder.slug,
    name: builder.name,
    maxLayers: builder.maxLayers,
    bunVariants: bunVariants.map(markHidden),
    ingredients: ingredients.map(markHidden),
    presets,
    initialRecipe: { bunVariantId: firstBunVariant.id, ingredientIds: [] },
  });
}
