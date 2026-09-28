# Food Flow — Library Decision

Status: 🟢 **Decidido em 28/09/2026** — Motion for React (`motion`) na aplicação principal.

Este documento registra a decisão sobre a biblioteca de animação (ver `OPEN_DECISIONS.md`, item 1). A seção **Decisão** abaixo é o registro vigente. As seções numeradas a partir de "Histórico" preservam a avaliação inicial com o microprotótipo de três retângulos, feita antes da decisão, e não foram reescritas.

---

## Decisão

| Campo | Registro |
| --- | --- |
| Decisão | Utilizar **Motion for React** na aplicação principal do Food Flow (`apps/web`). |
| Pacote | `motion` 13.4.4 (mesma versão validada no experimento) |
| Importação React | `motion/react` |
| Experimento de referência | `experiments/motion` |
| Comparação completa | `experiments/COMPARISON.md` |
| Escopo | Entrada, saída, reorganização e substituição das camadas; reorganização ao vivo durante o arraste; escala da composição; troca de pão. |
| Alternativas consideradas | GSAP (`experiments/gsap`) e React Spring (`experiments/react-spring`). |
| Data | 28/09/2026 |

### Motivação

Integração declarativa com o React, implementação mais direta nos comportamentos avaliados, suporte nativo a spring e resultados consistentes nos testes realizados.

### Justificativa (resultados observados nos experimentos)

Fonte: `experiments/COMPARISON.md`, testes de 28/09/2026.

- **Integração declarativa:** cada camada declara `initial`/`animate`/`exit` a partir do estado; o `BurgerStage` do experimento Motion não precisou de estado auxiliar. No GSAP foram necessários 7 refs e 2 estados só para sincronizar React e animações; no React Spring, a configuração de fases do `useTransition`.
- **Saída de elementos:** `AnimatePresence` manteve a camada removida até o fim da saída sem código extra. No GSAP, a saída exigiu uma lista manual; no React Spring, o nó removido permaneceu ~230 ms a mais no DOM após a saída.
- **Spring nativo com interrupção contínua:** ao mudar o alvo no meio de um movimento, a mola continua da posição e velocidade atuais (também no React Spring; o GSAP não tem spring nativo).
- **Estabilidade:** todos os cenários funcionais, de arraste (mouse e toque emulado) e de interação rápida passaram, em produção e em desenvolvimento (StrictMode); heap estável em uso prolongado (3,25 → 4,67 MB em 40 ciclos; o GSAP cresceu continuamente).
- **Requisitos do Food Flow atendidos:** entrada/saída/acomodação, reorganização frequente de camadas com dimensões diferentes e drag and drop com posição de inserção (`DOMAIN_DECISIONS.md`, seções 3, 4, 11, 12, 14 e 15).

### Trade-offs e pontos de atenção

- **Maior custo de bundle** entre as três: 227 KB gzip de JS no cliente no experimento (GSAP 209 KB, React Spring 200 KB), e o maior pacote instalado.
- **Caudas de spring mais longas:** o tempo até os valores pararem totalmente de mudar foi ~690 ms ao adicionar/substituir (React Spring ~420 ms), embora a trajetória visível chegue ao alvo em ~470 ms nas duas.
- **Eventos pontuais exigem API imperativa:** a acomodação na troca de pão usa `useAnimate`.
- **Movimento reduzido não é automático:** o padrão do Motion ignora `prefers-reduced-motion`; é preciso `MotionConfig reducedMotion="user"` (adotado em `apps/web`).
- **Não avaliado:** animações de layout (`layout`/FLIP), `Reorder` e `drag` nativos do Motion; sequências/coreografias. A escolha não afirma superioridade do Motion nesses cenários.
- **Limitações da evidência:** sem teste com pessoas nem em dispositivo físico; toque emulado; uma máquina; Chrome headless.

### Implementação na aplicação principal

Descrita em `apps/web/README.md` (arquitetura, onde ficam as animações e como alterá-las).

---

# Histórico — avaliação inicial (antes da decisão)

---

## 1. Bibliotecas avaliadas

| Biblioteca | Pacote(s) | Versão | Experimento | Porta |
| --- | --- | --- | --- | --- |
| Motion for React | `motion` (import de `motion/react`) | 13.4.4 | `experiments/motion` | 3001 |
| GSAP | `gsap` + `@gsap/react` | 3.15.0 / 2.1.2 | `experiments/gsap` | 3002 |
| React Spring | `@react-spring/web` | 10.1.2 | `experiments/react-spring` | 3003 |

Ambiente-base comum: Next.js 16.3.6, React 19.2.8, TypeScript 5, App Router, Node 24.16.0.

---

## 2. Objetivo dos microexperimentos

Comparar como cada biblioteca resolve, em seu próprio modelo de animação, os movimentos que o montador vai precisar: entrada vertical com acomodação, reorganização de camadas, remoção e interrupção.

Não é um protótipo do montador: as camadas são retângulos coloridos e o posicionamento é deliberadamente simples (`y = -índice × 40px`), sem espessura variável.

### Como a comparação foi mantida justa

- `layers.ts`, `controls.tsx` e `globals.css` são **cópias idênticas** nos três experimentos (verificado por hash). Contêm só estado, controles e estilos — nenhuma animação. A duplicação é intencional: uma abstração compartilhada esconderia justamente as diferenças que queremos observar.
- Apenas `page.tsx` muda entre os experimentos.
- Motion e React Spring usam o mesmo spring (stiffness/tension 260, damping/friction 18).
- GSAP não tem spring nativo; foi usado `back.out(1.7)` / 0,7 s na entrada e `back.out(1.4)` / 0,5 s no reposicionamento. **Os movimentos não são matematicamente equivalentes** — foram calibrados para uma sensação parecida.
- Saída: 0,25 s nas três, deslizando para a direita com rotação.
- Camadas iniciais aparecem sem animação nas três.

---

## 3. Comportamentos testados

Controles disponíveis em cada experimento:

1. **Adicionar** — nova camada entra no topo, vindo 180 px acima com −8° de rotação, e se acomoda.
2. **Remover do meio** — remove a camada central; as de cima descem.
3. **Inverter ordem** — reorganiza todas as camadas.
4. **Resetar** — todas saem e três novas entram.
5. **Estresse** — 7 ações a cada 120 ms (add, add, inverter, remover, add, inverter, remover), sobrepondo animações.

---

## 4. Resultados observados

### 4.1 Verificação automatizada (headless)

Executada com Chrome headless em modo `dev` (React StrictMode ativo), amostrando `transform` e `opacity` de cada camada a cada ~30 ms. O script ficou fora do repositório (dependência temporária).

| Verificação | Motion | GSAP | React Spring |
| --- | --- | --- | --- |
| Erros de console / hidratação | nenhum¹ | nenhum¹ | nenhum¹ |
| Entrada: tempo até assentar (±0,5 px) | ~560 ms | ~650 ms | ~560 ms |
| Entrada: ultrapassagem do alvo (−120) | até −98,7 (21 px) | até −102,1 (18 px) | até −98,6 (21 px) |
| Remoção: camada de cima assentar | ~470 ms | ~430 ms | ~430 ms |
| Estresse ×3 + reset: DOM = estado | ✅ | ✅ | ✅ |
| Estresse: posições finais corretas, sem camadas órfãs | ✅ | ✅ | ✅ |

¹ Único item registrado: `404 /favicon.ico` — o template vazio do `create-next-app` não inclui favicon. Não relacionado às bibliotecas.

### 4.2 Interrupção (retarget durante a entrada)

Teste: adicionar uma camada e, 120 ms depois (no meio da entrada), remover a camada do meio — o alvo da camada que está entrando muda de −120 para −80.

- **Motion** e **React Spring**: a mola é redirecionada partindo da posição **e da velocidade** atuais. A trajetória segue contínua, ultrapassa o novo alvo (~−65) e oscila levemente (~−81,8) antes de assentar em −80. Traços praticamente idênticos, como esperado pelo mesmo modelo de mola.
- **GSAP**: `overwrite: "auto"` mata apenas a propriedade `y` do tween de entrada (rotação e opacidade continuam) e um novo tween parte da posição atual. A velocidade **não** é herdada: o novo movimento é definido pelo ease. Com `back.out`, que começa rápido, a troca não ficou visível nas amostras, mas com outros eases pode aparecer uma quebra de ritmo.

### 4.3 Código específico da biblioteca

| | Motion | GSAP | React Spring |
| --- | --- | --- | --- |
| Linhas de `page.tsx` (sem comentários e linhas vazias) | 67 | 127 | 77 |
| JS client total do build (sem compressão)² | ~694 KB | ~640 KB | ~610 KB |

² Referência: a app principal, sem biblioteca, tem ~566 KB. A diferença é uma estimativa grosseira do custo de cada biblioteca **neste uso**; não foi medida com compressão nem tree-shaking detalhado.

### 4.4 O que **não** foi avaliado ainda

A verificação automatizada confirma correção e trajetórias, mas **não substitui a avaliação visual**. A sensação do movimento (peso, naturalidade, "acomodação") precisa ser observada por uma pessoa nos três experimentos lado a lado. Não houve avaliação visual nesta etapa (a extensão do navegador não estava conectada).

---

## 5. Comparação por critério

Observações neutras, baseadas na implementação e nos testes acima.

### Motion

- **React/Next.js:** componentes `motion.*` exigem `"use client"`. Funcionou sem configuração extra no App Router e sem erros no StrictMode.
- **Modelo:** declarativo — `initial` / `animate` / `exit` por elemento; o alvo vem do render.
- **Controle programático:** disponível (`useAnimate`, `animate()`), não exercitado neste teste.
- **Spring:** nativo, com preservação de velocidade no retarget.
- **Sequenciamento:** via `transition.delay`/`staggerChildren` ou `useAnimate` com sequências; não exercitado.
- **Layout:** possui animação de layout automática (`layout`, FLIP). **Não foi usada** para manter o mesmo modelo de posicionamento dos outros experimentos; é uma alternativa relevante para o montador real.
- **Interrupção:** automática e contínua.
- **Reorganização:** mudar o índice muda `animate.y`; nada a gerenciar.
- **Limpeza:** automática no unmount; saída tratada por `AnimatePresence`.
- **Legibilidade/manutenção:** menor código; o comportamento fica próximo do JSX.
- **Limitações observadas:** o elemento que sai mantém o último `zIndex` (não foi colocado acima dos demais como nos outros dois). `AnimatePresence` depende de `key` estável.

### GSAP

- **React/Next.js:** exige `"use client"` e o hook `useGSAP` (`@gsap/react`) para escopo e limpeza. Funcionou no App Router.
- **Modelo:** imperativo — tweens com duração e ease, criados após cada render.
- **Controle programático:** o mais direto (timelines, pause, seek, timeScale); não exercitado além de tweens simples.
- **Spring:** **não nativo**. Aproximado com `back.out`/`elastic.out` (ou plugin/ease customizado).
- **Sequenciamento:** timelines são o ponto forte da biblioteca; não exercitado neste teste.
- **Layout:** sem animação de layout automática no core; existe o plugin Flip, não usado.
- **Interrupção:** controlada por `overwrite`; não preserva velocidade.
- **Reorganização:** exige comparar estado anterior e atual (mapa `lastTarget`) para decidir quem entra e quem se move.
- **Limpeza:** `useGSAP` reverte tweens no unmount. O StrictMode desmonta/remonta em dev, então o controle manual (`lastTarget`, `exiting`) também precisa ser zerado na limpeza. Sem isso, pela leitura do código do `useGSAP`, as camadas não seriam reposicionadas após o remount (identificado antes da execução, não observado).
- **Saída:** o React desmonta imediatamente; foi preciso manter camadas removidas em uma lista `leaving` até o `onComplete`.
- **Legibilidade/manutenção:** ~2× o código dos outros; estado de animação paralelo ao estado do React.
- **Limitações observadas:** a sincronização React ↔ GSAP é a maior fonte de complexidade e de bugs potenciais.

### React Spring

- **React/Next.js:** exige `"use client"`. Funcionou no App Router e no StrictMode.
- **Modelo:** física de mola sem duração; `useTransition` decide entrada/atualização/saída por chave; valores aplicados fora do ciclo de render via `animated.*`.
- **Controle programático:** disponível via `ref`/`SpringRef` e `api.start`; não exercitado.
- **Spring:** nativo (tension/friction), com preservação de velocidade.
- **Sequenciamento:** via `trail`, `delay`, `useChain` ou funções async em `to`; não exercitado.
- **Layout:** sem animação de layout automática; posições precisam ser calculadas (como aqui).
- **Interrupção:** automática e contínua.
- **Reorganização:** `update` recalcula o alvo pelo índice atual.
- **Limpeza:** automática; `leave` mantém o elemento até o fim.
- **Legibilidade/manutenção:** código curto, mas a API de `useTransition` (funções `from`/`enter`/`update` recebendo o item, `initial`, `config` por fase) exige familiaridade.
- **Limitações observadas:** o índice precisa ser obtido com `layers.indexOf(item)` dentro das funções; animação de saída com duração exige `config: { duration }` no próprio `leave`.

---

## 6. Pontos que ainda precisam ser avaliados

- Avaliação visual lado a lado (sensação, peso, ritmo) por uma pessoa.
- Animação de layout do Motion (`layout`) vs. posições calculadas.
- Sequenciamento real (ex.: vizinhas reagindo em cascata; reset/preset).
- Drag & drop e sua integração com cada biblioteca (Motion tem gestos próprios; GSAP tem Draggable; React Spring costuma usar `@use-gesture`).
- Comportamento com 12 e 20+ camadas e com imagens PNG reais.
- Custo de bundle medido com compressão.
- Necessidade real de biblioteca vs. CSS puro (`OPEN_DECISIONS.md`, item 2).
- Licenciamento e manutenção de longo prazo de cada biblioteca.
