// Catálogo de ingredientes e variantes de pão.
//
// Arquivo IDÊNTICO nos três experimentos (motion, gsap, react-spring).
// Se alterar aqui, replique nos outros dois.
//
// Cada item descreve como a imagem se encaixa na pilha, sem regras por
// ingrediente no código. As medidas usam a imagem inteira como referência
// (os PNGs já estão recortados com ~8px de margem transparente):
//
//   width    largura de exibição em px, na escala base da composição (BASE_WIDTH).
//   surface  fração da altura, a partir da base da imagem, onde a próxima
//            camada se apoia (a "face de cima" visível do ingrediente).
//   sink     fração da própria altura que afunda abaixo da superfície da
//            camada de baixo, para as camadas se encaixarem sem vãos.

export type AssetSize = { w: number; h: number };

export type LayerShape = {
  width: number;
  surface: number;
  sink: number;
};

export type Ingredient = LayerShape & {
  id: string;
  name: string;
  src: string;
  size: AssetSize;
};

export type BunVariant = {
  id: string;
  name: string;
  top: { src: string; size: AssetSize };
  bottom: { src: string; size: AssetSize };
};

const asset = (file: string) => `/assets/ingredients/${file}.png`;

export const INGREDIENTS: Ingredient[] = [
  { id: "beef", name: "Carne", src: asset("beef-patty"), size: { w: 336, h: 198 }, width: 292, surface: 0.5, sink: 0.1 },
  { id: "cheddar", name: "Cheddar", src: asset("cheddar"), size: { w: 366, h: 174 }, width: 304, surface: 0.4, sink: 0.3 },
  { id: "swiss", name: "Queijo suíço", src: asset("swiss-cheese"), size: { w: 336, h: 179 }, width: 296, surface: 0.4, sink: 0.3 },
  { id: "bacon", name: "Bacon", src: asset("bacon"), size: { w: 407, h: 216 }, width: 300, surface: 0.32, sink: 0.22 },
  { id: "lettuce", name: "Alface", src: asset("lettuce"), size: { w: 385, h: 208 }, width: 318, surface: 0.4, sink: 0.24 },
  { id: "tomato", name: "Tomate", src: asset("tomato"), size: { w: 328, h: 177 }, width: 282, surface: 0.42, sink: 0.16 },
  { id: "onion", name: "Cebola roxa", src: asset("red-onion"), size: { w: 343, h: 162 }, width: 276, surface: 0.36, sink: 0.16 },
  { id: "pickles", name: "Picles", src: asset("pickles"), size: { w: 289, h: 156 }, width: 240, surface: 0.34, sink: 0.2 },
  { id: "egg", name: "Ovo", src: asset("fried-egg"), size: { w: 325, h: 160 }, width: 280, surface: 0.32, sink: 0.2 },
  { id: "mayo", name: "Maionese", src: asset("mayonnaise"), size: { w: 200, h: 138 }, width: 156, surface: 0.46, sink: 0.18 },
  { id: "ketchup", name: "Ketchup", src: asset("ketchup"), size: { w: 201, h: 135 }, width: 156, surface: 0.46, sink: 0.18 },
  { id: "mustard", name: "Mostarda", src: asset("mustard"), size: { w: 198, h: 135 }, width: 156, surface: 0.46, sink: 0.18 },
  { id: "middle-bun", name: "Pão do meio", src: asset("middle-bun"), size: { w: 335, h: 138 }, width: 296, surface: 0.56, sink: 0.1 },
];

// Forma comum aos pães de todas as variantes; só a imagem muda.
export const BUN_TOP_SHAPE: LayerShape = { width: 318, surface: 1, sink: 0.14 };
export const BUN_BOTTOM_SHAPE: LayerShape = { width: 300, surface: 0.5, sink: 0 };

export const BUN_VARIANTS: BunVariant[] = [
  {
    id: "classic",
    name: "Clássico",
    top: { src: asset("bun-top-classic"), size: { w: 375, h: 208 } },
    bottom: { src: asset("bun-bottom-classic"), size: { w: 336, h: 146 } },
  },
  {
    id: "brioche",
    name: "Brioche",
    top: { src: asset("bun-top-brioche"), size: { w: 345, h: 202 } },
    bottom: { src: asset("bun-bottom-brioche"), size: { w: 327, h: 146 } },
  },
  {
    id: "multigrain",
    name: "Multigrãos",
    top: { src: asset("bun-top-multigrain"), size: { w: 350, h: 220 } },
    bottom: { src: asset("bun-bottom-multigrain"), size: { w: 345, h: 141 } },
  },
  {
    id: "charcoal",
    name: "Escuro",
    top: { src: asset("bun-top-charcoal"), size: { w: 338, h: 205 } },
    bottom: { src: asset("bun-bottom-charcoal"), size: { w: 321, h: 141 } },
  },
];

const byId = new Map(INGREDIENTS.map((ingredient) => [ingredient.id, ingredient]));
const bunById = new Map(BUN_VARIANTS.map((variant) => [variant.id, variant]));

export function getIngredient(id: string): Ingredient {
  const ingredient = byId.get(id);
  if (!ingredient) throw new Error(`Ingrediente desconhecido: ${id}`);
  return ingredient;
}

export function getBunVariant(id: string): BunVariant {
  const variant = bunById.get(id);
  if (!variant) throw new Error(`Variante de pão desconhecida: ${id}`);
  return variant;
}
