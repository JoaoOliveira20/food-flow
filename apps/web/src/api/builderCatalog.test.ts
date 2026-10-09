import { describe, expect, it } from "vitest";
import { toBuilderCatalog, type ApiBuilderCatalog } from "./builderCatalog";

const image = (name: string, width: number, height: number) => ({
  url: `http://localhost:8000/storage/${name}.png`,
  width,
  height,
});

const response: ApiBuilderCatalog = {
  slug: "burger",
  name: "Hambúrguer",
  maxLayers: 14,
  bunVariants: [
    { id: 1, slug: "classic", name: "Clássico", topImage: image("top", 375, 208), bottomImage: image("bottom", 336, 146) },
  ],
  ingredients: [
    {
      id: 7,
      slug: "ketchup",
      name: "Ketchup",
      image: image("ketchup", 1426, 350),
      shape: { displayWidth: 256, restingSurfaceRatio: 0.95, sinkRatio: 0.78 },
    },
  ],
  presets: [{ id: 3, name: "Duplo", bunVariantId: 1, ingredientIds: [7, 9, 7] }],
  initialRecipe: { bunVariantId: 1, ingredientIds: [7] },
};

describe("toBuilderCatalog", () => {
  it("maps the API response to the builder catalog with string identifiers", () => {
    expect(toBuilderCatalog(response)).toEqual({
      maxLayers: 14,
      bunVariants: [
        {
          id: "1",
          name: "Clássico",
          topBun: { imagePath: "http://localhost:8000/storage/top.png", imageSize: { width: 375, height: 208 } },
          bottomBun: { imagePath: "http://localhost:8000/storage/bottom.png", imageSize: { width: 336, height: 146 } },
        },
      ],
      ingredients: [
        {
          id: "7",
          name: "Ketchup",
          imagePath: "http://localhost:8000/storage/ketchup.png",
          imageSize: { width: 1426, height: 350 },
          shape: { displayWidth: 256, restingSurfaceRatio: 0.95, sinkRatio: 0.78 },
        },
      ],
      presets: [{ id: "3", name: "Duplo", bunVariantId: "1", ingredientIds: ["7", "9", "7"] }],
      initialRecipe: { bunVariantId: "1", ingredientIds: ["7"] },
    });
  });

  it("returns null when the builder has no bun variant to start from", () => {
    expect(toBuilderCatalog({ ...response, bunVariants: [], initialRecipe: null })).toBeNull();
  });
});
