// Estado e ações do microprotótipo (rota /prototipo, etapa anterior).
//
// Este arquivo é propositalmente IDÊNTICO nos três experimentos
// (motion, gsap, react-spring). Ele contém apenas lógica pura de lista,
// sem nenhuma animação, para que a comparação isole a biblioteca.
// Se alterar aqui, replique nos outros dois experimentos.

export type Layer = {
  id: number;
  label: string;
  color: string;
};

export type Action = "add" | "remove" | "reverse" | "reset";

// Dimensões compartilhadas do palco e das camadas (px).
export const STAGE_WIDTH = 320;
export const STAGE_HEIGHT = 440;
export const LAYER_WIDTH = 240;
export const LAYER_HEIGHT = 48;
// Distância vertical entre camadas; menor que a altura para gerar sobreposição.
export const LAYER_GAP = 40;
export const MAX_LAYERS = 8;

// Entrada: a camada surge acima da posição final, levemente girada.
export const ENTER_OFFSET_Y = -180;
export const ENTER_ROTATION = -8;

// Saída: a camada desliza para o lado.
export const EXIT_OFFSET_X = 140;
export const EXIT_ROTATION = 10;
export const EXIT_DURATION_S = 0.25;

// Spring de referência. Motion (stiffness/damping) e React Spring
// (tension/friction) usam o mesmo modelo massa-mola, então os valores equivalem.
// GSAP não tem spring nativo; usa um ease aproximado (ver page.tsx do gsap).
export const SPRING = { stiffness: 260, damping: 18 };

// Sequência rápida para testar interrupção de animações em andamento.
export const STRESS_SEQUENCE: Action[] = ["add", "add", "reverse", "remove", "add", "reverse", "remove"];
export const STRESS_INTERVAL_MS = 120;

const COLORS = ["#d9a45b", "#7a4a2c", "#f2c230", "#6fae4b", "#d8432f", "#b05c8e", "#e8d7b0"];

function makeLayer(id: number): Layer {
  return { id, label: `Camada ${id}`, color: COLORS[(id - 1) % COLORS.length] };
}

// Determinístico para que o HTML do servidor e do cliente coincidam.
export const INITIAL_LAYERS: Layer[] = [makeLayer(1), makeLayer(2), makeLayer(3)];

let nextId = INITIAL_LAYERS.length + 1;

// Cria as camadas novas que uma ação vai precisar. Deve ser chamada FORA do
// updater do React (é impura), e o resultado é passado para applyAction.
export function freshLayersFor(action: Action): Layer[] {
  const count = action === "add" ? 1 : action === "reset" ? INITIAL_LAYERS.length : 0;
  return Array.from({ length: count }, () => makeLayer(nextId++));
}

// Função pura: índice 0 = base da pilha.
export function applyAction(layers: Layer[], action: Action, fresh: Layer[]): Layer[] {
  switch (action) {
    case "add":
      // Nova camada entra no topo da pilha.
      return layers.length >= MAX_LAYERS ? layers : [...layers, ...fresh];
    case "remove": {
      // Remove a camada do meio, forçando as de cima a se reacomodarem.
      const middle = Math.floor(layers.length / 2);
      return layers.filter((_, index) => index !== middle);
    }
    case "reverse":
      return [...layers].reverse();
    case "reset":
      return fresh;
  }
}

// Posição vertical final de uma camada (translateY a partir da base do palco).
export function targetY(index: number): number {
  return -index * LAYER_GAP;
}
