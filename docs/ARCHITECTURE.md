# Food Flow — Arquitetura

Atualizado em 06/10/2026.

- **Seção 1:** arquitetura atual (implementada).
- **Seções 2 a 9:** arquitetura-alvo da fase Backend, Admin e Conteúdo Dinâmico — 🟢 **revisada pelo responsável
  em 06/10/2026** (banco: MySQL).
- **Seção 10:** ambiente de desenvolvimento (WSL2 + Kool) — 🟢 **adotado em 06/10/2026**. As decisões e alternativas estão em `BACKEND_DECISIONS.md` (IDs `DT-xx`, `BD-xx`); as tarefas, em
  `TASKS.md` (IDs `T-xx`).

Detalhes do montador (empilhamento, animações, arraste): `apps/web/README.md`.

---

## 1. Estado atual (implementado)

```text
Navegador ── Next.js (apps/web)
               ├── catálogo fixo: ingredientCatalog.ts (ingredientes, variantes de pão, formas)
               ├── presets fixos: presetCatalog.ts; composição inicial: composition.ts (INITIAL_RECIPE)
               ├── PNGs em public/assets/ingredients/
               └── builder: estado (reducer puro) → layout (stackLayout) → Motion
```

- Sem backend, banco, admin ou API. Tudo é estático e empacotado no build.
- `experiments/` (Motion, GSAP, React Spring) são apps isoladas de referência. **Não fazem parte desta fase e não
  devem ser alteradas.**
- Comparação entre documentação e código (06/10/2026): a documentação existente descreve corretamente o código
  (catálogo, presets, composição, limites, testes). Nenhuma divergência encontrada.

---

## 2. Arquitetura-alvo

```text
                     ┌──────────────────────────── Next.js (apps/web) ───────────────────────────┐
Navegador ──────────▶│  /           builder público (Server Component busca o montador na API)  │
   │                 │  /admin/...  admin (client components chamam a API diretamente)          │
   │                 └──────────────────────────────────────────────────────────────────────────┘
   │                                   │ GET /api/builders/burger (servidor → servidor)
   │ fetch (admin)                     ▼
   └──────────────────────────▶  Laravel API (apps/api)
                                   ├── validação (Form Requests), regras, Resources
                                   ├── Eloquent ──▶ MySQL (container, via Kool)
                                   └── Storage (disco configurável, padrão "public")
   ◀── imagens: <Image> do Next otimiza a partir da URL pública do Storage
```

| Camada | Papel | Decisões |
| --- | --- | --- |
| Next.js | Interface pública e admin; composição visual; consumo da API | DT-03, BD-11, BD-12 |
| Laravel API | Fonte de verdade: dados, regras, validação, uploads, visibilidade | DT-02, BD-01, BD-18 |
| Banco | Montadores, variantes de pão, ingredientes, presets e itens | BD-02–BD-07, `DATA_MODEL.md` |
| Storage | Arquivos de imagem; banco guarda só o caminho relativo | DT-08, BD-09, BD-16 |

---

## 3. Divisão de responsabilidades e regras

Critério: **regra de negócio/integridade** (o dado é aceito ou não, o item existe ou não para o público) fica no
backend. **Regra de interação/visual** (como a composição se mexe, aparece e responde) fica no frontend. O
frontend pode repetir uma validação **só para UX** (mensagem antes de enviar), nunca como garantia.

### Backend (autoridade)

| Regra | Hoje | Depois |
| --- | --- | --- |
| Montador existe; ingrediente, variante e preset pertencem a ele | implícito (só existe burger) | FK + validação |
| Nome obrigatório; slug único por montador | não existe | validação |
| Imagem válida (conteúdo, tipo, tamanho, dimensões) | não existe (arquivo no repositório) | validação (BD-10) |
| Tamanho natural da imagem | digitado + teste | calculado no upload (BD-05) |
| Faixas das configurações visuais (proporções 0–1; largura 1–340) | implícito nos valores | validação (BD-04) |
| Preset referencia ingredientes existentes do mesmo montador | teste `presetCatalog.test.ts` | FK + validação (BD-06) |
| Preset tem de 1 a `max_layers` ingredientes | teste | validação (BD-13) |
| Variante de pão do preset existe e é do montador | teste | FK + validação |
| Só itens visíveis chegam ao builder público | não existe | filtro na API (BD-14) |
| Preset indisponível se contém ingrediente oculto | não existe | filtro na API (BD-14) |
| Exclusão respeita relações; preset inicial não pode ser excluído | não existe | 409 (BD-15) |
| Arquivo antigo removido sem perder dados | não existe | BD-16 |

### Frontend (interação e visual) — permanece como está

| Regra | Onde |
| --- | --- |
| Cálculo da pilha, faixas de clique, escala do palco | `stackLayout.ts` |
| Ações da composição (adicionar no topo, duplicar, substituir na mesma posição, mover, remover) | `composition.ts` |
| Limite de camadas durante a montagem (valor vindo da API) | `hasReachedLayerLimit` |
| Arraste, índice de inserção, cancelamentos | `useCompositionDrag.ts`, `dragGeometry.ts` |
| Confirmação ao trocar de preset; preset atual marcado | `BurgerBuilder`, `PresetPicker` |
| Animações, movimento reduzido | `layerMotion.ts`, `StackLayer`, `BurgerStage` |
| Preview no admin (mesmo renderer) e orientações de imagem | admin |
| Pré-validação de formulário (tipo/tamanho do arquivo antes de enviar) | admin, **só UX** |

**Por que a composição do usuário não é validada no backend:** a composição montada no builder nunca é enviada
ao servidor (não há pedidos nem composições salvas). Se isso mudar (ex.: salvar ou pedir um hambúrguer), as regras
de composição — ingredientes visíveis, limite de camadas, montador correto — também terão de ser validadas no
backend.

---

## 4. Dados no frontend depois da migração

- O builder recebe do servidor um objeto de montador: limite de camadas, variantes de pão, ingredientes
  visíveis, presets disponíveis e composição inicial (BD-11).
- As funções puras de `src/burger/` passam a receber o catálogo como parâmetro em vez de importar constantes.
  O modelo da composição (`DATA_MODEL.md`) não muda.
- O admin usa os mesmos componentes de renderização com dados de rascunho (imagem local + valores do formulário)
  para o preview.

### Partes da implementação atual que mudam

| Arquivo | Mudança | Tarefa |
| --- | --- | --- |
| `src/burger/ingredientCatalog.ts` | Fica só com tipos e a busca no catálogo recebido; saem `INGREDIENTS`, `BUN_VARIANTS`, `SAUCE_SHAPE` e os caminhos de imagem; `findIngredient`/`findBunVariant` deixam de ser globais. `TOP_BUN_SHAPE`/`BOTTOM_BUN_SHAPE` ficam (regra do renderer) | T-E1, T-E5 |
| `src/burger/presetCatalog.ts` | `PRESETS` sai; fica o tipo `CompositionPreset` | T-E5 |
| `src/burger/composition.ts` | `INITIAL_RECIPE`, `INITIAL_COMPOSITION` e `MAX_LAYERS` passam a vir do montador; o reducer não muda | T-E1 |
| `src/burger/stackLayout.ts` | `computeStackLayout` recebe o catálogo | T-E1 |
| `src/hooks/useCompositionDrag.ts`, `components/burger-builder/dragMessages.ts`, `DragGhost.tsx`, `IngredientPanel.tsx`, `BunPicker.tsx`, `PresetPicker.tsx`, `SelectionToolbar.tsx`, `BurgerBuilder.tsx` | Recebem dados por props/parâmetros em vez de importar constantes | T-E1 |
| `src/app/page.tsx` | Busca o montador na API (Server Component) e trata erro/vazio | T-E3 |
| `next.config.ts` | `images.remotePatterns` para a URL do Storage; em desenvolvimento, `dangerouslyAllowLocalIP` (o Next 16 bloqueia otimizar imagens de IP local por padrão) | T-E4 |
| `public/assets/ingredients/*.png` | Saem do frontend; viram dados de seed do backend (cópias dos experimentos **não** mudam) | T-B6, T-E5 |
| Testes `ingredientCatalog.test.ts`, `presetCatalog.test.ts` | A conferência de PNG e de presets passa para o backend; os testes de lógica usam fixtures | T-E5 |
| `composition.test.ts`, `stackLayout.test.ts` | Passam a usar fixtures em vez das constantes | T-E1 |
| `apps/web/README.md` ("Como fazer alterações comuns") | "Adicionar ingrediente" passa a ser pelo admin | T-G6 |
| `pnpm-workspace.yaml`, `package.json` da raiz, `README.md` | Excluir `apps/api` do workspace; scripts e requisitos do backend | T-B1 |

Componentes de animação (`layerMotion.ts`, `StackLayer.tsx`, `BurgerStage.tsx`), `RecipePreview.tsx`,
`LayerHitAreas.tsx`, `DropIndicator.tsx` e os hooks de medida/mensagem não precisam mudar além de receber os
mesmos dados por outra origem.

---

## 5. Contrato inicial da API (proposta)

Os nomes finais serão confirmados na implementação (T-B7). Rotas públicas só leem e só devolvem itens
disponíveis; rotas de gestão devolvem tudo, inclusive ocultos.

### Público

| Método e rota | Resposta |
| --- | --- |
| `GET /api/builders/{slug}` | montador (`slug`, `name`, `maxLayers`), `bunVariants`, `ingredients` visíveis, `presets` disponíveis (sem o inicial), `initialRecipe` |

Uma única requisição entrega um retrato consistente do montador (evita, por exemplo, um preset chegar sem o
ingrediente que ele usa). Os requisitos citam `GET /api/ingredients` e `GET /api/presets` como conceito; os
endpoints exatos ficaram para esta análise (requisitos §13).

### Gestão (`/api/admin`)

| Método e rota | Uso |
| --- | --- |
| `GET /api/admin/builders` | montadores com contagens (dashboard) |
| `GET /api/admin/builders/{builder}/bun-variants` | variantes (só leitura) |
| `GET /api/admin/builders/{builder}/ingredients` | lista, inclusive ocultos, com uso em presets |
| `POST /api/admin/builders/{builder}/ingredients` | criar (multipart; nasce oculto) |
| `GET /api/admin/ingredients/{id}` | detalhes |
| `POST /api/admin/ingredients/{id}` + `_method=PATCH` | editar com troca de imagem (multipart) |
| `PATCH /api/admin/ingredients/{id}` | editar sem imagem, incluindo `isVisible` |
| `DELETE /api/admin/ingredients/{id}` | excluir (409 se usado em preset) |
| `GET /api/admin/builders/{builder}/presets` | lista com disponibilidade e marca do preset inicial |
| `POST /api/admin/builders/{builder}/presets` | criar (`name`, `bunVariantId`, `ingredientIds` base → topo) |
| `GET` / `PATCH` / `DELETE /api/admin/presets/{id}` | detalhes, editar (lista completa de itens), excluir (409 se inicial) |

Convenções: JSON em camelCase nas respostas (alinhado aos tipos do frontend) — a confirmar na T-B7, pois o padrão
do Laravel é snake_case; erros no formato padrão do Laravel (BD-18); URLs de imagem absolutas.

---

## 6. Admin (Next.js)

```text
/admin                        dashboard: contagens, lista de ingredientes (miniatura, visível?), lista de presets
/admin/ingredients/new        criar: imagem + preview local + dicas + nome + forma (valores sugeridos)
/admin/ingredients/[id]       editar: forma com preview no renderer real, trocar imagem, publicar/ocultar, excluir
/admin/presets/new            criar: nome, pão, ingredientes ordenados (base → topo), miniatura
/admin/presets/[id]           editar / excluir
```

- Com um único montador, o admin não mostra seletor de montador; o `builder` vem do único registro existente. A
  estrutura de rotas aceita um segmento de montador no futuro sem reescrita.
- Preview do ingrediente: composição de teste com o ingrediente em rascunho entre camadas reais (ex.: carne
  abaixo e alface acima), no mesmo `BurgerStage`, para avaliar tamanho, proporção, transparência e encaixe.
- Preview do preset: `RecipePreview` (já gera a miniatura a partir de `computeStackLayout`) e, opcionalmente, o
  palco completo.
- Orientações de imagem: texto proposto em `ASSET_ANALYSIS.md`.
- Estados de carregamento, erro (incluindo 422 por campo e 409 com explicação) e vazio em todas as telas.

---

## 7. Segurança sem autenticação

| Risco | Medida |
| --- | --- |
| Requisição direta à API com dados inválidos | Form Requests em todas as rotas de escrita; `$fillable` explícito; IDs e relações checados no mesmo montador |
| Arquivo malicioso (extensão falsa, SVG com script, polyglot) | MIME por conteúdo; lista fechada (PNG, WebP); decodificação obrigatória; nome gerado pelo servidor; extensão pelo conteúdo |
| Path traversal / sobrescrita | Nome do arquivo nunca vem do cliente; diretório fixo por tipo |
| Arquivos enormes / bomba de descompressão | Limite de 2 MB; lado máximo 3000 px; limites do PHP alinhados |
| Abuso por volume | Rate limiting (`throttle`) nas rotas de gestão |
| Outra origem chamando a API pelo navegador | CORS restrito à origem do frontend (não protege contra chamadas diretas; é higiene) |
| Vandalismo do conteúdo (qualquer um pode excluir) | Aceito na demonstração (DT-06); não publicar sem proteção (⏳ O5); seed reexecutável para restaurar |
| Imagem de ingrediente oculto acessível pela URL | Aceito: ocultar não é sigilo; nome do arquivo é aleatório (BD-09) |

---

## 8. Riscos técnicos

1. **Paridade visual na migração:** valores de forma e tamanhos precisam chegar idênticos ao renderer; validar
   com o roteiro headless existente antes/depois (T-E6).
2. **Imagens remotas no Next 16:** `remotePatterns` e o bloqueio de IP local em desenvolvimento
   (`dangerouslyAllowLocalIP`); sem isso, o `<Image>` falha.
3. **Multipart em PATCH:** exige `POST` + `_method` (BD-08).
4. **Repetição de ingredientes em presets:** `belongsToMany` com `sync()` descartaria repetições (BD-06).
5. **Laravel dentro do pnpm workspace:** o `package.json` do Laravel entraria nos scripts recursivos (BD-19).
6. **Cache do Next:** se a página do builder for cacheada, publicar um ingrediente não aparece; definir a
   estratégia lendo a documentação do Next 16 (BD-11).
7. **Duas aplicações em desenvolvimento:** scripts e README precisam deixar claro como subir Next + Laravel.
8. **Número mágico duplicado:** a largura-base 340 existe no renderer e na validação do backend (BD-04); mudar um
   exige mudar o outro.
9. **Miniaturas dos molhos** no admin herdam a limitação já registrada no painel de ingredientes
   (`apps/web/README.md`, "Limitações conhecidas").

---

## 9. Preparação para controle de acesso (futuro)

Ver BD-20. Resumo: grupo `/api/admin` e segmento `/admin` como pontos únicos de proteção; Form Requests com
`authorize()`; nenhuma coluna de autoria até existirem usuários. Tarefas: `TASKS.md`, Fase H.

---

## 10. Ambiente de desenvolvimento: Windows → WSL2 → Docker/Kool (proposta)

🟢 **BD-21, adotado em 06/10/2026.** Diagnóstico da máquina e detalhes da implementação em `BACKEND_DECISIONS.md`
BD-21; comandos em `README.md` e `apps/api/README.md`.

### Onde cada parte roda

| Parte | Onde | Por quê |
| --- | --- | --- |
| Navegador, interface dos editores (VS Code / PhpStorm), Docker Desktop | Windows | Já instalados; os editores se conectam ao WSL (VS Code: extensão WSL, já usada — existe `~/.vscode-server`) |
| Repositório, Git, Claude Code | Ubuntu (WSL), em `/home/palad/projetos/food-flow` | Sistema de arquivos Linux: rápido, permissões e fins de linha corretos, observação de arquivos funcionando |
| Next.js (`apps/web`) e experimentos (3000–3003) | Ubuntu, direto (Node 24 via nvm + pnpm via Corepack) | Recarregamento rápido; sem camada de container para o frontend; mesmos comandos de hoje |
| Laravel (PHP, Composer, Artisan, servidor web) | Container `app` do Kool | Pedido do responsável: sem PHP/Composer no Windows nem no Ubuntu |
| MySQL | Container `database` do Kool, com volume nomeado | Dados persistem entre reinícios; fácil de recriar |

Alternativas consideradas:

| Alternativa | Por que não |
| --- | --- |
| Manter o repositório em `/mnt/c` e rodar tudo do WSL | Acesso via 9p: `pnpm install`, `composer install` e o Next em modo dev ficam várias vezes mais lentos; o Next não recebe eventos de arquivo (exige polling); permissões aparecem como 777; CRLF quebra scripts nos containers |
| Next.js também em container | Mais lento para desenvolver (volumes de `node_modules`), sem ganho: o frontend não precisa de PHP/MySQL |
| Docker Engine nativo no Ubuntu (sem Docker Desktop) | Viável e mais leve, mas exige instalar e manter o engine; o Docker Desktop já está instalado. Os dois juntos conflitam: escolher um |
| Editores no Windows abrindo `\wsl$\...` diretamente | Indexação e buscas lentas; a extensão WSL do VS Code e o suporte a WSL do PhpStorm resolvem |

### Estrutura de diretórios

```text
/home/palad/projetos/food-flow/          (clone novo, no Linux)
├── .gitattributes                       novo: fins de linha LF no repositório
├── package.json, pnpm-workspace.yaml    scripts da raiz; workspace sem apps/api (BD-19)
├── apps/
│   ├── web/                             Next.js — roda no Ubuntu
│   └── api/                             Laravel — roda no Kool (criado na T-B1)
│       ├── kool.yml                     atalhos: kool run artisan, composer, setup, reset, test
│       ├── docker-compose.yml           serviços app (PHP + servidor web) e database (MySQL)
│       └── ...                          estrutura padrão do Laravel
├── experiments/                         inalterados — rodam no Ubuntu como hoje
└── docs/
```

`kool.yml` e `docker-compose.yml` ficam em `apps/api` para manter o Laravel autocontido; os scripts da raiz só
delegam (`pnpm dev:api` → `kool start` em `apps/api`). Arquivos `kool.yml`/`docker-compose.yml` soltos em
`/home/palad` (sobras de uso anterior do Kool) não interferem, desde que os comandos sejam rodados dentro do
projeto.

### Como as partes conversam

```text
Windows: navegador ──▶ localhost:3000 (Next, no Ubuntu)   ──▶ localhost:<porta da API> (Laravel, container)
                         │ (encaminhamento de localhost do WSL2)      ▲ (porta publicada pelo Docker)
Ubuntu:  Next (servidor) ─┴── fetch http://localhost:<porta da API> ──┘
Docker:  app ──▶ database:3306 (rede interna do compose; MySQL não precisa ser exposto, só para clientes de BD)
```

- O navegador no Windows acessa `localhost:3000` (Next) e `localhost:<porta da API>` (Laravel e imagens em
  `/storage`), pelo encaminhamento de portas do WSL2/Docker Desktop.
- O servidor do Next (no Ubuntu) busca o montador em `http://localhost:<porta da API>`; por isso o
  `dangerouslyAllowLocalIP` em desenvolvimento (T-E4).
- CORS do Laravel libera `http://localhost:3000`.
- O Kool roda os containers com o UID do usuário (`palad`), então arquivos criados por `artisan`/`composer`
  pertencem a `palad`, sem problemas de permissão.

### Dependências

| Onde | O quê | Situação |
| --- | --- | --- |
| Windows | Docker Desktop com integração WSL ligada para `Ubuntu` | instalado; integração desligada |
| Ubuntu | Kool | 3.6.0 instalado; verificar se as imagens de PHP do Kool cobrem a versão de PHP exigida pelo Laravel atual (T-03) |
| Ubuntu | Node 24 (nvm) + pnpm 12 (Corepack, `packageManager` da raiz) | só Node 22 instalado |
| Ubuntu | Git com SSH funcionando | `~/.ssh` com dono e permissões errados |
| Containers | PHP, Composer, extensões, MySQL | vêm das imagens do Kool; nada instalado no host |

### Problemas conhecidos de `/mnt/c` e como o plano os evita

| Problema | Efeito | No plano |
| --- | --- | --- |
| Desempenho do 9p | instalações e builds lentos; dev server lento | repositório no Linux |
| Eventos de arquivo | Next/Vite não percebem mudanças | idem |
| Permissões (tudo 777, dono fixo) | Git marca mudança de modo; containers podem recusar arquivos | idem |
| CRLF (`autocrlf=true` no Windows) | scripts falham com `/bin/sh^M` (já visto com o `corepack` do Windows no Ubuntu) | clone no Linux + `.gitattributes` com LF |
| `node_modules` com binários do Windows | `next`/`sharp`/`swc` não funcionam no Linux | `pnpm install` novo no Ubuntu; nunca copiar `node_modules` |
| PATH herdado do Windows | `pnpm`/`npm` do Windows executados no Ubuntu | Node e pnpm do Linux à frente no PATH; conferir com `command -v` |

### Etapas de migração (em ordem)

Detalhadas como tarefas em `TASKS.md`, Fase 0.

1. **Salvar o trabalho atual:** commitar e enviar ao GitHub a documentação desta fase (hoje não commitada), para
   o clone no Linux partir dela. A cópia do Windows fica intocada como backup.
2. **Preparar o Ubuntu:** corrigir dono/permissões de `~/.ssh` (ou usar HTTPS); `git config --global
   core.autocrlf input`; `nvm install 24`; `corepack enable`; opcional: `wsl --set-default Ubuntu`.
3. **Docker:** ligar a integração WSL do Docker Desktop para `Ubuntu`; iniciar o Desktop; conferir
   `docker info` e `docker compose version` dentro do Ubuntu; conferir `kool` (atualizar se necessário).
4. **Clonar** em `/home/palad/projetos/food-flow`; adicionar `.gitattributes`; `pnpm install`.
5. **Validar o frontend no Linux** antes de qualquer código novo: `pnpm lint`, `typecheck`, `test`, `build`,
   `build:all`; abrir `pnpm dev` e os três experimentos no navegador do Windows.
6. **Ferramentas:** abrir o projeto pelo VS Code (WSL) ou PhpStorm (WSL); iniciar o Claude Code dentro do Ubuntu
   na nova pasta (a memória desta sessão fica ligada à pasta do Windows; o estado do projeto está na documentação).
7. **Aposentar a cópia do Windows** só depois da validação (decisão do responsável), para não haver duas cópias
   de trabalho divergentes.
8. Seguir para a T-B1 (criar o Laravel em `apps/api` com Kool + MySQL).
