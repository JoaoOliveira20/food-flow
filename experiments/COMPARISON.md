# Food Flow — Comparação técnica: Motion × GSAP × React Spring

> Documento central da comparação dos três experimentos de animação.
> Data dos testes: **28/09/2026**. Nenhuma biblioteca é declarada vencedora.

---

## 1. Visão geral

### Objetivo

Registrar, com evidências reproduzíveis, como **Motion for React**, **GSAP** e **React Spring** se
comportaram ao implementar o mesmo montador de hambúrguer em camadas, para apoiar a decisão futura
sobre a aplicação principal (`apps/web`).

### Experimentos analisados

| Experimento | Biblioteca | Porta | Arquivo específico da biblioteca |
| --- | --- | --- | --- |
| `experiments/motion` | `motion` 13.4.4 | 3001 | `src/components/BurgerStage.tsx` |
| `experiments/gsap` | `gsap` 3.15.0 + `@gsap/react` 2.1.2 | 3002 | `src/components/BurgerStage.tsx` |
| `experiments/react-spring` | `@react-spring/web` 10.1.2 | 3003 | `src/components/BurgerStage.tsx` |

### O que está sendo comparado

- Como cada biblioteca anima **entrada, saída, reorganização, substituição, troca de pão, escala do
  conjunto e a reorganização ao vivo durante o arraste**, a partir do mesmo estado e do mesmo layout.
- Comportamento sob interações rápidas, carga (5, 12 e 14 camadas) e uso prolongado.
- Custo de implementação, integração com React/Next.js e manutenção **do código efetivamente escrito**.

### O que NÃO está sendo comparado

- **Drag and drop:** é o mesmo código nos três (Pointer Events nativos, `src/burger/useCompositionDrag.ts`).
  A biblioteca avaliada só anima a reorganização. Recursos próprios de arraste (`drag`/`Reorder` do
  Motion, `Draggable` do GSAP, `@use-gesture` com React Spring) **não foram avaliados**.
- **Design visual:** interface, estilos, PNGs e parâmetros visuais são idênticos.
- Recursos não usados nos experimentos: animações de layout (`layout`/FLIP) do Motion, timelines/Flip do
  GSAP, `useChain`/`useTrail` do React Spring, pausa/retomada/reversão. Onde isso importa, está marcado
  como **não testado**.

---

## 2. Resumo executivo

**Funcionalmente, os três experimentos são equivalentes e estáveis.** Todos os cenários funcionais,
de arraste e de interação rápida passaram nas três bibliotecas, em desktop (mouse) e em mobile emulado
(toque), em produção e em desenvolvimento. As posições finais das camadas foram **idênticas entre as
três** em todas as etapas comparadas.

Diferenças observadas (detalhes e evidências nas seções seguintes):

| Aspecto | Motion | GSAP | React Spring |
| --- | --- | --- | --- |
| Modelo | declarativo (`initial`/`animate`/`exit`) | imperativo (tweens criados após o render) | física de mola via `useTransition` |
| Código do `BurgerStage.tsx`¹ | 93 linhas | 155 linhas | 98 linhas |
| Estado manual para sincronizar React ↔ animação | nenhum | 7 refs + 2 estados (`leaving`, `previousLayers`) | nenhum |
| Spring nativo / velocidade preservada ao redirecionar | sim / sim | não (aproximação `back.out`) / não | sim / sim |
| Tempo até parar de mudar (adicionar, 5 camadas)² | ~695 ms | ~561 ms | ~419 ms |
| Heap após 40 ciclos de uso² | 3,25 → 4,67 MB (estabiliza) | 3,07 → **7,45 MB (cresce linearmente)** | 3,17 → 4,34 MB (estabiliza) |
| JS no cliente (gzip, todas as rotas)² | 227 KB | 209 KB | 200 KB |
| Comportamento inesperado observado | nenhum | crescimento de memória (ver §8.2) | elemento removido fica ~230 ms a mais no DOM (invisível) |

¹ Sem comentários e linhas vazias. ² Medido; método e variação na seção 10.

**Destaques:**

- **Motion** produziu a integração mais curta e sem estado auxiliar; nenhum problema foi observado.
  Seus springs demoram mais para ficar numericamente parados (cauda subpixel), sem efeito visível
  nas amostras.
- **GSAP** tem os tempos mais previsíveis (duração fixa), mas exigiu a maior quantidade de código de
  sincronização com o React. Foi o único com **crescimento de memória contínuo** medido, explicado pela
  forma como o `useGSAP`/`gsap.context` retém os tweens (confirmado no código-fonte do GSAP).
- **React Spring** assentou mais rápido nas medições e teve o menor bundle, mas foi o único em que o
  DOM ficou temporariamente diferente do estado lógico (nó invisível após a saída).

**Limitações mais relevantes da análise:** nenhum teste com pessoas; nenhuma avaliação visual humana
lado a lado; toque apenas emulado (Chrome DevTools Protocol); uma única máquina; medições em Chrome
headless; implementação feita por um único desenvolvedor (um agente de IA), o que influencia os
critérios de facilidade e curva de aprendizado.

---

## 3. Experimentos e versões

### Ambiente comum

| Item | Versão |
| --- | --- |
| Next.js | 16.3.6 (App Router, Turbopack) |
| React / React DOM | 19.2.8 |
| TypeScript | ^5 (template do `create-next-app`) |
| ESLint | ^9 + `eslint-config-next` 16.3.6 |
| Node.js | 24.16.0 |
| pnpm | 12.6.0 (workspace da raiz) |

### Dependências por experimento (verificadas em `package.json` e `node_modules`)

| Experimento | Dependências de animação | Tamanho instalado³ | Outras dependências extras |
| --- | --- | --- | --- |
| motion | `motion` → `framer-motion`, `motion-dom`, `motion-utils` | ~11 MB | nenhuma |
| gsap | `gsap`, `@gsap/react` | ~6,5 MB | nenhuma |
| react-spring | `@react-spring/web` → `core`, `animated`, `shared`, `types`, `rafz` | ~0,75 MB | nenhuma |

³ `du` das pastas no store do pnpm; inclui todos os formatos de distribuição (ESM, CJS, UMD, tipos).
Não representa o que vai para o navegador; para isso, ver §10.4.

> Ressalva de ferramenta: `pnpm list` executado dentro de cada experimento listou as três bibliotecas
> (comportamento do pnpm 12 no workspace). A verificação direta de `package.json` e
> `experiments/*/node_modules` confirmou que **cada experimento tem apenas a sua**.

### Estrutura (idêntica nos três)

| Arquivo | Responsabilidade | Igual nos 3? |
| --- | --- | --- |
| `src/burger/ingredients.ts` | catálogo: PNG, tamanho, `width`, `surface`, `sink` | sim |
| `src/burger/composition.ts` | estado (reducer puro): add, duplicate, remove, replace, move, place, setBun, reset | sim |
| `src/burger/layout.ts` | `computeLayout`: posições finais da pilha a partir dos dados; `fitScale` | sim |
| `src/burger/animation.ts` | valores de referência (deslocamento, rotação, spring, saída) | sim |
| `src/burger/useCompositionDrag.ts` | arraste (Pointer Events), sem animação | sim |
| `src/components/BurgerBuilder.tsx` | tela, estado, prévia do arraste, mensagens | sim |
| `src/components/{IngredientPanel,BunPicker,SelectionBar,HitAreas,DragGhost,DropIndicator}.tsx` | interface | sim |
| `src/components/builder.module.css`, `src/app/globals.css` | estilos | sim |
| **`src/components/BurgerStage.tsx`** | **integração com a biblioteca** | **não** |

A igualdade foi verificada por hash (`md5sum`) em todos os arquivos de `src/`, exceto `BurgerStage.tsx`,
`app/layout.tsx`/`app/page.tsx` (só o nome da biblioteca) e a rota antiga `/prototipo`.

### Fluxo comum

1. `compositionReducer` produz o estado lógico (ordem das camadas, pão, seleção).
2. `computeLayout` converte o estado em posições finais (`bottom`, `zIndex`, largura/altura).
3. Durante o arraste, `BurgerBuilder` calcula uma composição **prévia** (`placeDragged`) e a passa ao palco.
4. `BurgerStage` recebe `layout`, `fit`, `bunId`, `selectedUid`, `draggingKey` e anima até as posições.

Como cada biblioteca executa o passo 4:

| Momento | Motion | GSAP | React Spring |
| --- | --- | --- | --- |
| Início (entrada) | `initial` → `animate` do `motion.div` | `gsap.fromTo` quando a chave não tem `lastTarget` | `from` → `enter` do `useTransition` |
| Atualização (reorganização) | novo `animate.y` a cada render | `gsap.to(..., { overwrite: "auto" })` se o alvo mudou | `update` do `useTransition` |
| Interrupção | automática, herda velocidade | `overwrite` mata só a propriedade `y`; sem velocidade | automática, herda velocidade |
| Final (saída) | `exit` + `AnimatePresence` | lista `leaving` + `onComplete` → `setLeaving` | `leave` do `useTransition` |
| Troca de pão | `useAnimate` (imperativo) | `gsap.fromTo("[data-bun]")` | `useSpring(() => …)` + `api.start` |
| Escala do conjunto | `animate={{ scale: fit }}` | `gsap.to(container, { scale })` | `useSpring({ scale: fit })` |

### Diferenças de implementação que podem influenciar resultados

| Diferença | Origem | Tratamento |
| --- | --- | --- |
| GSAP usa duração + ease (`0.55 s`, `back.out(1.3)`); os outros usam spring (stiffness/tension 320, damping/friction 26) | biblioteca (GSAP não tem spring nativo) | mantida e documentada; trajetórias medidas são próximas (§7.3) |
| Opacidade da entrada: spring em Motion/React Spring, tween em GSAP | consequência da anterior | mantida |
| **Curva da saída**: Motion `"easeIn"` (cúbica), GSAP `power1.in` (quadrática), React Spring **linear** (padrão de `config.duration`) | implementação | **corrigida nesta etapa**: as três usam ease-in quadrática (`EXIT_EASE_BEZIER`, `power1.in`, `easings.easeInQuad`) |
| GSAP precisou de estado extra (`leaving`) para animar a saída | biblioteca (sem equivalente a `AnimatePresence`/`leave`) | mantida; é parte do que se compara |

---

## 4. Metodologia

### Ambiente

| Item | Valor |
| --- | --- |
| Data | 28/09/2026 |
| Sistema operacional | Windows 11 Pro 10.0.26200 |
| Hardware | AMD Ryzen 5 5600G (gráficos integrados), 15,4 GB RAM |
| Navegador | Google Chrome 153.0.8010.53, **headless**, controlado por `puppeteer-core` (instalado só em pasta temporária, fora do projeto) |
| Viewports | 1440×900 (desktop, mouse); 390×844 (celular, `isMobile` + `hasTouch`, toque via CDP); 844×390 (celular em paisagem) |
| Builds | produção (`next build` + `next start`) para todos os testes e medições; repetição das suítes funcionais em desenvolvimento (`next dev`, React StrictMode) |

### Composições

- **Inicial / pequena (5 intermediários):** Carne, Cheddar, Cebola roxa, Tomate, Alface; pão clássico.
- **Maior (12):** inicial + Bacon, Picles, Carne, Tomate, Ovo, Alface, Cheddar.
- **Máxima (13 → 14):** inicial + os 7 acima + Cebola roxa; a sequência medida adiciona o 14º (limite `MAX_LAYERS = 14`).

### Ferramentas e scripts

Scripts executados de uma pasta temporária (não versionados no repositório):

| Script | O que faz |
| --- | --- |
| `interact.mjs` | cenários funcionais via botões; confere DOM × estado, assentamento e posições finais entre libs |
| `dnd-tests.mjs` | cenários A–H de arraste com mouse e toque reais (eventos do navegador) |
| `extra.mjs` | teclado, `prefers-reduced-motion`, paisagem |
| `interrupt2.mjs` | trajetória ao redirecionar uma camada no meio da entrada; remoção da camada que está entrando |
| `perf.mjs` | quadros (`requestAnimationFrame`), latência, tempo até assentar, CPU (CDP `Performance.getMetrics`), heap após GC, mutações de DOM; 3 repetições × 3 tamanhos × 2 níveis de CPU |
| `resize.mjs` | carrega no desktop, muda para celular e volta, na mesma página |

### Classificação das informações

- **[Medido]** — obtido por ferramenta/métrica.
- **[Observado]** — comportamento verificado em execução (inclui capturas de tela inspecionadas).
- **[Análise]** — interpretação do código e dos resultados.
- **[Hipótese]** — provável, mas não validado.

### Limitações de método

- **Avisos de console não foram capturados** nos testes desta comparação: os scripts registravam as
  mensagens `error` e `warning`, mas o `console.warn` chega como tipo `warn`. As afirmações "sem erros no
  console" valem para erros. Verificação posterior (28/09/2026) mostrou que os três experimentos emitem,
  em desenvolvimento, o aviso do Next.js "Image … has either width or height modified, but not the other"
  para as imagens das camadas (a altura passada ao `<Image>` é fracionária). É igual nos três e não afeta
  a comparação; foi corrigido apenas em `apps/web`, por decisão do responsável.

- Nenhum teste com usuários. Nenhuma avaliação visual humana lado a lado das animações em movimento.
- Toque **emulado** (CDP `Input.dispatchTouchEvent`); **nenhum dispositivo físico** foi testado.
- Chrome headless: `requestAnimationFrame` rodou a ~143–144 Hz (provável taxa do monitor); a
  composição/GPU do modo headless pode diferir de uma janela visível.
- A instrumentação de desempenho lê `getComputedStyle` de todas as camadas a cada quadro durante as
  ações medidas; esse custo está incluído no tempo de CPU e é igual para as três.
- Uma única máquina e um único navegador (sem Firefox/Safari).

---

## 5. Tabela comparativa

Escala: 1 muito fraco · 2 fraco · 3 adequado · 4 muito bom · 5 excelente · **N/A** sem evidência válida.
As notas refletem **estes experimentos**, não a biblioteca em geral. Detalhes, evidências e confiança na §6.

| Critério | Motion | GSAP | React Spring | Evidência ou observação |
| --- | ---: | ---: | ---: | --- |
| Qualidade das animações | 4 | 4 | 4 | Trajetórias medidas equivalentes; todos assentam corretamente; sem avaliação visual humana |
| Fluidez percebida | N/A | N/A | N/A | Requer observação humana; não realizada |
| Desempenho | 4 | 3 | 4 | Quadros equivalentes; GSAP com crescimento linear de heap |
| Facilidade de implementação | 5 | 2 | 4 | GSAP exigiu sincronização manual React ↔ tweens e a lista `leaving` |
| Controle das animações | 4 | 4 | 4 | Controles usados foram equivalentes; pausa/seek/reversão/timeline não testados |
| Integração com React | 5 | 3 | 4 | GSAP: lógica de StrictMode, estado derivado no render; React Spring: nó a mais no DOM |
| Integração com drag and drop | 4 | 4 | 4 | Arraste compartilhado; reorganização ao vivo passou A–H nas três |
| Previsibilidade | 5 | 5 | 4 | React Spring: DOM ≠ estado por ~230 ms após remoção |
| Responsividade | 4 | 4 | 4 | Interface idêntica; problema de paisagem é da interface, comum aos três |
| Acessibilidade | 3 | 3 | 3 | Teclado funciona; `prefers-reduced-motion` não respeitado em nenhum |
| Manutenção | 4 | 3 | 4 | GSAP concentra mais estado implícito no componente |
| Depuração | 4 | 3 | 3 | GSAP: precisou do código-fonte para entender memória/StrictMode; React Spring: causa do nó extra não identificada |
| Flexibilidade | 4 | 4 | 4 | Núcleo independente da biblioteca; outras composições não testadas |
| Curva de aprendizado | 4 | 3 | 3 | Experiência de um único implementador |
| Complexidade da solução (5 = menos complexa) | 5 | 2 | 4 | Estado auxiliar e ramificações no `BurgerStage` |
| Adequação ao Food Flow | 4 | 3 | 4 | Todos atendem aos requisitos; custos diferentes (ver §6.16) |

Não há média geral: as notas medem coisas diferentes e uma média esconderia, por exemplo, que o GSAP
tem previsibilidade de tempo excelente e integração com React mais cara.

---

## 6. Análise detalhada por critério

### 6.1 Qualidade das animações — Motion 4 · GSAP 4 · React Spring 4

**Evidências**

- [Medido] Entrada do Bacon (5 camadas, 1440×900), y ao longo do tempo (px; alvo −206,6):
  - Motion: `4ms −262,5 → 101ms −227,6 → 195ms −207,1 → 287ms −204,8 (ultrapassa) → 473ms −206,6`
  - GSAP: `1ms −262,6 → 87ms −232,1 → 180ms −213,3 → 366ms −203,2 (ultrapassa) → 553ms −206,6`
  - React Spring: `2ms −260,2 → 99ms −221,7 → 192ms −205,5 → 286ms −205,1 → 473ms −206,6`
  - Rotação −3° → 0° e opacidade 0 → 1 nas três; ultrapassagem máxima ~2–3 px.
- [Medido] Interrupção (entrada redirecionada de −120 para −80 aos 120 ms): as três chegam a −137,7 sem
  saltos entre amostras; Motion e React Spring mantêm velocidade (mola), GSAP reinicia o tween do ponto
  atual. Amostras em §7.3.
- [Observado] Rajadas de 7–20 ações: todas as camadas terminam com rotação 0, escala 1, opacidade 1 e
  na ordem do estado (`interact.mjs`, `dnd-tests.mjs` E e H).
- [Observado] Capturas de quadros intermediários: a camada que entra passa por trás do pão superior
  (ordem de profundidade); igual nas três (decisão de interface, não de biblioteca).

**Pontos fortes:** Motion e React Spring: continuidade física ao redirecionar. GSAP: movimento idêntico
em toda execução (duração fixa).

**Limitações:** GSAP não herda velocidade ao ser interrompido. Nenhuma pessoa avaliou naturalidade/peso.

**Por que notas iguais:** as evidências medidas não mostram falha visual em nenhuma; as diferenças
(velocidade herdada × duração fixa) são de natureza, não de qualidade comprovada.

**Confiança:** baixa. **Para aumentar:** avaliação visual humana lado a lado, em câmera lenta, com
os mesmos cenários.

### 6.2 Fluidez percebida — N/A · N/A · N/A

Fluidez *percebida* exige observação humana, que não houve. As métricas de quadros estão em §6.3/§10.
**Para avaliar:** sessão com pessoas, em desktop e celular físicos, comparando os três lado a lado.

### 6.3 Desempenho — Motion 4 · GSAP 3 · React Spring 4

**Evidências [Medido]** (mediana de 3 execuções; faixa entre parênteses; detalhes em §10)

- Taxa de quadros durante toda a sequência: 142–144 fps nas três, em todos os tamanhos, sem limitação
  de CPU; p95 do intervalo entre quadros = 7 ms nas três.
- Com CPU 4× mais lenta: 137–142 fps; quadros acima de 34 ms por sequência: Motion 5/2/4,
  GSAP 3/4/4, React Spring 2/3/4 (5/12/14 camadas) — contagens pequenas e sobrepostas.
- Latência até o primeiro quadro alterado após clicar: 3–10 ms (1×) e 11–31 ms (4×) nas três.
- Tempo de CPU da thread principal na sequência: faixas sobrepostas, **sem ordem consistente**
  (ex.: 12 camadas/1×: Motion 625, GSAP 564, React Spring 781 ms; 5 camadas/4×: 3521, 2668, 1911 ms).
- **Heap após GC em uso prolongado** (ciclos de 5 adições + reset): Motion 3,25 → 4,40 → 4,67 MB;
  React Spring 3,17 → 4,15 → 4,34 MB (ambos estabilizam após 10 ciclos); **GSAP 3,07 → 4,72 → 5,66 →
  6,55 → 7,45 MB (≈ +0,09 MB por ciclo, sem estabilizar)**.

**Análise:** não há diferença mensurável de fluidez de quadros. O que diferencia o GSAP é o heap.
[Análise, confirmada no código-fonte do GSAP 3.15] cada tween criado dentro de um `gsap.context` é
guardado em `context.data` (`_context.data.push(this)`), e cada função de limpeza retornada vai para
`context._r`; ambos só são liberados em `revert()`/`clear()`. O `useGSAP` só reverte na desmontagem,
e o `BurgerStage` do GSAP vive a sessão inteira. [Hipótese] a retenção de tweens é a causa do crescimento
— não confirmada por heap snapshot.

**Ressalvas:** a nota do GSAP não reflete quadros por segundo, e sim o crescimento de memória, que é
consequência do padrão de integração usado (recomendado pelo próprio `@gsap/react`), mitigável (§14).

**Confiança:** média (uma máquina, headless, 3 repetições). **Para aumentar:** navegador visível,
dispositivos móveis reais, heap snapshot contando instâncias de tween.

### 6.4 Facilidade de uso e implementação — Motion 5 · GSAP 2 · React Spring 4

**Evidências [Análise do código]**

- Motion (`experiments/motion/src/components/BurgerStage.tsx`): a camada inteira é um `motion.div` com
  `initial`/`animate`/`exit`; nenhum estado auxiliar; `AnimatePresence initial={false}` resolve saída e
  composição inicial.
- React Spring: um `useTransition` com fases `initial`/`from`/`enter`/`update`/`leave`. Exigiu anotar o
  tipo do item em cada função (`(layer: PositionedLayer) => …`) e descobrir que a saída com duração
  precisa de `config: { duration, easing }` dentro do próprio `leave`.
- GSAP: precisou de `nodes` (mapa de elementos), `lastTarget` (último alvo por camada), `exiting`,
  `lastFit`, `hasMounted`, `previousBun` (refs), mais `leaving`/`previousLayers` (estado derivado no
  render) e três `useGSAP`. Cada ramo (entrada, movimento, saída, pão, escala) é código explícito.

**Contagem complementar:** 93 × 155 × 98 linhas — a diferença do GSAP é quase toda sincronização, não
animação.

**Confiança:** média. A avaliação reflete um único implementador (agente de IA) familiarizado com as
três APIs; outra pessoa pode ter outra experiência.

### 6.5 Controle e capacidade de manipulação — Motion 4 · GSAP 4 · React Spring 4

**O que foi exercitado** [Observado/Análise]

| Controle | Motion | GSAP | React Spring |
| --- | --- | --- | --- |
| Duração / easing por animação | `transition` por propriedade (usado na saída) | `duration`/`ease` (usado em tudo) | `config` por fase (usado na saída) |
| Parâmetros físicos | `stiffness`/`damping`/`mass` | — (não nativo) | `tension`/`friction`/`mass` |
| Interrupção | automática | `overwrite: "auto"` por propriedade | automática |
| Disparo imperativo | `useAnimate` (troca de pão) | `gsap.fromTo` | `api.start` (troca de pão) |
| Fim da animação | implícito (`AnimatePresence`) | `onComplete` explícito | implícito (`leave`) |
| Controle individual por camada | por componente | por elemento (`nodes`) | por chave |

**Não testado:** atraso, sequenciamento/encadeamento, pausa/retomada, reversão, seek, alteração de
velocidade global, timelines. Esses recursos existem nas três bibliotecas em graus diferentes, mas
**não foram usados**, então não entram na nota.

**Diferença concreta observada:** o GSAP permitiu interromper só a propriedade `y` e deixar rotação e
opacidade da entrada terminarem (`overwrite: "auto"`); em Motion/React Spring isso acontece
naturalmente porque cada propriedade tem sua própria mola.

**Confiança:** baixa (a maior parte dos controles avançados não foi exercitada).

### 6.6 Integração com React e Next.js — Motion 5 · GSAP 3 · React Spring 4

**Evidências**

- [Observado] Nenhum erro de hidratação, renderização ou console nas três, em produção e em dev.
- [Observado] As três exigem `"use client"` no `BurgerStage` (e no `BurgerBuilder`).
- [Análise] GSAP: o `useGSAP` com `dependencies` só reverte na desmontagem; no StrictMode (dev), a
  desmontagem simulada reverte os tweens, e o código precisa zerar os mapas de controle numa função de
  limpeza retornada pelo callback (`return () => { lastTarget.current.clear(); … }`). A saída exige
  estado derivado durante o render (`if (previousLayers !== layout.layers) { … setLeaving(…) }`), o que
  causa um render extra a cada nova identidade de `layout` (que é recalculado a cada render do pai).
- [Medido] React Spring: o elemento removido permaneceu no DOM, invisível, por ~230 ms após o fim da
  saída (§8.3). Durante esse tempo, o DOM tem um nó a mais que o estado lógico.
- [Observado] Motion: o fluxo "estado → props → animação" é direto; nada precisou ser sincronizado à mão.

**Confiança:** média-alta (código analisado e suítes executadas em dev e produção).

### 6.7 Integração com drag and drop — Motion 4 · GSAP 4 · React Spring 4

**Divisão de responsabilidades** (igual nos três):

- **Arraste:** `useCompositionDrag.ts` (Pointer Events) — decide o item e o índice; move a miniatura
  (`DragGhost`) direto no DOM; sem biblioteca.
- **Animação:** a biblioteca avaliada anima as camadas até a composição **prévia** (as vizinhas "abrem
  espaço" ao vivo) e a entrada/saída do item vindo do menu.
- **Ponto de contato:** só as props `layout` (prévia) e `draggingKey` do `BurgerStage`.

**Evidências [Observado]:** cenários A–H (§7.2) passaram nas três, com mouse e com toque emulado, em
produção e em dev. A reorganização durante o arraste é uma sucessão rápida de retargets; nenhuma camada
ficou presa, translúcida ou fora de ordem.

**Por que notas iguais e não 5:** a arquitetura foi desenhada para que a biblioteca tivesse o mínimo de
envolvimento no arraste; portanto o critério mede pouco da biblioteca. Não houve "pouso" animado da
miniatura até a camada ao soltar, o que seria o teste mais exigente de integração (§14).

**Confiança:** média.

### 6.8 Previsibilidade e confiabilidade — Motion 5 · GSAP 5 · React Spring 4

**Evidências**

- [Medido] Mesmas posições finais nas três, em todas as etapas comparadas (17 etapas × 2 viewports).
- [Medido] GSAP: tempo até assentar praticamente constante (≈550–575 ms em todas as operações e cargas),
  por usar duração fixa.
- [Observado] Duas execuções completas consecutivas da suíte de arraste: 51/51 verificações aprovadas
  em ambas, nas três bibliotecas.
- [Medido] React Spring: elemento invisível no DOM por ~230 ms após a saída, reproduzido em duas rodadas
  distintas (§8.3).

**Ressalva:** o crescimento de heap do GSAP é tratado em Desempenho, não aqui.

**Confiança:** alta.

### 6.9 Responsividade e mobile — Motion 4 · GSAP 4 · React Spring 4

**Evidências**

- [Medido] Desktop → celular → desktop na mesma página: palco, hambúrguer e fontes voltam exatamente aos
  valores iniciais nas três (768×594 / 398×492 → 358×338 / 235×290 → 768×594 / 398×492).
- [Medido] Arraste por toque: `scrollY` 0 → 0 durante o arraste; deslizar no menu sem segurar não inicia
  arraste; 6 botões da barra de seleção visíveis e com ≥ 40 px de altura.
- [Observado] **Paisagem 844×390:** sem overflow horizontal, mas o hambúrguer fica abaixo da dobra (o
  layout intermediário coloca a escolha de pão acima do palco). É um problema da **interface**, igual nos três.

**Confiança:** média (apenas emulação; nenhum aparelho físico; mudança de orientação real não testada).

### 6.10 Acessibilidade e alternativas de interação — Motion 3 · GSAP 3 · React Spring 3

**Evidências [Observado]**

- Teclado: 18 Tabs até a camada "Tomate" (foco visível, contorno tracejado), Enter seleciona
  ("Ações para Tomate"), mais 2 Tabs até "Mover para cima", Enter reordena. Igual nas três.
- Alternativas ao arraste: Subir/Descer, Duplicar, Substituir, Remover.
- Estados comunicados sem depender só de cor nem de movimento: mensagens "Soltar entre X e Y",
  "✓ … movido …", "↺ Arraste cancelado", setas ▶ ◀, `role="status"`/`aria-live`.
- **`prefers-reduced-motion: reduce`: não respeitado em nenhum** — a entrada passou por 29 (Motion),
  37 (GSAP) e 28 (React Spring) posições distintas em 400 ms.

**Não verificado:** leitor de tela, contraste, conformidade WCAG. Nenhuma afirmação de conformidade é feita.

**Confiança:** média. As três bibliotecas oferecem meios para respeitar a preferência de movimento
reduzido (ex.: `MotionConfig reducedMotion`, `gsap.matchMedia`, `Globals.assign({ skipAnimation })`),
mas **nenhum foi implementado nem testado**.

### 6.11 Manutenção e organização do código — Motion 4 · GSAP 3 · React Spring 4

**Análise:** ~90% do código é compartilhado e independente da biblioteca (estado, layout, arraste,
interface). A diferença está no `BurgerStage`:

- Motion: a relação estado → animação fica visível no JSX de cada camada.
- React Spring: concentrada na configuração do `useTransition`; o JSX recebe `style` já animado.
- GSAP: a lógica fica em três callbacks de `useGSAP` com ramificações (`previous === undefined &&
  !hasMounted.current`, etc.) e estado distribuído em refs; alterar o fluxo (ex.: adicionar um tipo de
  transição) exige entender todos os mapas.

**Por que não 5 para Motion:** a lógica de troca de pão já precisou sair do modelo declarativo
(`useAnimate`), sinal de que eventos pontuais tendem a gerar código imperativo também.

**Confiança:** média.

### 6.12 Depuração e ferramentas — Motion 4 · GSAP 3 · React Spring 3

**Experiência real registrada**

- GSAP: entender o crescimento de heap e o efeito do StrictMode exigiu ler o código-fonte
  (`gsap.js`, `Context.add`/`revert`) e do `@gsap/react` (`useGSAP`, `deferCleanup`).
- React Spring: o nó extra após a saída foi medido e reproduzido, mas **a causa não foi identificada**.
- Motion: não houve problema que exigisse depuração.
- Nenhuma ferramenta de desenvolvimento específica das bibliotecas foi usada. Mensagens de erro de
  nenhuma delas foram vistas (não ocorreram erros).

**Ressalva:** "não precisou depurar" ≠ "fácil de depurar". A nota do Motion reflete ausência de problemas,
não uma avaliação das ferramentas.

**Confiança:** baixa.

### 6.13 Dependências e impacto no projeto (sem nota na tabela; dados)

| | Motion | GSAP | React Spring |
| --- | --- | --- | --- |
| Pacotes | `motion` (+3 internos) | `gsap`, `@gsap/react` | `@react-spring/web` (+5 internos) |
| Instalado | ~11 MB | ~6,5 MB | ~0,75 MB |
| JS no cliente, gzip, todas as rotas [Medido] | 227 KB | 209 KB | 200 KB |
| Dependências extras para os requisitos | nenhuma | nenhuma | nenhuma |
| Configuração especial | nenhuma | `gsap.registerPlugin(useGSAP)` | nenhuma |

O JS no cliente inclui Next.js/React (comum aos três), a interface compartilhada e a rota `/prototipo`
(que usa a mesma biblioteca). A diferença entre os experimentos (~27 KB entre o maior e o menor)
é atribuível à biblioteca e ao `BurgerStage`. Não foi feita análise por módulo (bundle analyzer).

### 6.14 Flexibilidade e expansão — Motion 4 · GSAP 4 · React Spring 4

**Análise:** o que torna o Food Flow extensível (dados em `ingredients.ts`, empilhamento em `layout.ts`,
reducer genérico por `ingredientId`) é **independente da biblioteca**. Qualquer uma das três recebe
"posições-alvo por chave", que é o contrato necessário para outros construtores. Nenhum outro tipo de
composição foi testado. **Confiança:** baixa.

### 6.15 Curva de aprendizado — Motion 4 · GSAP 3 · React Spring 3

**Experiência observada:** Motion foi direto para o caso "lista com entrada/saída". React Spring exigiu
entender as fases do `useTransition`, `initial` × `from`, `config` por fase e anotações de tipo. GSAP é
simples para um tween isolado, mas a integração com o ciclo de vida do React (contexto, StrictMode,
desmontagem, saída) foi a parte mais trabalhosa.

**Documentação oficial:** **não consultada** durante esta comparação (as dúvidas foram resolvidas pelos
tipos TypeScript e pelo código-fonte dos pacotes). Por isso não há avaliação de documentação.

**Confiança:** baixa (um implementador).

### 6.16 Complexidade da solução — Motion 5 · GSAP 2 · React Spring 4 (5 = menos complexa)

| | Motion | GSAP | React Spring |
| --- | --- | --- | --- |
| Linhas do `BurgerStage` | 93 | 155 | 98 |
| Refs / estados auxiliares | 1 / 0 | 7 / 2 | 1 / 0 |
| Hooks da biblioteca | `useAnimate` | 3 × `useGSAP` | `useTransition`, 2 × `useSpring` |
| Contornos de limitação | nenhum | saída manual; limpeza do StrictMode; aproximação de spring | `config` de duração dentro do `leave` |

### 6.17 Adequação ao Food Flow — Motion 4 · GSAP 3 · React Spring 4

| Requisito | Motion | GSAP | React Spring |
| --- | --- | --- | --- |
| Adição/remoção dinâmica | ✔ nativo | ✔ com lista `leaving` | ✔ nativo (nó extra ~230 ms) |
| Reorganização (inclusive ao vivo no arraste) | ✔ | ✔ | ✔ |
| Entrada/saída/acomodação | ✔ spring | ✔ aproximação por ease | ✔ spring |
| Alterações rápidas de estado | ✔ velocidade preservada | ✔ sem velocidade | ✔ velocidade preservada |
| Lógica de composição independente | ✔ | ✔ | ✔ |
| Uso prolongado | ✔ heap estável | ⚠ heap cresce | ✔ heap estável |

**Riscos na aplicação principal:** Motion — maior pacote e caudas de spring mais longas (ver §10);
recursos de layout/`Reorder` ainda não avaliados. GSAP — manter a sincronização manual correta à medida
que surgirem novas transições; mitigar a retenção de tweens. React Spring — entender/controlar o tempo de
desmontagem após `leave`; API de `useTransition` com mais conceitos.

**Confiança:** média.

---

## 7. Resultados dos testes

### 7.1 Cenários funcionais (`interact.mjs`) — produção, 1440×900 e 390×844

Todas as etapas abaixo **assentaram corretamente nas três bibliotecas** (DOM = estado; ordem correta;
rotação 0, escala 1, opacidade 1; pilha sem inversões) e com **posições finais idênticas entre elas**:

| # | Etapa | Motion | GSAP | React Spring |
| --- | --- | :-: | :-: | :-: |
| 1 | Composição inicial | ✔ | ✔ | ✔ |
| 2 | Adicionar um ingrediente (Bacon) | ✔ | ✔ | ✔ |
| 3 | Duplicata (Bacon de novo) | ✔ | ✔ | ✔ |
| 4 | Duplicar pela seleção (Carne) | ✔ | ✔ | ✔ |
| 5 | Subir ×2 / Descer (controles alternativos) | ✔ | ✔ | ✔ |
| 6 | Remover a camada selecionada (meio) | ✔ | ✔ | ✔ |
| 7 | Substituir (Tomate → Ovo) | ✔ | ✔ | ✔ |
| 8 | Trocar pão (Brioche, Escuro) | ✔ | ✔ | ✔ |
| 9 | Resetar | ✔ | ✔ | ✔ |
| 10 | Remover o primeiro intermediário | ✔ | ✔ | ✔ |
| 11 | Remover o último intermediário | ✔ | ✔ | ✔ |
| 12 | Rajada: 2 adições, remover, 4× subir, duplicar, remover, trocar pão (intervalos de 50–80 ms) | ✔ | ✔ | ✔ |
| 13 | Remover uma camada durante a entrada de outra | ✔ | ✔ | ✔ |
| 14 | 20 adições rápidas (40 ms) contra o limite de 14 | ✔ | ✔ | ✔ |
| 15 | Reset seguido de adição imediata | ✔ | ✔ | ✔ |

### 7.2 Drag and drop (`dnd-tests.mjs`) — eventos reais de mouse (1440×900) e de toque (390×844)

O script arrasta observando a mensagem do indicador e solta quando ela mostra a posição desejada.

| Cenário | Motion | GSAP | React Spring |
| --- | :-: | :-: | :-: |
| A — arraste simples (Cheddar → entre Tomate e Alface), com indicador e miniatura | ✔ ✔ | ✔ ✔ | ✔ ✔ |
| B — para o topo (Carne → logo abaixo do pão superior) | ✔ ✔ | ✔ ✔ | ✔ ✔ |
| C — para a base (Alface → logo acima do pão inferior; pão inferior fixo) | ✔ ✔ | ✔ ✔ | ✔ ✔ |
| D — duplicatas: só a instância arrastada se move e fica selecionada | ✔ ✔ | ✔ ✔ | ✔ ✔ |
| D2 — do menu para uma posição (Ovo → entre Carne e Cheddar; toque: segurar 400 ms) | ✔ ✔ | ✔ ✔ | ✔ ✔ |
| E — interações rápidas: 3 arrastes sem pausa + adicionar + remover | ✔ ✔ | ✔ ✔ | ✔ ✔ |
| F — cancelar: soltar fora, Esc (mouse) / `pointercancel` (toque), perda de foco, menu solto fora | ✔ ✔ | ✔ ✔ | ✔ ✔ |
| G — toque: sem rolagem durante o arraste; deslize no menu não arrasta; controles ≥ 40 px visíveis | — ✔ | — ✔ | — ✔ |
| H — 5 ciclos de adicionar, duplicar, 3 arrastes, substituir, remover; sem listeners de arraste restantes | ✔ ✔ | ✔ ✔ | ✔ ✔ |

(✔ ✔ = mouse e toque; — = não se aplica ao mouse.) Duas execuções completas consecutivas: **51/51
verificações aprovadas em ambas**. Em H, após os 5 ciclos: 0 listeners de arraste restantes na
`window` e 163 nós no DOM nas três.

### 7.3 Interrupção (`interrupt2.mjs`)

**A — redirecionar durante a entrada** (adicionar Bacon; aos ~120 ms remover a Carne da base, o que muda
o alvo do Bacon; y em px, alvo final −137,7):

| t (ms) aprox. | Motion | GSAP | React Spring |
| ---: | ---: | ---: | ---: |
| ~90 | −234,1 | −231,8 | −225,5 |
| ~170–180 | −189,3 | −197,1 | −180,3 |
| ~250–270 | −148,5 | −159,7 | −141,9 |
| ~340 | −134,8 | −142,1 | −135,1 |
| ~420–440 | −136,1 | −133,7 | −136,4 |
| ~520 | −137,6 | −133,0 | −137,6 |
| ~600–700 | −137,7 | −137,7 | −137,7 |

Nenhum salto entre amostras nas três. A amostragem (~40 ms) é grossa demais para concluir sobre a
continuidade da velocidade; a diferença de modelo (herda × não herda velocidade) é [Análise] do código.

**B — remover a camada que ainda está entrando:** nas três, a saída começa da posição atual e a camada
some em ~230 ms. **Em React Spring, o nó invisível (opacidade 0, escala 0,85) continuou no DOM até
~464 ms**; em Motion e GSAP, foi removido logo após ~230 ms.

### 7.4 Teclado, movimento reduzido, paisagem e redimensionamento

Resultados idênticos nas três — ver §6.9 e §6.10.

### 7.5 Modo de desenvolvimento (StrictMode)

As suítes `interact.mjs` e `dnd-tests.mjs` também foram executadas com `next dev` (React StrictMode
ativo, que desmonta e remonta componentes): **interação 6/6 viewports × bibliotecas assentaram
corretamente, sem divergência de posições entre as bibliotecas; arraste 51/51 verificações aprovadas;
nenhum erro no console**. Isso inclui a limpeza do GSAP na desmontagem simulada.

---

## 8. Análise individual das bibliotecas

### 8.1 Motion

**Positivos (observados):** integração mais curta; nenhum estado auxiliar; `AnimatePresence` resolveu a
saída sem código extra; interrupção contínua; nenhum problema encontrado em testes.
**Negativos (observados/medidos):** maior JS no cliente (227 KB gzip, +27 KB sobre o menor) e maior pacote
instalado; maior tempo até "parar de mudar" ao adicionar/substituir (~690 ms vs ~420 ms no React
Spring, com a mesma configuração de mola). [Hipótese] a diferença vem de limiares de repouso mais finos
na opacidade/posição (cauda subpixel), já que as trajetórias chegam ao alvo no mesmo tempo (~470 ms).
**Soluções adicionais necessárias:** `useAnimate` para a troca de pão (evento pontual).
**Não avaliado:** `layout`/FLIP, `Reorder`, `drag` nativo — recursos potencialmente relevantes para o
Food Flow.

### 8.2 GSAP

**Positivos:** durações determinísticas (assentamento constante ≈ 550–575 ms); controle por propriedade
(`overwrite: "auto"`); menor JS no cliente que o Motion.
**Negativos:** maior código e estado de sincronização; saída manual (`leaving`); lógica específica para
o StrictMode; sem spring nativo; **heap crescente** no uso prolongado.
**Problema encontrado — crescimento de memória:**
1. Abrir `experiments/gsap` (produção).
2. Repetir 40× "adicionar 5 ingredientes + Resetar".
3. Medir heap após GC a cada 10 ciclos: 3,07 → 4,72 → 5,66 → 6,55 → 7,45 MB.
Causa provável (código-fonte do GSAP): o contexto do `useGSAP` guarda todos os tweens e funções de
limpeza até a desmontagem. É uma consequência do padrão de integração, não de um erro de animação.
**Não avaliado:** timelines, `Flip`, `Draggable`, `gsap.matchMedia`, `quickTo`.

### 8.3 React Spring

**Positivos:** assentamento mais rápido nas medições (~420 ms em todas as operações); menor JS no
cliente (200 KB) e menor pacote instalado; interrupção contínua; saída e entrada declarativas no
`useTransition`.
**Negativos:** API de `useTransition` com mais conceitos; tipos exigiram anotação explícita; saída com
duração precisa de `config` dentro do `leave`.
**Problema encontrado — nó extra após a saída:**
1. Adicionar Alface; após ~90 ms, selecionar essa Alface e Remover.
2. Observar os elementos `.layer` com `alt="Alface"`.
3. A saída termina em ~230 ms (opacidade 0), mas o nó permanece até ~460 ms.
Sem efeito visual observado (as faixas de clique já seguem o estado novo). Causa não identificada.
**Não avaliado:** `useChain`, `useTrail`, `Globals.skipAnimation`, integração com `@use-gesture`.

---

## 9. Drag and drop

- **Implementação:** `useCompositionDrag.ts` (Pointer Events, sem dependência), idêntica nos três.
  Motivo de não usar dependência: a API de drag and drop do HTML5 não funciona com toque, e bibliotecas
  como dnd-kit aplicam `transform` próprio nos itens, o que disputaria o controle com a biblioteca avaliada.
- **Regras:** mouse inicia após 6 px; toque na camada inicia após 6 px (`touch-action: none` na faixa);
  toque no menu exige segurar 280 ms; soltar fora do palco, Esc, `pointercancel` ou `blur` cancelam.
- **Índice de inserção:** calculado sobre as posições **exibidas** (a prévia atual, sem a camada
  arrastada), usando posições-alvo e não valores em animação — resultado estável.
- **Feedback:** camada translúcida no destino, setas ▶ ◀, mensagem "Soltar entre X e Y", miniatura
  semitransparente (45%) ao lado do cursor/acima do dedo, aviso ✓/↺ ao concluir/cancelar.
- **Limitações:** a miniatura não "pousa" animada no destino ao soltar; os marcadores não são animados;
  as faixas de clique não acompanham a animação.
- **Problemas corrigidos durante o desenvolvimento do arraste** (antes desta comparação, iguais nos três):
  miniatura grande cobrindo o hambúrguer (relatado em uso); índice calculado numa geometria diferente da
  exibida; descarte de clique pós-arraste que engolia cliques em outros botões.

---

## 10. Desempenho

### 10.1 Método

`perf.mjs`, builds de produção, 1440×900, Chrome 153 headless. Para cada biblioteca × tamanho × CPU
(1× e 4× via `Emulation.setCPUThrottlingRate`), **3 repetições** da mesma sequência:

1. adicionar Ketchup; 2. arrastar a camada da base até o topo com o mouse (40 passos de 16 ms);
3. selecionar a primeira camada e "Mover para cima" 3× no mesmo quadro; 4. remover a selecionada;
5. selecionar a primeira camada e substituir por Queijo suíço.

Métricas: intervalos de `requestAnimationFrame`; latência = do clique ao primeiro quadro com
`transform`/`opacity` diferente; **assentamento** = último quadro em que algum `transform`/`opacity`
computado mudou (inclui variações subpixel invisíveis); CPU = `TaskDuration`/`ScriptDuration` do CDP;
heap após `HeapProfiler.collectGarbage`; mutações = registros do `MutationObserver` na composição.

### 10.2 Resultados sem limitação de CPU (mediana; faixa das 3 execuções)

| Camadas | Lib | fps | p95 (ms) | Quadros >34 ms | Adicionar: latência / assenta (ms) | 3× subir | Remover | Substituir | CPU total / script (ms) | Mutações DOM |
| --- | --- | --: | --: | --: | --- | --: | --: | --: | --- | --: |
| 5 | Motion | 143 | 7 | 0 (0–1) | 5,9 / 695 | 489 | 416 | 692 | 684 (513–728) / 298 | 1565 |
| 5 | GSAP | 143 | 7 | 0 | 4,2 / 561 | 559 | 548 | 552 | 594 (563–689) / 237 | 2280 |
| 5 | React Spring | 143 | 7 | 0 | 5,0 / 419 | 426 | 423 | 425 | 510 (505–632) / 231 | 1778 |
| 12 | Motion | 144 | 7 | 0 | 4,3 / 691 | 488 | 416 | 693 | 625 (511–693) / 252 | 2879 |
| 12 | GSAP | 144 | 7 | 0 | 5,9 / 562 | 559 | 555 | 552 | 564 (518–637) / 222 | 4140 |
| 12 | React Spring | 144 | 7 | 0 (0–1) | 3,8 / 425 | 418 | 423 | 420 | 781 (683–886) / 383 | 3229 |
| 13→14 | Motion | 144 | 7 | 0 | 6,7 / 693 | 488 | 416 | 690 | 621 (590–762) / 264 | 3041 |
| 13→14 | GSAP | 144 | 7 | 0 | 4,6 / 560 | 559 | 554 | 550 | 711 (653–766) / 267 | 4389 |
| 13→14 | React Spring | 144 | 7 | 0 | 6,1 / 424 | 424 | 422 | 424 | 902 (882–940) / 414 | 3445 |

### 10.3 Resultados com CPU 4× mais lenta

| Camadas | Lib | fps | fps no arraste | Quadros >34 ms | Adicionar: latência / assenta | 3× subir | Remover | Substituir | CPU total / script (ms) |
| --- | --- | --: | --: | --: | --- | --: | --: | --: | --- |
| 5 | Motion | 139 | 128 | 5 (4–5) | 23 / 709 | 502 | 427 | 704 | 3521 (3278–3647) / 1670 |
| 5 | GSAP | 141 | 132 | 3 (2–5) | 25 / 574 | 573 | 548 | 550 | 2668 (2211–3372) / 1137 |
| 5 | React Spring | 142 | 134 | 2 (2–3) | 19 / 424 | 420 | 417 | 427 | 1911 (1889–1983) / 895 |
| 12 | Motion | 140 | 132 | 2 (2–5) | 12 / 701 | 500 | 427 | 702 | 2433 (2225–3019) / 1140 |
| 12 | GSAP | 137 | 122 | 4 (3–5) | 15 / 574 | 572 | 552 | 546 | 3691 (3380–3695) / 1588 |
| 12 | React Spring | 140 | 122 | 3 (3–4) | 22 / 423 | 423 | 430 | 437 | 2953 (2641–3081) / 1512 |
| 13→14 | Motion | 137 | 120 | 4 | 20 / 700 | 500 | 422 | 700 | 3091 (2620–3265) / 1393 |
| 13→14 | GSAP | 138 | 123 | 4 | 17 / 565 | 573 | 555 | 549 | 2987 (2588–3680) / 1277 |
| 13→14 | React Spring | 140 | 124 | 4 | 23 / 427 | 423 | 430 | 432 | 3086 (2981–3381) / 1609 |

### 10.4 Uso prolongado e bundle

- Heap após GC (ciclos de 5 adições + reset): ver §6.3 — Motion e React Spring estabilizam; GSAP cresce ~0,09 MB/ciclo.
- JS no cliente (soma gzip -9 de `.next/static/chunks/*.js`, todas as rotas, mesmo procedimento):
  Motion 227 KB (728 KB bruto), GSAP 209 KB (661 KB), React Spring 200 KB (638 KB).

### 10.5 Interpretação e limites

- [Medido] Não há diferença relevante de taxa de quadros, p95 ou latência entre as três em nenhum tamanho.
- [Medido] O tempo de CPU varia bastante entre repetições e **não mostra ordem consistente** entre
  bibliotecas (ex.: React Spring foi o menor com 5 camadas/4× e o maior com 12–14 camadas/1×). Não é
  possível afirmar que uma é mais leve em CPU.
- [Medido] O "assentamento" é diferente e estável: React Spring ≈ 420 ms, GSAP ≈ 550–575 ms (duração
  fixa), Motion ≈ 690–700 ms ao adicionar/substituir e ≈ 416–500 ms nas outras operações. Como a
  métrica inclui caudas subpixel, isso **não significa** que o movimento visível seja mais longo — as
  trajetórias de §6.1 chegam ao alvo em ~470 ms em Motion e React Spring.
- [Medido] O GSAP gera mais registros de mutação de DOM (≈ +30–45%). [Hipótese] reflete a duração fixa
  (tweens de 550 ms continuam escrevendo estilos) e escritas por propriedade; não foi associado a custo
  de quadros.
- **Não medido corretamente:** o tempo de assentamento **após soltar** um arraste. Por projeto, a
  reorganização acontece durante o arraste e nada se move ao soltar; a instrumentação esperou um
  movimento que não ocorre (tempo esgotado). A reorganização durante o arraste está coberta pela métrica
  de quadros no arraste.

---

## 11. Experiência de desenvolvimento

Tempo real gasto em cada experimento **não foi registrado**; a comparação é qualitativa.

| Aspecto | Motion | GSAP | React Spring |
| --- | --- | --- | --- |
| Dificuldades encontradas | nenhuma relevante | saída manual; StrictMode revertendo tweens; retenção de tweens pelo contexto | tipos das funções do `useTransition`; `easing` só funciona dentro de `config` do `leave`; nó extra após saída |
| Código auxiliar | nenhum | `lastTarget`, `exiting`, `leaving`, `previousLayers`, `lastFit`, `hasMounted` | nenhum |
| Alterar uma animação existente | mudar `initial`/`animate`/`transition` | mudar o ramo correspondente do `useGSAP` | mudar a fase do `useTransition` |
| Integrar com o arraste | nenhuma mudança além de props | nenhuma mudança além de props (o diff por `lastTarget` já tratava retargets) | nenhuma mudança além de props |
| Problemas de ciclo de vida | não observados | sim (StrictMode; retenção até desmontar) | desmontagem atrasada após `leave` |
| Testabilidade | igual (testes pelo DOM; estado e layout são funções puras compartilhadas) | igual | igual |

---

## 12. Pontos positivos, negativos e problemas — resumo

| | Motion | GSAP | React Spring |
| --- | --- | --- | --- |
| Problemas da **biblioteca** observados | nenhum | nenhum de animação; retenção de tweens pelo `gsap.context` (padrão de integração) | nó mantido no DOM após `leave` (causa não identificada) |
| Problemas da **implementação** | troca de pão imperativa | sincronização manual extensa | nenhum |
| Problemas da **interface** (comuns) | paisagem esconde o hambúrguer; sem movimento reduzido | idem | idem |
| Problemas do **arraste** (comum) | sem pouso animado; marcadores sem animação | idem | idem |
| Problemas do **ambiente de teste** | headless, toque emulado | idem | idem |

---

## 13. Adequação por cenário de uso

| Cenário | Motion | GSAP | React Spring | Evidência relevante / a validar |
| --- | --- | --- | --- | --- |
| Animações simples de interface | declarativo, pouco código | tween direto, mas integração com React tem custo fixo | exige entender springs/transições | §6.4, §6.16 |
| Transições de layout | tem `layout`/FLIP (**não testado**) | `Flip` (**não testado**) | sem FLIP nativo; posições calculadas | validar com os recursos nativos |
| Listas dinâmicas (entrada/saída) | `AnimatePresence` resolveu sem código extra | exigiu lista `leaving` | `useTransition` resolveu (nó extra temporário) | §7.1, §8 |
| Drag and drop com reorganização | retargets contínuos; `Reorder`/`drag` não testados | retargets sem velocidade; `Draggable` não testado | retargets contínuos; `@use-gesture` não testado | §7.2 |
| Sequências complexas | não testado | timelines — ponto forte conhecido, **não testado** aqui | `useChain` não testado | experimento de coreografia |
| Controle preciso de tempo | spring (duração emergente) | durações determinísticas [Medido] | spring (duração emergente) | §10 |
| Muitas interações simultâneas | ✔ | ✔ | ✔ | rajadas e 20 adições rápidas passaram |
| Experimentos visuais | ✔ | ✔ | ✔ | sem avaliação visual humana |
| Aplicações React com estado dinâmico | fluxo estado → animação direto | sincronização manual | fluxo estado → animação direto | §6.6 |
| Manutenção de longo prazo | menos estado implícito | mais estado implícito; mitigar retenção | intermediário | §6.11 |
| Interfaces que crescem em complexidade | eventos pontuais já exigiram código imperativo | escala bem para coreografias; custo de sincronização cresce com os tipos de transição | cresce na configuração do `useTransition` | hipótese; validar com mais transições |

---

## 14. Melhorias nos experimentos

### Necessárias

| Melhoria | Onde | Estado |
| --- | --- | --- |
| Padronizar a curva de saída (era cúbica/quadrática/linear) | motion, react-spring | **Feita** (`EXIT_EASE_BEZIER`, `easings.easeInQuad`; GSAP já usava `power1.in`) |

### Importantes (recomendadas, não implementadas)

| Melhoria | Onde | Motivo |
| --- | --- | --- |
| Evitar a retenção de tweens (ex.: criar tweens fora do contexto e matá-los na desmontagem com `gsap.killTweensOf`, ou limpar o contexto periodicamente) | gsap | heap cresce ~0,09 MB/ciclo; depois, remedir |
| Investigar/ajustar o tempo de desmontagem após `leave` (ex.: `expires`, `onDestroyed`) | react-spring | DOM ≠ estado por ~230 ms |
| Respeitar `prefers-reduced-motion` usando o recurso de cada biblioteca | os três | acessibilidade; também permite comparar essa capacidade |
| Palco visível em celular em paisagem (ex.: aplicar o layout de palco fixo também para alturas pequenas) | os três (interface) | hambúrguer abaixo da dobra em 844×390 |
| "Pouso" animado da miniatura até a camada ao soltar | os três (cada biblioteca) | teste mais exigente de integração animação × arraste |
| Medir o assentamento com limiar visual (ex.: parar ao ficar < 0,5 px) | scripts | separar cauda subpixel de movimento visível |
| Avaliação visual humana e em dispositivos físicos | os três | fluidez percebida e toque real |

### Opcionais

| Melhoria | Onde | Motivo |
| --- | --- | --- |
| Experimentar `layout`/`Reorder` (Motion), `Flip`/timelines (GSAP), `useChain` (React Spring) em ramos separados | cada um | avaliar recursos nativos não testados |
| Animar os marcadores de inserção | os três | feedback mais suave |
| Contagem de instâncias de tween via heap snapshot | gsap | confirmar a hipótese de retenção |

---

## 15. Limitações da comparação

**Não verificado:** fluidez percebida por pessoas; dispositivos físicos; outros navegadores; leitor de
tela; mudança real de orientação; documentação oficial das bibliotecas; recursos avançados listados em
§1; causa do nó extra no React Spring; confirmação por heap snapshot da retenção de tweens no GSAP.

**Fatores que podem ter influenciado:** Chrome headless e 144 Hz; instrumentação com custo por quadro;
um único implementador (agente de IA), com decisões de arquitetura (layout calculado, arraste
compartilhado) que reduzem o papel da biblioteca — o que favorece a equivalência funcional e pode
esconder diferenças que apareceriam com os recursos nativos de layout/arraste de cada uma.

**Testes futuros:** os de §14 (importantes), mais um segundo tipo de composição (ex.: sanduíche) para
validar a flexibilidade.

---

## 16. Conclusão técnica

As três bibliotecas atendem aos requisitos do montador com resultados funcionais idênticos e taxas de
quadros equivalentes neste ambiente. As diferenças estão no **modelo** e no **custo de integração**:

- **Motion:** menor esforço de integração com React e nenhum problema observado; em troca, o maior
  pacote e caudas de spring mais longas nas medições; seus recursos de layout ainda não foram avaliados.
- **GSAP:** tempo determinístico e controle por propriedade; em troca, a maior quantidade de código de
  sincronização e um crescimento de memória no padrão de integração usado, que precisaria de mitigação.
- **React Spring:** springs com assentamento mais rápido nas medições e o menor bundle; em troca, uma
  API de transição com mais conceitos e uma desmontagem atrasada após a saída.

**Perguntas antes de decidir:**

1. A experiência visual (peso, naturalidade) difere para pessoas usando os três lado a lado?
2. Os recursos nativos (`layout`/`Reorder`, `Flip`/timelines, `useChain`) mudam o custo de implementação
   do Food Flow real?
3. O crescimento de memória do GSAP desaparece com a mitigação proposta, sem perder a limpeza no desmonte?
4. O atraso de desmontagem do React Spring é configurável ou relevante na aplicação real?
5. O comportamento se mantém em celulares físicos, com toque real e GPUs mais fracas?
6. Coreografias (ex.: pão sobe → ingrediente entra) serão necessárias? Se sim, qual custo cada uma tem?

---

## 17. Registro dos testes

**Data:** 28/09/2026 · **Ambiente:** §4 · **Builds:** produção (salvo onde indicado).

| Teste | Script | Viewports / entrada | Resultado |
| --- | --- | --- | --- |
| Lint (`eslint`) | `pnpm lint` | — | ✔ sem erros nem avisos nos três |
| Tipos (`next typegen && tsc --noEmit`) | `pnpm typecheck` | — | ✔ nos três |
| Build (`next build`) | `pnpm build` | — | ✔ nos três (rotas `/`, `/prototipo`) |
| Cenários funcionais (15 etapas) | `interact.mjs` | 1440×900 mouse; 390×844 toque | ✔ nas três; posições finais idênticas entre libs |
| Drag and drop A–H | `dnd-tests.mjs` | 1440×900 mouse; 390×844 toque | ✔ 51/51 em duas execuções consecutivas |
| Interrupção e remoção durante a entrada | `interrupt2.mjs` | 1440×900 | ✔ nas três; nó extra de ~230 ms no React Spring |
| Teclado | `extra.mjs` | 1440×900 | ✔ nas três |
| `prefers-reduced-motion` | `extra.mjs` | 1440×900 | ✘ não respeitado nas três (não implementado) |
| Paisagem | `extra.mjs` | 844×390 toque | sem overflow; hambúrguer abaixo da dobra nas três |
| Redimensionamento na mesma página | `resize.mjs` | 1440 → 390 → 1440 | ✔ volta aos valores iniciais nas três |
| Desempenho (54 execuções) | `perf.mjs` | 1440×900, CPU 1× e 4× | §10 |
| Uso prolongado (40 ciclos) | `perf.mjs` | 1440×900 | Motion/React Spring estáveis; GSAP crescente |
| Modo desenvolvimento (StrictMode) | `interact.mjs`, `dnd-tests.mjs` | 1440×900; 390×844 | ✔ interação sem divergências; arraste 51/51; console sem erros |
| Testes com usuários | — | — | **não realizado** |
| Dispositivo físico | — | — | **não realizado** |
| Outros navegadores | — | — | **não realizado** |

**Como repetir:** `pnpm build` e `pnpm start` em cada experimento (portas 3001–3003) e executar os
mesmos cenários pela interface. A sequência e os parâmetros de cada cenário estão descritos nas §7 e §10.
