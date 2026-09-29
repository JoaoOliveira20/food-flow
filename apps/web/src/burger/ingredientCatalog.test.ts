import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { BUN_VARIANTS, INGREDIENTS, type ImageSize } from "./ingredientCatalog";

const PUBLIC_DIRECTORY = join(__dirname, "..", "..", "public");
const PNG_WIDTH_OFFSET = 16;
const PNG_HEIGHT_OFFSET = 20;

function readPngSize(imagePath: string): ImageSize {
  const header = readFileSync(join(PUBLIC_DIRECTORY, imagePath)).subarray(0, 24);
  return { width: header.readUInt32BE(PNG_WIDTH_OFFSET), height: header.readUInt32BE(PNG_HEIGHT_OFFSET) };
}

const catalogImages = [
  ...INGREDIENTS.map((ingredient) => ({ name: ingredient.name, image: ingredient })),
  ...BUN_VARIANTS.flatMap((variant) => [
    { name: `${variant.name} (topo)`, image: variant.topBun },
    { name: `${variant.name} (base)`, image: variant.bottomBun },
  ]),
];

describe("catalog images", () => {
  it.each(catalogImages)("$name declares the natural size of its PNG", ({ image }) => {
    expect(image.imageSize).toEqual(readPngSize(image.imagePath));
  });
});
