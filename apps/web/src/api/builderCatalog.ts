import type { BuilderCatalog } from "@/burger/catalog";

type ApiImage = {
  url: string;
  width: number;
  height: number;
};

type ApiRecipe = {
  bunVariantId: number;
  ingredientIds: number[];
};

export type ApiBuilderCatalog = {
  slug: string;
  name: string;
  maxLayers: number;
  bunVariants: { id: number; slug: string; name: string; topImage: ApiImage; bottomImage: ApiImage }[];
  ingredients: {
    id: number;
    slug: string;
    name: string;
    image: ApiImage;
    shape: { displayWidth: number; restingSurfaceRatio: number; sinkRatio: number };
  }[];
  presets: ({ id: number; name: string } & ApiRecipe)[];
  initialRecipe: ApiRecipe | null;
};

function toImage({ url, width, height }: ApiImage) {
  return { imagePath: url, imageSize: { width, height } };
}

function toRecipe({ bunVariantId, ingredientIds }: ApiRecipe) {
  return { bunVariantId: String(bunVariantId), ingredientIds: ingredientIds.map(String) };
}

export function toBuilderCatalog(data: ApiBuilderCatalog): BuilderCatalog | null {
  if (!data.initialRecipe) return null;

  return {
    maxLayers: data.maxLayers,
    bunVariants: data.bunVariants.map((variant) => ({
      id: String(variant.id),
      name: variant.name,
      topBun: toImage(variant.topImage),
      bottomBun: toImage(variant.bottomImage),
    })),
    ingredients: data.ingredients.map((ingredient) => ({
      id: String(ingredient.id),
      name: ingredient.name,
      ...toImage(ingredient.image),
      shape: ingredient.shape,
    })),
    presets: data.presets.map((preset) => ({ id: String(preset.id), name: preset.name, ...toRecipe(preset) })),
    initialRecipe: toRecipe(data.initialRecipe),
  };
}

function apiUrl(): string {
  const url = process.env.API_URL;
  if (!url) throw new Error("API_URL is not set. Copy apps/web/.env.example to apps/web/.env.local.");
  return url.replace(/\/+$/, "");
}

export type BuilderCatalogResult =
  | { status: "available"; catalog: BuilderCatalog }
  | { status: "unavailable" }
  | { status: "notFound" };

export async function fetchBuilderCatalog(slug: string): Promise<BuilderCatalogResult> {
  const response = await fetch(`${apiUrl()}/api/builders/${encodeURIComponent(slug)}`, {
    headers: { Accept: "application/json" },
  });

  if (response.status === 404) return { status: "notFound" };
  if (!response.ok) throw new Error(`Builder catalog request failed with status ${response.status}.`);

  const { data } = (await response.json()) as { data: ApiBuilderCatalog };
  const catalog = toBuilderCatalog(data);
  return catalog ? { status: "available", catalog } : { status: "unavailable" };
}
