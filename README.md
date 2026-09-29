# Food Flow

Experimento visual de composição de elementos em camadas. Primeiro caso de uso: um montador de hambúrguer (Next.js).

## Estrutura

```text
apps/web/                  Aplicação principal: montador com Motion (ver apps/web/README.md)
  public/assets/ingredients/  PNGs dos ingredientes (ver README do diretório)
experiments/
  motion/                  Montador de referência com Motion for React
  gsap/                    Montador de comparação com GSAP
  react-spring/            Montador de comparação com React Spring
  COMPARISON.md            Comparação técnica dos três experimentos
docs/                      Decisões, análises e referências de design
```

## Requisitos

- Node.js 24+
- pnpm 12 (via Corepack: `corepack enable`)

## Comandos (na raiz)

```bash
pnpm install

pnpm dev                 # app principal      → http://localhost:3000
pnpm dev:motion          # experimento Motion → http://localhost:3001
pnpm dev:gsap            # experimento GSAP   → http://localhost:3002
pnpm dev:react-spring    # experimento React Spring → http://localhost:3003

pnpm build               # build da app principal
pnpm build:all           # build de todos os pacotes
pnpm lint                # ESLint em todos os pacotes
pnpm typecheck           # verificação de tipos em todos os pacotes
pnpm test                # testes (Vitest) da app principal
```

## Documentação

- `docs/DOMAIN_DECISIONS.md` — regras de produto já decididas
- `docs/OPEN_DECISIONS.md` — questões em aberto
- `docs/LIBRARY_DECISION.md` — decisão da biblioteca de animação (Motion)
- `experiments/COMPARISON.md` — comparação técnica que fundamenta a decisão
- `apps/web/README.md` — arquitetura do montador e das animações
- `docs/AI_DECISIONS.md` — registro das interações com IA
- `docs/DATA_MODEL.md`, `docs/ASSET_ANALYSIS.md`, `docs/FINAL_REVIEW.md` — pendentes
