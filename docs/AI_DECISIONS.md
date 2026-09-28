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
