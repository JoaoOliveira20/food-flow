// Estado da composição e suas ações.
//
// Arquivo IDÊNTICO nos três experimentos. Não contém animação.
//
// Os pães superior e inferior não fazem parte de `layers`: são sempre
// renderizados e só mudam de variante. `layers` vai da base para o topo.

export type LayerInstance = {
  uid: string;
  ingredientId: string;
};

export type Composition = {
  layers: LayerInstance[];
  bunId: string;
  selectedUid: string | null;
  // Quando true, clicar num ingrediente disponível substitui a camada selecionada.
  replacing: boolean;
};

export type CompositionAction =
  | { type: "add"; ingredientId: string; uid: string }
  | { type: "duplicate"; uid: string; newUid: string }
  | { type: "remove"; uid: string }
  | { type: "replace"; ingredientId: string; newUid: string }
  | { type: "move"; uid: string; direction: "up" | "down" }
  | { type: "place"; source: DragSource; index: number }
  | { type: "select"; uid: string | null }
  | { type: "toggleReplacing" }
  | { type: "setBun"; bunId: string }
  | { type: "reset"; uids: string[] };

// O que está sendo arrastado: uma camada existente ou um ingrediente novo vindo
// do menu. O uid do ingrediente novo é criado no início do arraste, para que a
// prévia e a camada final sejam o mesmo elemento (sem remontar na soltura).
export type DragSource = { kind: "layer"; uid: string } | { kind: "new"; ingredientId: string; uid: string };

export const MAX_LAYERS = 14;

// Mesma ordem lógica do mockup, da base para o topo.
export const INITIAL_INGREDIENTS = ["beef", "cheddar", "onion", "tomato", "lettuce"];
export const INITIAL_BUN = "classic";

let uidCounter = 0;

// Gera IDs de instância. É impura: chame fora do reducer e passe o resultado na ação.
export function createUid(): string {
  uidCounter += 1;
  return `layer-${uidCounter}`;
}

export function createInitialComposition(uids: string[]): Composition {
  return {
    layers: INITIAL_INGREDIENTS.map((ingredientId, index) => ({ uid: uids[index], ingredientId })),
    bunId: INITIAL_BUN,
    selectedUid: null,
    replacing: false,
  };
}

// IDs fixos no primeiro render para o HTML do servidor e do cliente coincidirem.
export const INITIAL_COMPOSITION = createInitialComposition(INITIAL_INGREDIENTS.map((_, index) => `initial-${index}`));

// Camadas sem o item arrastado.
function layersWithout(layers: LayerInstance[], source: DragSource): LayerInstance[] {
  return source.kind === "layer" ? layers.filter((layer) => layer.uid !== source.uid) : layers;
}

// Função pura: coloca o item arrastado no índice `index` (0 = logo acima do pão
// inferior) entre as demais camadas. Usada tanto na prévia do arraste quanto
// na soltura, para que as duas produzam exatamente a mesma ordem.
export function placeDragged(layers: LayerInstance[], source: DragSource, index: number): LayerInstance[] {
  let moving: LayerInstance | undefined;
  if (source.kind === "layer") {
    moving = layers.find((layer) => layer.uid === source.uid);
  } else if (layers.length < MAX_LAYERS) {
    moving = { uid: source.uid, ingredientId: source.ingredientId };
  }
  if (!moving) return layers;
  const rest = layersWithout(layers, source);
  const at = Math.max(0, Math.min(index, rest.length));
  return [...rest.slice(0, at), moving, ...rest.slice(at)];
}

export function compositionReducer(state: Composition, action: CompositionAction): Composition {
  switch (action.type) {
    case "add": {
      if (state.layers.length >= MAX_LAYERS) return state;
      // Novo ingrediente entra no topo da pilha, logo abaixo do pão superior.
      const layers = [...state.layers, { uid: action.uid, ingredientId: action.ingredientId }];
      return { ...state, layers };
    }
    case "duplicate": {
      const index = state.layers.findIndex((layer) => layer.uid === action.uid);
      if (index === -1 || state.layers.length >= MAX_LAYERS) return state;
      const copy = { uid: action.newUid, ingredientId: state.layers[index].ingredientId };
      const layers = [...state.layers.slice(0, index + 1), copy, ...state.layers.slice(index + 1)];
      return { ...state, layers, selectedUid: copy.uid };
    }
    case "remove":
      return {
        ...state,
        layers: state.layers.filter((layer) => layer.uid !== action.uid),
        selectedUid: state.selectedUid === action.uid ? null : state.selectedUid,
        replacing: false,
      };
    case "replace": {
      if (!state.selectedUid) return state;
      // A nova instância ocupa a mesma posição lógica da anterior.
      const layers = state.layers.map((layer) =>
        layer.uid === state.selectedUid ? { uid: action.newUid, ingredientId: action.ingredientId } : layer,
      );
      return { ...state, layers, selectedUid: action.newUid, replacing: false };
    }
    case "move": {
      const index = state.layers.findIndex((layer) => layer.uid === action.uid);
      const target = action.direction === "up" ? index + 1 : index - 1;
      if (index === -1 || target < 0 || target >= state.layers.length) return state;
      const layers = [...state.layers];
      [layers[index], layers[target]] = [layers[target], layers[index]];
      return { ...state, layers };
    }
    case "place": {
      const layers = placeDragged(state.layers, action.source, action.index);
      if (layers === state.layers) return state;
      return { ...state, layers, selectedUid: action.source.uid, replacing: false };
    }
    case "select":
      return {
        ...state,
        selectedUid: action.uid === state.selectedUid ? null : action.uid,
        replacing: false,
      };
    case "toggleReplacing":
      return state.selectedUid ? { ...state, replacing: !state.replacing } : state;
    case "setBun":
      return { ...state, bunId: action.bunId };
    case "reset":
      return createInitialComposition(action.uids);
  }
}
