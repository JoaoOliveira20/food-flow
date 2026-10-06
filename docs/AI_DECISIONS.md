# Food Flow — AI Decisions

Registro das interações com IA que influenciaram o projeto: o que foi pedido, o que foi adotado e o que continua em aberto.

---

## 2026-09-28 — Configuração do monorepo e experimentos de animação

**Ferramenta:** Claude Code (Claude Opus 5.5).

### Contexto

O repositório continha apenas `docs/DOMAIN_DECISIONS.md`, `docs/OPEN_DECISIONS.md` e o mockup `docs/design/references/food-flow-ui-ux.png`. Não era um repositório git e não havia código. O documento original do desafio não estava disponível.

### Solicitação

Preparar a infraestrutura (monorepo pnpm, app Next.js principal, diretórios de assets) e três experimentos independentes para comparar Motion, GSAP e React Spring — sem implementar o montador nem escolher a biblioteca.

### Sugestões adotadas

- **pnpm workspaces** com `apps/*` e `experiments/*`; scripts na raiz usando apenas `pnpm --filter` (`dev`, `dev:motion`, `dev:gsap`, `dev:react-spring`, `lint`, `typecheck`, `build:all`).
- **Apps geradas com `create-next-app@16.3.6`** (`--empty`, sem Tailwind, com `src/`). Mantidas as versões que o template fixa (React 19.2.8, TypeScript ^5, ESLint ^9) em vez das últimas publicadas (TS 7, ESLint 10), por serem as testadas pelo Next.js.
- **Portas fixas** (3000–3003) para rodar tudo em paralelo.
- **Script `typecheck` = `next typegen && tsc --noEmit`**, porque o template usa o tipo global `LayoutProps`, gerado pelo Next.
- **Arquivos idênticos nos experimentos** (`layers.ts`, `controls.tsx`, `globals.css`): cópias deliberadas, sem pacote compartilhado, para isolar a biblioteca sem esconder seu modelo atrás de uma abstração.
- **IDs criados fora do updater do React** e camadas iniciais determinísticas — evita IDs duplicados/pulados no StrictMode e divergência de hidratação.
- **Verificação headless** com `puppeteer-core` instalado apenas em diretório temporário, fora do projeto, para não adicionar dependência.

### Decisões ainda abertas

- Biblioteca de animação (ver `LIBRARY_DECISION.md`).
- Modelo de dados, algoritmo de empilhamento, espessura, drag & drop — inalterados em `OPEN_DECISIONS.md`.
- Uso de git/CI — o diretório ainda não é um repositório git; não foi inicializado por não ter sido solicitado.

### Motivo das escolhas de estrutura

- Experimentos como apps completas, não rotas da app principal: dependências isoladas e nenhuma biblioteca de animação vaza para `apps/web` antes da decisão.
- Nenhuma ferramenta extra de monorepo (Turborepo, Nx): o pnpm resolve o necessário nesta fase.

---

## 2026-09-28 — Montadores nos experimentos, drag and drop e comparação

**Ferramenta:** Claude Code (Claude Opus 5.5).

- Montador completo implementado nos três experimentos, com código compartilhado idêntico e apenas
  `BurgerStage.tsx` específico de cada biblioteca.
- Drag and drop com Pointer Events nativos (sem dependência), igual nos três, para não confundir a
  comparação das bibliotecas de animação com diferenças de arraste.
- Ajustes a partir de uso real: miniatura do arraste reduzida e deslocada do ponteiro (cobria o hambúrguer).
- Comparação técnica com testes automatizados e medições em `experiments/COMPARISON.md`.

---

## 2026-09-28 — Implementação do Motion na aplicação principal

**Ferramenta:** Claude Code (Claude Opus 5.5).

### Contexto

A escolha do Motion foi tomada após a comparação dos experimentos. `apps/web` tinha apenas uma página
provisória.

### Solicitação

Integrar o Motion ao montador principal usando `experiments/motion` como referência, com código sem
comentários, nomes em inglês, orientado a dados, e registrar a decisão.

### Sugestões adotadas

- Domínio independente do Motion (`src/burger/`): catálogo, estado, layout da pilha e geometria do arraste.
- Motion concentrado em `layerMotion.ts`, `StackLayer.tsx` e `BurgerStage.tsx`.
- Reorganização por `y` calculado com spring, em vez da prop `layout`, pelas razões registradas em
  `apps/web/README.md`.
- `MotionConfig reducedMotion="user"` para respeitar movimento reduzido (ausente nos experimentos).
- Layout em paisagem com o palco visível (problema identificado na comparação).

### Decisões ainda abertas

- Modelo de dados e algoritmo de empilhamento (implementação provisória registrada).
- Pão do meio por variante (falta de assets) e presets.
- CSS puro × biblioteca para outras partes da interface.

---

## 2026-09-28 — Avisos de imagem e revisão da documentação

**Ferramenta:** Claude Code (Claude Opus 5.5).

### Contexto e solicitação

Corrigir o aviso do Next.js "Image … has either width or height modified, but not the other" e revisar a
documentação com uma entrevista ao responsável pelas pendências.

### Sugestões adotadas

- Causa do aviso: altura fracionária passada ao `<Image>` das camadas. Correção central: o `<Image>` recebe
  o tamanho natural do PNG e o tamanho exibido vem do layout.
- Aviso de LCP do pão superior: miniaturas do seletor de pão e camadas com `loading="eager"` (autorizado
  pelo responsável).
- As decisões foram registradas a partir das respostas do responsável; nenhuma foi tomada pela IA.
  Registro completo: `DOCUMENTATION_REVIEW.md`.

### Decisões ainda abertas

- Lista definitiva de variantes de pão (`OPEN_DECISIONS.md` §13).
- Reutilização e segundo dataset: adiados.
- Documento original do desafio: o responsável vai adicioná-lo em `docs/`.

---

## 2026-09-29 — Presets, testes automatizados e correções

**Ferramenta:** Claude Code (Claude Opus 5.5).

### Contexto e solicitação

Implementar o que faltava a partir das decisões já tomadas, sem reabrir decisões. A análise do código
confirmou que o único requisito decidido e não implementado eram os presets (`DOMAIN_DECISIONS.md` §19);
não havia testes automatizados.

### Sugestões adotadas

- **Receitas:** estado inicial e presets passaram a ser dados do mesmo tipo (`CompositionRecipe`) e usam a
  mesma ação (`applyRecipe`), em vez de uma implementação paralela para presets. A composição guarda a
  última receita aplicada (`appliedRecipe`) para decidir se a troca de preset precisa de confirmação.
- **Confirmação no próprio painel** (não `window.confirm`), com foco no botão de confirmar e Esc para
  cancelar. Detalhes registrados como decisões de implementação, não de produto (`DOMAIN_DECISIONS.md` §19).
- **Miniatura do preset** gerada pelo próprio `computeStackLayout` (SVG), sem assets novos.
- **Posição do painel** escolhida para não empurrar o palco para baixo entre 721 e 1100 px.
- **Faixas de clique sem sobreposição:** um teste novo revelou que a altura mínima das faixas fazia camadas
  finas invadirem as vizinhas (até ~3,5 px), contrariando `OPEN_DECISIONS.md` §10. Corrigido em
  `stackLayout.ts`.
- **Vitest** como dependência de desenvolvimento de `apps/web` (`pnpm test`), cobrindo reducer, receitas,
  presets e empilhamento. Aviso de peer: o Vitest 5 pede `@types/node` ≥ 22; o template usa ^20. Não afeta
  a execução e não foi alterado.
- Verificação da interface com Chrome headless (`puppeteer-core` fora do repositório), em desenvolvimento e
  produção: 62 verificações de layout, presets, confirmação, teclado, toque, arraste, rajadas e movimento
  reduzido.

### Decisões ainda abertas

- Lista definitiva de variantes de pão (`OPEN_DECISIONS.md` §13).
- Reutilização e segundo dataset (§15 e §16): adiados até o montador estar concluído; com os presets
  implementados, a retomada depende do responsável.
- Documento original do desafio; mockup de `docs/design/references/` ausente do disco.

---

## 2026-09-29 — Novos assets de molhos

**Ferramenta:** Claude Code (Claude Opus 5.5).

### Contexto e solicitação

O responsável substituiu `ketchup.png`, `mustard.png` e `mayonnaise.png` por zigue-zagues horizontais
(~4:1) e pediu que os molhos ficassem proporcionais ao hambúrguer e com aparência de aplicados sobre os
ingredientes, sem colocá-los à frente de tudo.

### Sugestões adotadas

- **Causa da distorção:** o catálogo ainda declarava o tamanho dos PNGs antigos (~1,5:1), e a altura
  exibida vem de `imageSize`. Corrigido, com um teste novo que compara `imageSize` com o cabeçalho de cada
  PNG do catálogo.
- **Sem abstração nova:** os três molhos usam uma configuração compartilhada (`SAUCE_SHAPE`) com os mesmos
  três valores de `shape` dos outros ingredientes. A largura é relativa à base da pilha, que já escala com o
  tamanho real do palco.
- **Integração:** o molho afunda bastante na camada de baixo e cresce pouco a pilha; a ordem de desenho
  continua sendo a lógica. Duas calibrações comparadas visualmente em 6 cenários; escolhida a que deixa o
  molho mais visível sobre o ingrediente (afundamento 0,78, apoio 0,95).
- Um teste anterior assumia que a base de cada imagem fica acima da base da anterior; isso deixou de valer
  por projeto (gotas do molho passam da base de ingredientes finos). Substituído pelos invariantes reais:
  ordem de desenho, faixas de clique crescentes e sem sobreposição, e molho que se sobrepõe à camada de baixo
  acrescentando pouca altura.

### Pendente

- Miniaturas dos molhos no painel de ingredientes ficam finas; decisão de interface não tomada.

---

## 2026-10-06 — Planejamento da fase Backend, Admin e Conteúdo Dinâmico

**Ferramenta:** Claude Code (Claude Opus 5.5).

### Contexto e solicitação

O responsável entregou os requisitos da próxima fase (Laravel como API e fonte de verdade, ingredientes e presets
gerenciáveis, admin sem autenticação, Storage, visibilidade) e pediu **só planejamento**: incorporar os requisitos
à documentação, analisar alternativas antes de decidir, registrar conflitos sem resolvê-los silenciosamente e
organizar as tarefas. Nenhum código foi alterado.

### O que foi feito

- Requisitos copiados para `docs/requirements/food-flow-backend-admin-evolution.md`.
- Comparação entre documentação e código: sem divergências.
- Medição dos 21 PNGs (dimensões, alfa, tamanho) para basear os limites de upload em dados (`ASSET_ANALYSIS.md`).
- Verificado na documentação do Next 16 instalada: bloqueio de otimização de imagens de IP local
  (`dangerouslyAllowLocalIP`) e limite padrão de 1 MB em Server Actions — ambos influenciaram BD-11/BD-12.
- Novos documentos: `BACKEND_DECISIONS.md` (decisões tomadas, conflitos, 20 propostas com alternativas, abertas),
  `ARCHITECTURE.md` (estado atual, alvo, divisão de regras, contrato inicial da API, arquivos afetados) e
  `TASKS.md` (fases A–H com dependências).

### Sugestões registradas como propostas (não adotadas até a revisão)

Montador como tabela; variantes de pão em tabela própria só leitura; configurações visuais em colunas; dimensões
calculadas no upload; itens de preset em tabela própria (sem `belongsToMany`, que descartaria repetições);
composição inicial como preset do montador; `is_visible` booleano e presets com disponibilidade derivada; Storage
em disco configurável com caminho relativo e nome por hash; PNG/WebP, 2 MB, 280–3000 px; refatorar o catálogo
para "dado recebido" antes do backend existir.

### Conflitos registrados (aguardando o responsável)

C1 reutilização/segundo dataset adiados × montador pensando em pizza; C2 lista de presets decidida × presets
editáveis; C3 pão como variante × pão listado como ingrediente no exemplo; C4 composição inicial fixa no frontend;
C5 ordem do fluxo de publicação.
