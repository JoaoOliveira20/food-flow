// Cálculo de posicionamento da pilha.
//
// Arquivo IDÊNTICO nos três experimentos. Não contém animação: apenas
// transforma a composição em posições finais. Cada biblioteca decide
// como levar as camadas até essas posições.
//
// Coordenadas em px na escala base (BASE_WIDTH), com y medido a partir da
// base da composição, crescendo para cima.

import type { Composition } from "./composition";
import {
  BUN_BOTTOM_SHAPE,
  BUN_TOP_SHAPE,
  getBunVariant,
  getIngredient,
  type AssetSize,
  type LayerShape,
} from "./ingredients";

export const BASE_WIDTH = 340;
// Base da composição dentro do palco, como fração da altura do palco a partir
// de baixo. Usada pelo CSS inline de cada BurgerStage e pelo cálculo do arraste.
export const COMPOSITION_BOTTOM = 0.06;
// Altura mínima da faixa de clique, para camadas finas como os molhos.
const MIN_HIT_HEIGHT = 18;

export type PositionedLayer = {
  // Chave estável: uid da instância, ou "bun-top"/"bun-bottom".
  key: string;
  // Pães não são selecionáveis e reagem à troca de variante.
  kind: "bun" | "ingredient";
  name: string;
  src: string;
  width: number;
  height: number;
  // Distância da base da composição até a base da imagem.
  bottom: number;
  zIndex: number;
  // Faixa clicável (não se sobrepõe às vizinhas). null para os pães.
  hit: { bottom: number; height: number } | null;
};

export type BurgerLayout = {
  layers: PositionedLayer[];
  height: number;
};

type StackEntry = {
  key: string;
  name: string;
  src: string;
  size: AssetSize;
  shape: LayerShape;
  kind: PositionedLayer["kind"];
};

export function computeLayout(composition: Composition): BurgerLayout {
  const bun = getBunVariant(composition.bunId);

  const stack: StackEntry[] = [
    { key: "bun-bottom", name: `Pão inferior ${bun.name}`, ...bun.bottom, shape: BUN_BOTTOM_SHAPE, kind: "bun" },
    ...composition.layers.map((layer) => {
      const ingredient = getIngredient(layer.ingredientId);
      return {
        key: layer.uid,
        name: ingredient.name,
        src: ingredient.src,
        size: ingredient.size,
        shape: ingredient,
        kind: "ingredient" as const,
      };
    }),
    { key: "bun-top", name: `Pão superior ${bun.name}`, ...bun.top, shape: BUN_TOP_SHAPE, kind: "bun" },
  ];

  const layers: PositionedLayer[] = [];
  // Altura em que a próxima camada se apoia.
  let surface = 0;
  let height = 0;

  stack.forEach((entry, index) => {
    const { width, surface: surfaceRatio, sink } = entry.shape;
    const imageHeight = (width * entry.size.h) / entry.size.w;
    const bottom = Math.max(0, surface - sink * imageHeight);
    const nextSurface = bottom + surfaceRatio * imageHeight;

    let hit: PositionedLayer["hit"] = null;
    if (entry.kind === "ingredient") {
      const bandHeight = Math.max(MIN_HIT_HEIGHT, nextSurface - surface);
      hit = { bottom: surface + (nextSurface - surface - bandHeight) / 2, height: bandHeight };
    }

    layers.push({
      key: entry.key,
      kind: entry.kind,
      name: entry.name,
      src: entry.src,
      width,
      height: imageHeight,
      bottom,
      zIndex: index + 1,
      hit,
    });

    // A superfície nunca desce, mesmo que uma camada fina afunde muito.
    surface = Math.max(surface, nextSurface);
    height = Math.max(height, bottom + imageHeight);
  });

  return { layers, height };
}

// Escala para a composição caber no palco. Limitada para não ampliar
// demais os PNGs (~350px de largura original).
export function fitScale(layout: BurgerLayout, stage: { width: number; height: number }): number {
  const byWidth = (stage.width * 0.92) / BASE_WIDTH;
  const byHeight = (stage.height * 0.86) / layout.height;
  return Math.min(1.25, byWidth, byHeight);
}
