# @food-flow/web

Aplicação principal do Food Flow: montador visual de hambúrguer em camadas (Next.js 16, App Router,
React 19, TypeScript). As animações usam **Motion for React** (`motion`, importado de `motion/react`) —
decisão registrada em `docs/LIBRARY_DECISION.md`.

O catálogo (ingredientes, pães, presets) vem da API Laravel (`apps/api`), buscada no servidor a cada requisição.
Antes de rodar: `cp .env.example .env.local` (define `API_URL`) e suba a API (`pnpm dev:api` na raiz).

```bash
pnpm dev        # na raiz do monorepo → http://localhost:3000
pnpm build
pnpm start
pnpm --filter @food-flow/web lint
pnpm --filter @food-flow/web typecheck
pnpm --filter @food-flow/web test   # Vitest (composição, empilhamento, presets e tamanhos dos PNGs)
```

> Fase seguinte em planejamento: catálogo, presets e imagens passarão a vir de uma API Laravel
> (`docs/ARCHITECTURE.md`, `docs/TASKS.md`). Este documento descreve o código atual.

---

## Arquitetura

O estado da composição é a única fonte de verdade. O catálogo (ingredientes, pães, presets, composição inicial e limite
de camadas) chega como dado (`BuilderCatalog`) pela prop `catalog` do `BurgerBuilder` e é repassado às funções puras. O layout é derivado dele, e as animações apenas
levam cada camada até a posição derivada. Nada de posição visual é guardado à parte.

```text
estado (composition.ts) ─▶ layout (stackLayout.ts) ─▶ BurgerStage/StackLayer (Motion)
        ▲                                                   │
        └──── ações do usuário (botões, arraste) ◀──────────┘
```

| Pasta / arquivo | Responsabilidade | Depende do Motion? |
| --- | --- | --- |
| `src/burger/catalog.ts` | tipos do catálogo (`BuilderCatalog`, ingredientes, variantes de pão, presets) e buscas (`findIngredient`, `findBunVariant`) | não |
| `src/burger/composition.ts` | estado e ações (`compositionReducer`, `placeDraggedItem`); receitas (`createInitialComposition`, `matchesRecipe`) | não |
| `src/api/builderCatalog.ts` | busca o catálogo na API (`fetchBuilderCatalog`) e converte a resposta (`toBuilderCatalog`) | não |
| `src/test/burgerCatalogFixture.ts` | catálogo de exemplo, só para os testes | não |
| `src/burger/stackLayout.ts` | posições finais da pilha (`computeStackLayout`, `scaleStackToStage`) | não |
| `src/burger/dragGeometry.ts` | índice de inserção e posição da miniatura durante o arraste | não |
| `src/hooks/useCompositionDrag.ts` | arrastar e soltar com Pointer Events | não |
| `src/hooks/useElementSize.ts`, `useTransientMessage.ts` | medida do palco; mensagens temporárias | não |
| `src/hooks/useScrollIntoViewWhen.ts` | rola um painel até a área visível (lista de substituição, confirmação de preset) | não¹ |
| `src/components/burger-builder/BurgerBuilder.tsx` | tela: liga estado, layout, arraste e painéis | não |
| `src/components/burger-builder/useBuilderDrag.ts` | liga o arraste às ações da composição e às mensagens | não |
| `src/components/burger-builder/layerMotion.ts` | **definições de animação** (spring, entrada, saída, acomodação do pão) | sim |
| `src/components/burger-builder/StackLayer.tsx` | **uma camada animada** (`motion.div`) | sim |
| `src/components/burger-builder/BurgerStage.tsx` | **palco animado**: escala, `AnimatePresence`, `MotionConfig` | sim |
| `src/components/burger-builder/PresetPicker.tsx` | painel de presets e confirmação de troca | não |
| `src/components/burger-builder/RecipePreview.tsx` | miniatura estática de uma receita (SVG a partir de `computeStackLayout`) | não |
| demais componentes em `burger-builder/` | painéis, barra de seleção, faixas de clique, miniatura e indicador do arraste | não |

¹ `useScrollIntoViewWhen` usa `useReducedMotion` do Motion só para decidir se a rolagem é suave.

### Composição e empilhamento

- `Composition.layers` guarda instâncias `{ instanceId, ingredientId }` da base para o topo. Os pães
  superior e inferior não são camadas: são derivados de `bunVariantId` e ficam sempre visíveis.
- `computeStackLayout` percorre a pilha uma vez. Cada ingrediente declara no catálogo:
  - `displayWidth` — largura na escala base (340 px);
  - `restingSurfaceRatio` — fração da altura da imagem onde a próxima camada se apoia;
  - `sinkRatio` — fração da própria altura que afunda na camada de baixo.
- Não há posições fixas nem regras por ingrediente. A altura vem da proporção do PNG.
- Molhos (ketchup, mostarda, maionese) compartilham `SAUCE_SHAPE`: largura 256 (≈ 88% da carne),
  afundam 78% da própria altura na camada de baixo e acrescentam pouca altura à pilha. A camada seguinte
  cobre só a parte de cima do molho; ondas e gotas ficam visíveis sobre o ingrediente em que foi aplicado.
  A ordem de desenho continua sendo a ordem lógica.
- Cada ingrediente tem uma faixa de clique entre as superfícies de apoio, com altura mínima de 18 px
  na escala base; quando a altura mínima faria duas faixas se sobreporem, elas se dividem no ponto
  médio da sobreposição (`separateHitAreas`).
- `scaleStackToStage` reduz a composição para caber no palco (máximo 1,25×).

### Receitas, reset e presets

- Uma receita (`CompositionRecipe`) é `{ bunVariantId, ingredientIds }`. A composição inicial
  (`catalog.initialRecipe`) e os presets (`catalog.presets`) são receitas; reset e preset usam a mesma ação
  (`applyRecipe`), que cria novas instâncias e guarda a receita em `appliedRecipe`.
- `hasChangedSinceAppliedRecipe` compara ingredientes, ordem e pão com a última receita aplicada
  (seleção não conta). Se houve mudança, escolher um preset abre a confirmação no próprio painel
  (foco no botão "Trocar"; Esc ou "Cancelar" fecham); sem mudança, a troca é direta.
- O preset igual à composição atual (`matchesRecipe`) aparece marcado (`aria-current`); escolhê-lo não
  faz nada. O reset não pede confirmação (comportamento anterior mantido).
- Layout: no desktop, o painel de presets fica abaixo do de pão; entre 721 e 1100 px, no topo da coluna
  dos ingredientes, ao lado do pão, para não empurrar o palco; no celular, entre pão e ingredientes.

### Animações (Motion)

| Mudança de estado | O que o Motion faz | Onde |
| --- | --- | --- |
| Camada nova (adicionar, duplicar, substituir, arrastar do menu) | entra de 56 px acima com −3° e opacidade 0, até o repouso | `enteringLayerState` → `restingLayerState` |
| Camada muda de posição (ordem, remoção de vizinha, prévia do arraste) | `animate.y` muda e a mola parte da posição e velocidade atuais | `restingLayerState` + `layerSpring` |
| Camada removida (remover, substituir, reset, preset) | `AnimatePresence` a mantém até a saída: desce 10 px, escala 0,85, some em 0,22 s | `leavingLayerState` |
| Troca de pão | acomodação de escala 0,94 → 1 nos dois pães (`useAnimate`) | `useBunSettleAnimation` em `BurgerStage` |
| Composição cresce/encolhe | escala do conjunto com a mesma mola | `BurgerStage` |

- **Chaves estáveis:** cada camada usa seu `instanceId`; duplicatas têm ids próprios. Substituir cria um
  novo id na mesma posição lógica: a camada antiga sai e a nova entra no mesmo lugar.
- **Composição inicial** aparece sem animação (`AnimatePresence initial={false}`).
- **Sem bloqueio:** nenhuma ação espera uma animação terminar; cada nova mudança redireciona as molas.
- **Movimento reduzido:** `MotionConfig reducedMotion="user"` desliga as animações de transform quando o
  sistema pede movimento reduzido; as mudanças continuam comunicadas por opacidade (fade) e pelas
  mensagens de status.
- **Por que `y` calculado e não a prop `layout`:** as camadas se sobrepõem por cálculo (não seguem o
  fluxo do DOM) e o conjunto está dentro de um contêiner escalado. A animação de layout (FLIP) mediria o
  DOM para reproduzir posições que `stackLayout.ts` já conhece, e pais escalados exigem correções de
  escala do FLIP. Animar `y` a partir do layout foi a abordagem validada em `experiments/motion`.

### Drag and drop

- `useCompositionDrag` (Pointer Events) decide o que está sendo arrastado e em que índice seria inserido;
  não anima nada. O mouse começa a arrastar após 6 px; o toque numa camada também (as faixas de clique
  usam `touch-action: none`); o toque no menu exige segurar 280 ms. Soltar fora do palco, Esc,
  `pointercancel` ou perda de foco cancelam.
- Durante o arraste, `BurgerBuilder` mostra uma composição **prévia** (`placeDraggedItem`). Para o Motion
  isso é só mais uma reorganização: as vizinhas abrem espaço e a camada arrastada fica translúcida no
  destino. Ao soltar, a mesma função atualiza o estado; como a ordem já é a da prévia, nada salta.
- O índice é calculado sobre as posições exibidas (alvo, não valores em animação), o que o mantém estável.
- A miniatura (`DragGhost`) segue o ponteiro direto no DOM, sem Motion, para acompanhar 1:1.

---

## Admin (`/admin`)

Gestão de ingredientes e presets, sem login nesta versão (`docs/BACKEND_DECISIONS.md` DT-06, BD-20).

| Rota | Tela |
| --- | --- |
| `/admin` | painel: contagens, ingredientes (miniatura, visível/oculto, uso) e presets (miniatura, inicial, disponível) |
| `/admin/ingredients/new`, `/admin/ingredients/[id]` | imagem com preview local e avisos, nome, medidas de encaixe, preview no renderer real, dicas de imagem; publicar/ocultar; excluir |
| `/admin/presets/new`, `/admin/presets/[id]` | nome, pão, receita desenhada como a pilha (subir, descer, remover, adicionar no topo), miniatura; excluir |

Fluxo de dados (BD-12):

- **Leituras** no servidor do Next (`src/api/admin/queries.ts`, com `API_URL` e `connection()`): sempre atualizadas,
  com `loading.tsx`, `error.tsx` e `not-found.tsx` próprios em `src/app/admin/`.
- **Escritas** do navegador direto para a API (`src/api/admin/mutations.ts`, com `NEXT_PUBLIC_API_URL`), seguidas de
  `router.refresh()` ou navegação. `ApiError` traz erros por campo (422) e mensagens próprias para 409, 413 e 429.
- Os previews usam o mesmo `computeStackLayout` do builder (`RecipePreview`) com um catálogo que inclui os
  ingredientes ocultos (`getAdminCatalog`).
- Componentes em `src/components/admin/`; estilos em `admin.module.css`, com os tokens de cor do builder.

## Como fazer alterações comuns

| Quero… | Onde |
| --- | --- |
| adicionar ou trocar um ingrediente | pelo admin (fase F); até lá, nos dados iniciais da API (`apps/api/database/seeders/BurgerCatalogSeeder.php`) |
| ajustar como um ingrediente se encaixa | `shape` do ingrediente (`restingSurfaceRatio`, `sinkRatio`, `displayWidth`) |
| adicionar uma variante de pão | nos dados iniciais da API (não há admin de variantes nesta fase, BD-03) |
| adicionar ou mudar um preset | pelo admin (fase F); até lá, nos dados iniciais da API |
| mudar a entrada, a saída ou a mola | `layerMotion.ts` |
| criar um novo comportamento de composição | nova ação em `compositionReducer` (`composition.ts`) e o gatilho na interface; o Motion anima o resultado sem mudanças |
| mudar regras do arraste | `useCompositionDrag.ts` (gestos) e `dragGeometry.ts` (geometria) |

## Convenções

- O estado é a fonte de verdade; não guardar posições visuais fora dele.
- Toda posição vem de `computeStackLayout`; nada de posições fixas por ingrediente.
- Parâmetros de animação ficam em `layerMotion.ts`; componentes não definem números de animação.
- IDs de instância são criados fora do reducer (`createInstanceId`), que permanece puro.
- Código sem comentários; nomes em inglês; textos de interface em português.
- O `<Image>` recebe o tamanho natural do PNG (`imageSize`); o tamanho exibido vem do layout via CSS.
  Passar o tamanho de exibição (fracionário) gera o aviso "width or height modified" do Next.
- Imagens sempre visíveis na primeira dobra (camadas e miniaturas do pão) usam `loading="eager"`.
- Animações de interface simples (hover, foco, cores) podem usar CSS; movimento da composição e o que
  depende de estado ou presença usam Motion (`docs/OPEN_DECISIONS.md` §2).

## Limitações conhecidas

- Os valores de `shape` foram ajustados visualmente; não há medição automática dos PNGs.
- A miniatura do arraste não "pousa" animada no destino ao soltar.
- Nas miniaturas do painel de ingredientes (56×40, `object-fit: contain`), os molhos, muito horizontais,
  aparecem como faixas finas; a maionese tem pouco contraste com o fundo claro.
- Validação feita com Chrome headless e toque emulado; sem dispositivos físicos nem testes com pessoas.
- Testes automatizados cobrem só a lógica pura (`src/burger/`); a interface e as animações foram
  verificadas com um roteiro headless fora do repositório.
- Entre 721 e 1100 px de largura, com alturas próximas de 768 px, a base do palco pode ficar abaixo da
  primeira dobra (já era assim antes dos presets).
