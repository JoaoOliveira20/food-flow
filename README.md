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

Os experimentos serviram para escolher a biblioteca de animação (decisão em `docs/LIBRARY_DECISION.md`) e estão
encerrados: ficam no repositório como referência e não recebem mais alterações.

## Ambiente de desenvolvimento

O projeto é desenvolvido no **WSL2 (Ubuntu)**, com o repositório no sistema de arquivos do Linux
(`~/projetos/food-flow`). Não use uma cópia em `/mnt/c/...`: o acesso ao disco do Windows é lento, não avisa o Next
sobre mudanças de arquivos e altera permissões e fins de linha. Detalhes e motivos: `docs/ARCHITECTURE.md` §10.

| Onde | O quê |
| --- | --- |
| Windows | Docker Desktop (com a integração WSL ligada para o Ubuntu), VS Code com a extensão WSL, navegador |
| Ubuntu (WSL) | repositório, Git, Node.js 24 (nvm), pnpm (Corepack), Kool, Claude Code |
| Containers (Kool) | backend Laravel e MySQL (a partir da T-B1, `docs/TASKS.md`) |

```bash
cd ~/projetos/food-flow
code .                   # abre o VS Code conectado ao WSL
```

- Clone novo: `git clone git@github.com:JoaoOliveira20/food-flow.git ~/projetos/food-flow` e `pnpm install`
  dentro do Ubuntu. Nunca copie `node_modules` entre Windows e Linux.
- Fins de linha: o `.gitattributes` mantém LF; no Ubuntu, use `git config --global core.autocrlf input`.
- As portas dos servidores (3000–3003) abrem normalmente no navegador do Windows (`localhost`).

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
- `docs/DATA_MODEL.md` — modelo de dados da composição e modelo persistido proposto
- `docs/ASSET_ANALYSIS.md` — medidas dos assets e diretrizes de upload
- `docs/FINAL_REVIEW.md` — pendente

### Próxima fase: backend Laravel, admin e conteúdo dinâmico (em planejamento)

- `docs/requirements/food-flow-backend-admin-evolution.md` — requisitos
- `docs/ARCHITECTURE.md` — arquitetura atual e alvo (Next.js → Laravel API → banco → Storage)
- `docs/BACKEND_DECISIONS.md` — decisões tomadas, propostas, conflitos e questões abertas
- `docs/TASKS.md` — tarefas, dependências e ordem de implementação
