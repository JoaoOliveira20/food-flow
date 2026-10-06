# Food Flow

Experimento visual de composição de elementos em camadas. Primeiro caso de uso: um montador de hambúrguer (Next.js).

## Estrutura

```text
apps/web/                  Aplicação principal: montador com Motion (ver apps/web/README.md)
apps/api/                  API Laravel + MySQL, roda via Kool/Docker (ver apps/api/README.md)
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
| Containers (Kool) | backend Laravel e MySQL |

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
- Docker Desktop (com a integração WSL ligada) e [Kool](https://kool.dev) — para a API; PHP, Composer e MySQL
  rodam só em containers

## Como rodar

O projeto tem duas partes: a **API** (Laravel + MySQL, em containers) e o **frontend** (Next.js). O frontend busca
ingredientes, pães e presets na API, então suba a API primeiro.

### Primeira vez (uma vez por clone)

Com o Docker Desktop aberto:

```bash
cd ~/projetos/food-flow
pnpm install                       # dependências do frontend

cd apps/api
kool run setup                     # cria o .env, sobe os containers, instala o Composer, gera a chave,
                                   # cria o link das imagens e roda migrations + dados iniciais

cd ../web
cp .env.example .env.local         # endereço da API usado pelo Next (http://localhost:8000)
```

### Dia a dia

```bash
cd ~/projetos/food-flow

pnpm dev:api                       # sobe a API em segundo plano → http://localhost:8000 (saúde: /up)
pnpm dev                           # sobe o frontend (ocupa o terminal) → http://localhost:3000
```

Os comandos da raiz são atalhos; dá no mesmo rodar `kool start` dentro de `apps/api`.

### Parar

```bash
Ctrl+C                             # no terminal do `pnpm dev`: para o frontend
pnpm stop:api                      # para a API e o MySQL (ou `kool stop` dentro de `apps/api`)
```

Parar não apaga o banco: os dados ficam num volume do Docker. Se o frontend abrir com a API parada, aparece
"Não foi possível carregar o montador"; suba a API e clique em "Tentar de novo".

### Outros comandos da API (dentro de `apps/api`)

```bash
kool run test                      # testes (na raiz: pnpm test:api)
kool run reset                     # apaga as imagens enviadas e recria o banco com os dados iniciais
kool run artisan ...               # Artisan
kool run composer ...              # Composer
kool run pint                      # formatação do PHP
```

Mais detalhes da API (serviços, endpoints, erros): `apps/api/README.md`.

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

pnpm dev:api             # API Laravel + MySQL via Kool → http://localhost:8000
pnpm stop:api            # para os containers da API
pnpm test:api            # testes (PHPUnit) da API
```

A API (`apps/api`) fica fora do workspace do pnpm e roda só em containers (ver "Como rodar").

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

### Fase atual: backend Laravel, admin e conteúdo dinâmico (em implementação)

- `docs/requirements/food-flow-backend-admin-evolution.md` — requisitos
- `docs/ARCHITECTURE.md` — arquitetura atual e alvo (Next.js → Laravel API → banco → Storage)
- `docs/BACKEND_DECISIONS.md` — decisões tomadas, propostas, conflitos e questões abertas
- `docs/TASKS.md` — tarefas, dependências e ordem de implementação
