"use client";

// Arrastar e soltar com Pointer Events (mouse, toque e caneta).
//
// Arquivo IDÊNTICO nos três experimentos. Não anima nada: só decide o que está
// sendo arrastado e em que índice seria inserido. O "fantasma" que segue o
// ponteiro é posicionado diretamente no DOM; a reorganização das camadas
// durante o arraste é feita pela biblioteca de cada experimento, porque a
// prévia é apenas outra ordem da composição (ver BurgerBuilder).
//
// O fantasma é uma miniatura deslocada do ponteiro (ao lado do cursor; acima
// do dedo no toque) para não cobrir o hambúrguer. A posição de inserção é
// definida pelo próprio ponteiro sobre as camadas como estão na tela, e a
// prévia no lugar é o indicador principal.
//
// Regras:
// - Mouse/caneta: o arraste começa após mover 6px (um clique continua sendo clique).
// - Toque numa camada: idem; as faixas de clique usam `touch-action: none`.
// - Toque no menu: é preciso segurar 280ms antes de arrastar, para não
//   conflitar com a rolagem da lista.
// - Soltar fora do palco, Esc, pointercancel ou perda de foco cancelam.

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type RefObject } from "react";
import { createUid, MAX_LAYERS, placeDragged, type Composition, type DragSource } from "./composition";
import { getIngredient } from "./ingredients";
import { COMPOSITION_BOTTOM, computeLayout, fitScale, type PositionedLayer } from "./layout";

const DRAG_THRESHOLD_PX = 6;
const TOUCH_HOLD_MS = 280;
const TOUCH_HOLD_TOLERANCE_PX = 10;
// Margem ao redor do palco que ainda conta como soltura válida.
const STAGE_MARGIN_PX = 16;
// Tamanho do fantasma em relação à camada na composição.
const GHOST_SCALE = 0.45;
// Distância entre o ponteiro e o fantasma.
const GHOST_GAP_PX = 18;
const GHOST_TOUCH_GAP_PX = 40;

export type DragState = {
  source: DragSource;
  ingredientId: string;
  // null: ponteiro fora do palco (soltar cancela).
  index: number | null;
  // Tamanho do fantasma em px de tela e deslocamento do seu canto em relação ao ponteiro.
  size: { width: number; height: number };
  offset: { x: number; y: number };
};

type Pending = Omit<DragState, "index"> & {
  pointerId: number;
  element: Element;
  start: { x: number; y: number };
  needsHold: boolean;
  held: boolean;
  timer: number | null;
};

type Options = {
  stageRef: RefObject<HTMLElement | null>;
  composition: Composition;
  fit: number | null;
  onStart: (source: DragSource) => void;
  onDrop: (source: DragSource, index: number, ingredientId: string) => void;
  onCancel: (source: DragSource) => void;
};

export function useCompositionDrag(options: Options) {
  const [drag, setDrag] = useState<DragState | null>(null);
  const latest = useRef(options);
  const active = useRef<DragState | null>(null);
  const pending = useRef<Pending | null>(null);
  const pointer = useRef({ x: 0, y: 0 });
  const ghost = useRef<HTMLDivElement | null>(null);
  const detach = useRef<(() => void) | null>(null);

  useEffect(() => {
    latest.current = options;
  });

  // Desmontagem no meio de um arraste: remove listeners e marcações globais.
  useEffect(() => () => detach.current?.(), []);

  function stageOrigin() {
    const stage = latest.current.stageRef.current;
    if (!stage) return null;
    const rect = stage.getBoundingClientRect();
    return { rect, x: rect.left + rect.width / 2, y: rect.bottom - rect.height * COMPOSITION_BOTTOM };
  }

  // Índice de inserção para a posição atual do ponteiro, comparando-a com as
  // posições EXIBIDAS (a prévia atual, com a camada arrastada no seu lugar):
  // conta quantas das outras camadas têm o centro abaixo do ponteiro. Usa as
  // posições-alvo, não os valores em animação, então o resultado é estável.
  function indexAt(state: DragState): number | null {
    const { composition } = latest.current;
    const origin = stageOrigin();
    if (!origin) return null;
    const { x, y } = pointer.current;
    const { rect } = origin;
    const inside =
      x >= rect.left - STAGE_MARGIN_PX &&
      x <= rect.right + STAGE_MARGIN_PX &&
      y >= rect.top - STAGE_MARGIN_PX &&
      y <= rect.bottom + STAGE_MARGIN_PX;
    if (!inside) return null;
    const layers =
      state.index === null ? composition.layers : placeDragged(composition.layers, state.source, state.index);
    const shown = computeLayout({ ...composition, layers });
    const fit = fitScale(shown, { width: rect.width, height: rect.height });
    const pointerY = (origin.y - y) / fit;
    return shown.layers.filter(
      (layer) => layer.hit && layer.key !== state.source.uid && pointerY > layer.hit.bottom + layer.hit.height / 2,
    ).length;
  }

  function positionGhost() {
    const state = active.current;
    if (!ghost.current || !state) return;
    const { x, y } = pointer.current;
    ghost.current.style.transform = `translate(${x + state.offset.x}px, ${y + state.offset.y}px)`;
  }

  function update(next: DragState | null) {
    active.current = next;
    setDrag(next);
  }

  function activate(p: Pending) {
    const { source, ingredientId, size, offset } = p;
    const state: DragState = { source, ingredientId, size, offset, index: null };
    state.index = indexAt(state);
    try {
      p.element.setPointerCapture(p.pointerId);
    } catch {
      // O elemento pode ter sido desmontado; os listeners na janela continuam valendo.
    }
    document.documentElement.dataset.dragging = "";
    update(state);
    latest.current.onStart(source);
  }

  function finish(commit: boolean) {
    const state = active.current;
    const origin = pending.current?.element;
    detach.current?.();
    if (!state) return;
    update(null);
    if (commit && state.index !== null) latest.current.onDrop(state.source, state.index, state.ingredientId);
    else latest.current.onCancel(state.source);
    // O clique que o navegador dispara no elemento de origem após soltar não
    // deve selecionar/adicionar. Cliques em outros elementos passam normalmente.
    const swallow = (event: Event) => {
      if (!origin || !(event.target instanceof Node) || !origin.contains(event.target)) return;
      event.stopPropagation();
      event.preventDefault();
      window.removeEventListener("click", swallow, { capture: true });
    };
    window.addEventListener("click", swallow, { capture: true });
    window.setTimeout(() => window.removeEventListener("click", swallow, { capture: true }), 0);
  }

  function attach() {
    const onMove = (event: PointerEvent) => {
      const p = pending.current;
      if (!p || event.pointerId !== p.pointerId) return;
      pointer.current = { x: event.clientX, y: event.clientY };
      if (active.current) {
        positionGhost();
        const index = indexAt(active.current);
        if (index !== active.current.index) update({ ...active.current, index });
        return;
      }
      const distance = Math.hypot(event.clientX - p.start.x, event.clientY - p.start.y);
      if (p.needsHold && !p.held) {
        // Moveu antes de completar o toque longo: é rolagem, não arraste.
        if (distance > TOUCH_HOLD_TOLERANCE_PX) detach.current?.();
        return;
      }
      if (p.held || distance > DRAG_THRESHOLD_PX) activate(p);
    };
    const onUp = (event: PointerEvent) => {
      if (pending.current && event.pointerId === pending.current.pointerId) finish(true);
    };
    const onCancel = () => finish(false);
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && active.current) finish(false);
    };
    // Enquanto arrasta por toque, impede a rolagem da página.
    const onTouchMove = (event: TouchEvent) => {
      if (active.current || pending.current?.held) event.preventDefault();
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onCancel);
    window.addEventListener("keydown", onKey);
    window.addEventListener("blur", onCancel);
    document.addEventListener("touchmove", onTouchMove, { passive: false });

    detach.current = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onCancel);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("blur", onCancel);
      document.removeEventListener("touchmove", onTouchMove);
      if (pending.current?.timer) window.clearTimeout(pending.current.timer);
      pending.current = null;
      delete document.documentElement.dataset.dragging;
      detach.current = null;
    };
  }

  function arm(event: ReactPointerEvent, base: Omit<Pending, "pointerId" | "element" | "start" | "held" | "timer">) {
    if (event.button !== 0 || !event.isPrimary) return;
    // Um novo arraste encerra qualquer interação anterior pendente.
    if (active.current) finish(false);
    detach.current?.();
    pointer.current = { x: event.clientX, y: event.clientY };
    const p: Pending = {
      ...base,
      pointerId: event.pointerId,
      element: event.currentTarget,
      start: { x: event.clientX, y: event.clientY },
      held: false,
      timer: null,
    };
    if (p.needsHold) {
      p.timer = window.setTimeout(() => {
        p.held = true;
      }, TOUCH_HOLD_MS);
    }
    pending.current = p;
    attach();
  }

  // Miniatura ao lado do cursor (mouse/caneta) ou acima do dedo (toque).
  function ghostGeometry(event: ReactPointerEvent, width: number, height: number) {
    const size = { width: width * GHOST_SCALE, height: height * GHOST_SCALE };
    const offset =
      event.pointerType === "touch"
        ? { x: -size.width / 2, y: -size.height - GHOST_TOUCH_GAP_PX }
        : { x: GHOST_GAP_PX, y: -size.height / 2 };
    return { size, offset };
  }

  // Início em uma camada da composição.
  function startLayerDrag(event: ReactPointerEvent, layer: PositionedLayer, ingredientId: string) {
    const { fit } = latest.current;
    if (!fit) return;
    arm(event, {
      source: { kind: "layer", uid: layer.key },
      ingredientId,
      ...ghostGeometry(event, layer.width * fit, layer.height * fit),
      needsHold: false,
    });
  }

  // Início no menu de ingredientes.
  function startMenuDrag(event: ReactPointerEvent, ingredientId: string) {
    const { fit, composition } = latest.current;
    if (!fit || composition.layers.length >= MAX_LAYERS) return;
    const ingredient = getIngredient(ingredientId);
    const width = ingredient.width * fit;
    arm(event, {
      source: { kind: "new", ingredientId, uid: createUid() },
      ingredientId,
      ...ghostGeometry(event, width, (width * ingredient.size.h) / ingredient.size.w),
      needsHold: event.pointerType === "touch",
    });
  }

  // Ref do fantasma: posiciona assim que ele é montado.
  function ghostRef(node: HTMLDivElement | null) {
    ghost.current = node;
    positionGhost();
  }

  return { drag, startLayerDrag, startMenuDrag, ghostRef };
}
