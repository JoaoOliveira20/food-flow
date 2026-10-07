# Food Flow — Tarefas

Atualizado em 06/10/2026.

O projeto não tinha um documento próprio de tarefas: elas eram acompanhadas em tabelas com ID e estado
(`DOCUMENTATION_REVIEW.md`, seção D) e registradas em `AI_DECISIONS.md`. Este documento segue o mesmo formato e
começa pela fase Backend, Admin e Conteúdo Dinâmico.

Tarefas anteriores: todas as decididas estão implementadas (`DOCUMENTATION_REVIEW.md`, "Resultado"). Pendências
herdadas, fora desta fase: lista definitiva de variantes de pão (`OPEN_DECISIONS.md` §13), validação com pessoas e
aparelhos reais, "pouso" animado da miniatura (F3), `favicon.ico`.

Legenda: ✅ concluída · 📝 proposta registrada, aguarda confirmação · ⏳ não iniciada · 🚧 em andamento ·
⏸ futura (não implementar). Decisões referenciadas: `BACKEND_DECISIONS.md`.

**Regra desta fase:** nenhuma tarefa das fases B a G começa antes de T-A9 (✅) e da Fase 0 (ambiente).

---

## Fase A — Arquitetura

| ID | Tarefa | Decisões | Depende de | Estado |
| --- | --- | --- | --- | --- |
| T-A1 | Analisar arquitetura, documentação e código atuais | — | — | ✅ 06/10/2026 (`ARCHITECTURE.md` §1) |
| T-A2 | Definir fronteira Next.js/Laravel e responsabilidades | DT-01–DT-03, BD-01, BD-12 | T-A1 | ✅ 06/10/2026 |
| T-A3 | Definir estrutura do backend (pasta, workspace, banco) | BD-19 | T-A1 | ✅ 06/10/2026 (MySQL) |
| T-A4 | Definir montador/contexto e relação com ingredientes | BD-02, BD-03 | T-A1 | ✅ 06/10/2026 |
| T-A5 | Definir modelo de dados e relação presets ↔ ingredientes | BD-04–BD-07, BD-13, BD-17 | T-A4 | ✅ 06/10/2026 |
| T-A6 | Definir Storage, formatos, limites e substituição de imagens | BD-09, BD-10, BD-16 | T-A1 | ✅ 06/10/2026 |
| T-A7 | Definir respostas e contrato da API | BD-18, `ARCHITECTURE.md` §5 | T-A5 | ✅ 06/10/2026 |
| T-A8 | Definir visibilidade/publicação e exclusões | BD-14, BD-15 | T-A5 | ✅ 06/10/2026 |
| T-A9 | **Revisão do responsável:** confirmar propostas, conflitos C1–C5 e abertas O1–O6; registrar respostas | todas | T-A2–T-A8 | ✅ 06/10/2026 — todas as recomendações aceitas; banco MySQL; pendente só O5 (não bloqueia) |
| T-A10 | Definir o ambiente de desenvolvimento (WSL2 + Docker/Kool) | BD-21, `ARCHITECTURE.md` §10 | T-A9 | ✅ 06/10/2026 |

---

## Fase 0 — Ambiente de desenvolvimento (WSL2 + Docker/Kool)

Proposta em `ARCHITECTURE.md` §10. Iniciada em 06/10/2026 a pedido do responsável. Uma primeira tentativa de cópia
pelo Explorador do Windows travou no `node_modules` e foi descartada; o repositório foi clonado em vez de copiado.

| ID | Tarefa | Depende de | Estado |
| --- | --- | --- | --- |
| T-01 | Commitar e enviar ao GitHub a documentação desta fase; manter a cópia do Windows intocada como backup | T-A10 | 🚧 06/10/2026 — tudo commitado no branch `feature/backend-admin`; push aguardando autorização do responsável |
| T-02 | Preparar o Ubuntu: corrigir `~/.ssh` (dono e permissões), `core.autocrlf input`, Node 24 (nvm), Corepack/pnpm; conferir que `node`/`pnpm` são os do Linux | T-A10 | ✅ 06/10/2026 — `autocrlf input`, Node 24.21.0 (padrão no nvm), Corepack e pnpm 12.6.0 do Linux; SSH com o GitHub funcionando. Recomendado (não bloqueia): `~/.ssh` ainda pertence ao `root` |
| T-03 | Docker: ligar a integração WSL do Docker Desktop para `Ubuntu`; conferir `docker info`, `docker compose version` e `kool`; conferir se as imagens PHP do Kool atendem ao Laravel atual | T-A10 | ✅ 06/10/2026 — Docker 29.5.2, Compose v5.1.3 e Kool 3.6.0 no Ubuntu; Laravel atual (skeleton 13.10.1 / framework 13.34.0) exige PHP ^8.3 e o Kool tem `kooldev/php` 8.3, 8.4 e 8.5 com nginx (atualizadas em 30/08/2026) |
| T-04 | Clonar em `/home/palad/projetos/food-flow`; adicionar `.gitattributes` (LF); `pnpm install` | T-01, T-02 | ✅ 06/10/2026 — clonado da cópia do Windows (histórico completo, `origin` → GitHub), documentação copiada em LF e conferida, `pnpm install`, `.gitattributes` (renormalização sem mudança em código) |
| T-05 | Validar no Linux: `pnpm lint`, `typecheck`, `test`, `build`, `build:all`; `pnpm dev` e os três experimentos abertos no navegador do Windows | T-04 | ✅ 06/10/2026 — `lint`, `typecheck`, `test` (61), `build:all`; `pnpm dev` e os três experimentos responderam 200 no Linux e no navegador do Windows |
| T-06 | Editores e Claude Code apontando para a pasta do WSL; atualizar `README.md` com o fluxo de desenvolvimento | T-05 | ✅ 06/10/2026 — Claude Code rodando no WSL com as conversas migradas; `README.md` com o fluxo (WSL, `code .`, como rodar e parar) |
| T-07 | Aposentar a cópia do Windows (decisão do responsável) | T-05 | ⏳ |

T-B1 passa a depender de T-03 e T-05.

Experimentos (`experiments/`): encerrados por decisão do responsável (06/10/2026). Foram só executados para validar o
ambiente e não devem ser alterados nem mantidos; servem de referência para a decisão da biblioteca de animação.

---

## Fase B — Backend base

| ID | Tarefa | Decisões | Depende de | Estado |
| --- | --- | --- | --- | --- |
| T-B1 | Criar a aplicação Laravel em `apps/api` (versão estável atual) com Kool (`kool.yml`, `docker-compose.yml`: app + MySQL); excluir do pnpm workspace; scripts `dev:api`/`test:api` na raiz; requisitos no `README.md` | BD-19, BD-21 | T-03, T-05 | ✅ 06/10/2026 — Laravel 13 (framework ^13.17, PHP ^8.3) em `apps/api`; `kooldev/php:8.4-nginx` (PHP 8.4.25) via `docker-compose.yml`/`kool.yml` escritos à mão (o assistente do Kool 3.6 só oferece PHP ≤ 8.3); fora do pnpm workspace; `pnpm dev:api`/`stop:api`/`test:api`; `AGENTS.md` do esqueleto (instalar PHP no host e Laravel Boost) substituído pelas regras do projeto |
| T-B2 | Configurar banco MySQL (serviço do Kool), banco de teste separado e `.env.example` | BD-19, BD-21 | T-B1 | ✅ 06/10/2026 — `mysql:8.4` (volume `food-flow-api_database`, porta só em 127.0.0.1); bancos `food_flow` e `food_flow_testing`; `phpunit.xml` aponta para o banco de teste; `.env.example` com MySQL; migrations padrão e testes de exemplo passando; PHPUnit 12 (padrão do instalador, O6) |
| T-B3 | Configurar Storage: disco configurável, `storage:link`, geração de URL; limites do PHP para upload | BD-09, BD-10 | T-B1 | ✅ 06/10/2026 — `config/media.php` (disco por `MEDIA_DISK`, diretórios, limites do BD-10); `App\Media\ImageStorage` (nome por hash, extensão pelo conteúdo, dimensões, URL, remoção); disco `public` com `throw`; link relativo `public/storage` sem pacote extra; limites PHP 3M/4M e nginx 4M; 5 testes |
| T-B4 | Migrations: `builders`, `bun_variants`, `ingredients`, `presets`, `preset_items` (FKs, índices únicos, `restrict`) | BD-02–BD-07 | T-B2 | ✅ 06/10/2026 — 4 migrations (FKs `restrict`; itens em `cascade`; `initial_preset_id` com FK adicionada após `presets`); únicos por montador; `migrate` / `rollback` / `migrate` verificados no MySQL |
| T-B5 | Models, relacionamentos (`Preset hasMany PresetItem`), casts, `$fillable` | BD-06 | T-B4 | ✅ 06/10/2026 — `Builder`, `BunVariant`, `Ingredient` (escopo `visible`, oculto por padrão), `Preset` (escopo `available`, `isAvailable`, `replaceItems`), `PresetItem`; `builder_id` fora do fillable; factories; 10 testes (ordem, repetição, disponibilidade, `restrict`/`cascade`) |
| T-B6 | Seeders com os dados atuais (montador, 4 variantes, 13 ingredientes visíveis, 3 presets, composição inicial); PNGs gravados pelo Storage a partir de `apps/api/database/seeders/assets/` | BD-07, BD-17, C2 | T-B3, T-B5 | ✅ 06/10/2026 — `BurgerCatalogSeeder`: montador `burger` (14 camadas), 4 variantes, 13 ingredientes visíveis com as formas atuais, presets Clássico/Bacon/Duplo e o preset inicial (fora do painel); imagens gravadas pelo `ImageStorage` (dimensões lidas dos arquivos); idempotente e com limpeza das imagens em caso de falha; `kool run reset` limpa as imagens antigas; 5 testes. PNGs copiados para `apps/api/database/seeders/assets/` (os de `apps/web` saem na T-E5) |
| T-B7 | Estrutura da API: rotas pública e `/api/admin`, API Resources, formato de erro, CORS, `throttle`; decidir camelCase × snake_case | BD-12, BD-18, BD-20 | T-B5 | ✅ 06/10/2026 — `routes/api.php` (grupo público e `/api/admin`), `throttle` 120/60 por minuto, CORS restrito ao frontend, erros sempre em JSON (404 traduzido), pt-BR, modo estrito do Eloquent, camelCase (BD-18), `GET /api/admin/builders` com contagens; scaffolding de frontend removido; 5 testes |
| T-B8 | Base de testes do backend (feature tests com banco MySQL de teste e `Storage::fake`) | BD-19 | T-B7 | ✅ 06/10/2026 — PHPUnit 12 no banco MySQL `food_flow_testing` com `RefreshDatabase`; `Storage::fake` em disco de teste; factories para todos os models |
| T-B9 | Endpoint público `GET /api/builders/{slug}`: visíveis, presets disponíveis, composição inicial, `maxLayers` | BD-07, BD-13, BD-14 | T-B6, T-B7 | ✅ 06/10/2026 — `GET /api/builders/{slug}`: variantes, ingredientes visíveis, presets disponíveis (sem o inicial), `initialRecipe` (vazia se o inicial estiver indisponível), `maxLayers`, URLs absolutas das imagens; consultas em número fixo; 8 testes. Contrato em `apps/api/README.md` |

## Fase C — Ingredientes (backend)

| ID | Tarefa | Decisões | Depende de | Estado |
| --- | --- | --- | --- | --- |
| T-C1 | Listar e detalhar ingredientes no admin (inclui ocultos e uso em presets) | BD-18 | T-B7 | ✅ 06/10/2026 — lista com ocultos e `presetsCount` (presets distintos); detalhe com os presets que usam o ingrediente |
| T-C2 | Criar ingrediente com upload: Form Request, regras de arquivo, dimensões calculadas, nome por hash, nasce oculto | BD-04, BD-05, BD-08–BD-10 | T-B3, T-C1 | ✅ 06/10/2026 — `StoreIngredientRequest` (PNG/WebP pelo conteúdo + extensão coerente, 2 MB, 280–3000 px, faixas da forma, slug único por montador ou gerado), `IngredientService` (grava a imagem antes do banco; remove se falhar); nasce oculto (`isVisible` proibido na criação); mensagens em pt-BR |
| T-C3 | Editar ingrediente: nome, slug, forma; troca de imagem com remoção do arquivo antigo após o commit | BD-16, BD-17 | T-C2 | ✅ 06/10/2026 — edição parcial; troca de imagem por `POST` + `_method=PATCH`; arquivo antigo removido só após o commit; troca recusada mantém a imagem atual |
| T-C4 | Publicar/ocultar (`is_visible`) e reflexo na disponibilidade dos presets | BD-14 | T-C1 | ✅ 06/10/2026 — `isVisible` no PATCH; ocultar retira o ingrediente e os presets que o usam da API pública |
| T-C5 | Excluir ingrediente: 409 se usado em preset; arquivo removido após o commit | BD-15, BD-16 | T-C2 | ✅ 06/10/2026 — 409 com a lista de presets se estiver em uso (FK `restrict` como reforço); sem uso: remove registro e arquivo |
| T-C6 | Testes de upload: extensão falsa, MIME trocado, SVG, JPEG, arquivo corrompido, grande demais, pequeno demais, nome com caminho | BD-10 | T-C2 | ✅ 06/10/2026 — 21 testes: JPEG, GIF, SVG com script, texto e PHP renomeados para .png, PNG com extensão .php, estreito, alto e pesado demais, WebP aceito, falha de banco sem órfão; verificado ao vivo também 3,5 MB (422) e 5 MB (413 do nginx) |

## Fase D — Presets (backend)

Pode correr em paralelo com a Fase C.

| ID | Tarefa | Decisões | Depende de | Estado |
| --- | --- | --- | --- | --- |
| T-D1 | Listar e detalhar presets no admin (itens ordenados, disponibilidade, marca do inicial) | BD-06, BD-14 | T-B7 | ✅ 06/10/2026 — lista (inclui o inicial, `isInitial`) e detalhe com `ingredientIds` ordenados e `isAvailable` |
| T-D2 | Criar preset: nome, variante e ingredientes do mesmo montador, 1 a `max_layers` itens, repetição permitida | BD-06, BD-13 | T-D1 | ✅ 06/10/2026 — `StorePresetRequest`: nome único por montador, pão e ingredientes do mesmo montador (`exists` com escopo), 1 a `maxLayers` itens, lista (não objeto), repetições permitidas, ingredientes ocultos permitidos (preset fica indisponível); `PresetService` em transação |
| T-D3 | Editar preset: substituição transacional da lista de itens | BD-06 | T-D2 | ✅ 06/10/2026 — edição parcial; `ingredientIds` substitui a lista inteira na transação; edição inválida não altera nada; preset inicial editável |
| T-D4 | Excluir preset: itens em cascata; 409 para o preset inicial | BD-15 | T-D1 | ✅ 06/10/2026 — itens em cascata; 409 para o preset inicial (mensagem explicativa) |
| T-D5 | Testes: ingrediente de outro montador, inexistente, acima do limite, ordem e repetição preservadas | BD-06 | T-D3 | ✅ 06/10/2026 — 14 testes (outro montador, inexistente, acima do limite, lista malformada, ordem e repetição, disponibilidade, inicial) |

## Fase E — Integração com o builder

T-E1 não depende do backend e pode começar logo após a Fase 0, em paralelo com a Fase B.

| ID | Tarefa | Decisões | Depende de | Estado |
| --- | --- | --- | --- | --- |
| T-E1 | Refatorar o catálogo para "dado recebido": funções puras e componentes recebem o catálogo; dados atuais viram fixture. **Sem mudança visual ou de comportamento** | BD-11 | T-05 | ✅ 06/10/2026 — `catalog.ts` (tipos, `BuilderCatalog`, buscas com o catálogo como parâmetro) e `burgerCatalog.ts` (dados, provisório); `maxLayers` no estado da composição; catálogo por props desde `BurgerBuilder`; 61 testes, lint e build; HTML renderizado idêntico ao anterior (309 linhas, 25 imagens das miniaturas) |
| T-E2 | Tipos e cliente da API no frontend (mapeamento da resposta para `Ingredient`, `BunVariant`, `CompositionPreset`, receita inicial) | BD-11, BD-18 | T-B9 (ou contrato congelado em T-B7) | ✅ 06/10/2026 — `src/api/builderCatalog.ts`: `fetchBuilderCatalog` (servidor, `API_URL`) e `toBuilderCatalog` (conversão pura, ids em texto); 2 testes |
| T-E3 | `page.tsx` busca o montador no servidor e passa ao `BurgerBuilder`; estados de carregamento, erro e vazio; estratégia de cache conforme docs do Next 16 | BD-11 | T-E1, T-E2, T-B9 | ✅ 06/10/2026 — `page.tsx` com `connection()` (busca a cada requisição, nunca no build), `loading.tsx`, `error.tsx` (com `retry`), `not-found.tsx`, montador indisponível sem pães e painéis vazios; verificado com a API real (página com os dados do banco; API parada → falha tratada). Tela de erro no navegador não verificada visualmente (sem navegador automatizado no WSL) |
| T-E4 | `next.config.ts`: `remotePatterns` da URL do Storage; `dangerouslyAllowLocalIP` só em desenvolvimento | BD-09 | T-B3 | ✅ 06/10/2026 — nada a configurar: as imagens usam `unoptimized` e carregam direto do Storage (200, sem `/_next/image`); `remotePatterns`/`dangerouslyAllowLocalIP` desnecessários (correção registrada no BD-10) |
| T-E5 | Remover dados fixos (`INGREDIENTS`, `BUN_VARIANTS`, `PRESETS`, `INITIAL_RECIPE`, `MAX_LAYERS`) e os PNGs de `apps/web/public`; adaptar testes. Não tocar em `experiments/` | DT-05 | T-E3, T-E4, T-B6 | ✅ 06/10/2026 — catálogo fixo virou fixture de teste (`src/test/burgerCatalogFixture.ts`); 21 PNGs removidos de `apps/web/public` (idênticos aos do seed; README das regras movido para `apps/api/database/seeders/assets/`); testes de PNG e de receitas do frontend removidos (cobertos no backend); 37 testes, lint, typecheck e build; `/` agora é dinâmica (ƒ). Experimentos intocados |
| T-E6 | Validar paridade: mesmo visual e comportamento antes/depois (roteiro headless, presets, arraste, limite) e ingrediente oculto ausente do builder | DT-11 | T-E5 | ✅ 06/10/2026 — HTML do builder (build de produção lendo da API) idêntico ao do builder com dados fixos (256 linhas de conteúdo; só mudam as URLs das imagens e os scripts de streaming); ocultar o bacon no banco o remove do painel e retira o preset Bacon, e restaurar devolve ambos. Interação no navegador (arraste, animações) não verificada nesta sessão: falta navegador automatizado no WSL |

## Fase F — Admin

| ID | Tarefa | Decisões | Depende de | Estado |
| --- | --- | --- | --- | --- |
| T-F1 | Estrutura `/admin`: layout, navegação, cliente de gestão, exibição de erros 422/409 | BD-12, BD-20 | T-E2, T-B7 | ✅ 06/10/2026 — `/admin` com layout próprio (ponto único para proteger no futuro), aviso de versão sem login, `loading`/`error`; `src/api/admin/` com leituras no servidor (`queries.ts`), escritas do navegador (`mutations.ts`, `ApiError` com erros por campo e mensagens para 409/413/429) e tipos; `NEXT_PUBLIC_API_URL` no `.env.example` |
| T-F2 | Dashboard: contagens, listas de ingredientes (miniatura, visível) e presets, ações de editar | — | T-F1, T-C1, T-D1 | ✅ 06/10/2026 — painel com contagens, lista de ingredientes (miniatura, visível/oculto, uso em presets) e de presets (miniatura pelo mesmo `RecipePreview` do builder, composição inicial, indisponível), links de edição e criação; verificado com a API real |
| T-F3 | Criar ingrediente: imagem com preview local no renderer real, dicas de imagem, nome, forma com valores sugeridos | BD-08, `ASSET_ANALYSIS.md` | T-F1, T-C2, T-E1 | ✅ 06/10/2026 — `/admin/ingredients/new`: imagem com preview local (dimensões, tamanho e avisos: tipo, 2 MB, bordas sem transparência, mais alta que larga, menos de 800 px), nome, três medidas com controle deslizante + número e explicação, preview no renderer real entre camadas e pão escolhidos, dicas de imagem; cria oculto e leva à edição |
| T-F4 | Editar ingrediente: ajuste da forma com preview, troca de imagem | BD-08, BD-16 | T-F3, T-C3 | ✅ 06/10/2026 — `/admin/ingredients/[id]`: mesmo formulário, troca de imagem (multipart + `_method=PATCH`), erros por campo do 422 |
| T-F5 | Publicar/ocultar com aviso dos presets que ficam indisponíveis | BD-14 | T-F4, T-C4 | ✅ 06/10/2026 — publicar/ocultar; ao ocultar um ingrediente usado, confirmação na tela listando os presets que ficam indisponíveis |
| T-F6 | Excluir ingrediente com confirmação e explicação do 409 | BD-15 | T-F2, T-C5 | ✅ 06/10/2026 — exclusão com confirmação na tela; 409 mostra os presets que bloqueiam, com links. Verificação: páginas renderizadas com a API real, 404 próprio do admin, preflight CORS de PATCH/DELETE aceito, 9 testes do cliente de escrita; cliques no navegador não verificados (sem navegador automatizado) |
| T-F7 | Criar/editar preset: nome, pão, ingredientes ordenados (adicionar, mover, remover, repetir), limite, miniatura | BD-06, BD-13 | T-F1, T-D3, T-E1 | ✅ 06/10/2026 — `/admin/presets/new` e `/admin/presets/[id]`: nome, pão, receita desenhada como a pilha (pão superior no alto), subir/descer/remover por camada, adicionar no topo com repetição, contador e limite, ingredientes ocultos marcados com aviso de indisponibilidade, miniatura pelo `RecipePreview`; erros por campo e por item |
| T-F8 | Excluir preset (bloqueio do preset inicial explicado) | BD-15 | T-F7, T-D4 | ✅ 06/10/2026 — exclusão com confirmação na tela; o preset inicial explica por que não pode ser excluído (e a API responde 409). Páginas verificadas com a API real; cliques no navegador não verificados |
| T-F9 | Editor de preset no formato do montador (pedido do responsável após testar: o formulário com lista suspensa era pouco prático) | BD-06, BD-13 | T-F7 | ✅ 06/10/2026 — `/admin/presets/*` usa o próprio `BurgerBuilder` (clique, arraste, seleção, pão) com uma barra do preset no lugar do cabeçalho: nome, contagem, aviso de ingrediente oculto, "Alterações não salvas", desfazer/limpar, salvar; painel "Começar a partir de" com os outros presets; ocultos marcados no painel; aviso do navegador ao sair sem salvar. `BurgerBuilder` ganhou `initialRecipe`, `renderHeader`, `isEmbedded` e `presetsTitle` sem mudar o montador público. Roteiro de ponta a ponta 28/28 |
| T-F10 | Padronizar as telas de criação/edição (pedido do responsável: cada uma estava de um jeito; a de ingrediente estava ruim) | — | T-F9 | ✅ 07/10/2026 — padrão "estúdio" escolhido pelo responsável para ingrediente, tipo de pão e preset: `StudioBar` fixa (nome, selos de status, Voltar, Desfazer, Publicar/Ocultar, Salvar, mensagens), controles à esquerda, hambúrguer grande ao centro, opções do preview e dicas à direita, zona de perigo no rodapé; `AdminPageHeader` comum; publicar/ocultar foi para a barra (bloqueado com alterações não salvas); aviso ao sair sem salvar nas três telas; componentes e estilos antigos removidos. Roteiro de ponta a ponta 34/34; celular sem rolagem lateral |
| T-F11 | Preview do ingrediente num hambúrguer pronto (pedido do responsável: escolher camada acima, abaixo e pão era estranho) | — | T-F10 | ✅ 07/10/2026 — o preview usa um preset como hambúrguer de base (Clássico por padrão) com o botão Sem/Com; o ingrediente entra no topo, como ao adicionar no montador; se o preset já leva o ingrediente editado, ele aparece no lugar dele com as alterações. Roteiro de ponta a ponta 34/34 |
| T-F12 | Redesenho do admin: menu e todas as telas (pedido do responsável: não gostou do resultado anterior) | — | T-F11 | ✅ 07/10/2026 — shell novo com menu lateral (seções Geral/Catálogo/Montador, contagens, indicador animado), gaveta no celular, busca ⌘K/Ctrl K com ingredientes, pães, presets e ações, tema claro/escuro/sistema sem piscar; Visão geral com indicadores, "Precisa de atenção" e "Editados recentemente"; listas próprias de Ingredientes, Tipos de pão e Presets em galeria com busca sem acento e filtros; estúdios reestilizados (barra de vidro, painéis, palco), toasts de sucesso/erro, skeletons de carregamento, fonte Geist. Roteiro de ponta a ponta 36/36, console sem erros, celular sem rolagem lateral, capturas em claro, escuro e celular revisadas |
| T-F13 | Publicar/ocultar presets (pedido do responsável: deixar um preset só no admin enquanto trabalha nele; o filtro "Indisponíveis" não tinha como ser acionado pelo admin) | BD-23 | T-F12 | ✅ 07/10/2026 — `presets.is_visible` (migration marca os atuais como visíveis), preset novo nasce oculto, `isVisible` no `PATCH`, 409 ao ocultar o inicial, catálogo público só com presets visíveis e disponíveis; admin com Publicar/Ocultar no editor de preset, estados Publicado/Oculto/Indisponível/Composição inicial na lista, na busca e na visão geral. API 88 testes; web 57; roteiro de ponta a ponta 40/40 |
| T-F14 | Posicionar o ingrediente no preview do estúdio (pedido do responsável: o preset tinha arrastar e soltar, o ingrediente não) | — | T-F11 | ✅ 07/10/2026 — palco interativo do montador extraído do `BurgerBuilder` (`useBurgerWorkbench` + `BurgerWorkbench`, sem mudar o montador público) e usado no estúdio de ingrediente: arrastar camadas, tocar para subir/descer/duplicar/remover (sem "Substituir"), Sem/Com e hambúrguer de base continuam; mexer no preview não marca alterações. Roteiro de ponta a ponta 42/42 (inclui arrastar no estúdio) |
| T-F15 | Responsividade e ergonomia multiplataforma (pedido do responsável: do celular de 375 px ao ultrawide) | — | T-F14 | ✅ 07/10/2026 — auditoria automática em 8 larguras (360 a 2560) × 10 telas: sem rolagem lateral, toque ≥ 44 px, texto ≥ 12 px, campos com 16 px no toque (sem zoom no iOS), imagens sem distorção (0 problemas no fim). Admin: navegação inferior no celular, menu lateral recolhível (automático entre 1024 e 1279 px, preferência salva, sem piscar), barra de salvar fixa no celular, áreas seguras (`viewport-fit=cover`), densidade por breakpoint e largura maior em telas ≥ 1600 px. Montador: camadas finas com área de toque mínima (48 px no toque, 24 px no mouse) e largura limitada no ultrawide. Correção encontrada no caminho: *deadlock* do rate limit no cache em banco. Roteiro de ponta a ponta 47/47 |

## Fase G — Qualidade

| ID | Tarefa | Depende de | Estado |
| --- | --- | --- | --- |
| T-G1 | Suíte do backend completa (validação, uploads, relações, visibilidade, exclusões, endpoint público) e Laravel Pint | C, D | ✅ 06/10/2026 — 73 testes (378 asserções) e Laravel Pint sem pendências |
| T-G2 | Testes do frontend com fixtures; `pnpm lint`, `typecheck`, `test`, `build` | E | ✅ 06/10/2026 — 46 testes (lógica do builder, conversão da API, cliente de escrita), `lint`, `typecheck` e `build` limpos |
| T-G3 | Verificação headless do builder com dados reais da API (desktop e toque) | T-E6 | ✅ 06/10/2026 — Chrome headless (puppeteer-core numa pasta temporária do Windows, fora do repositório) contra o build de produção e a API real: catálogo da API, clique, troca de preset com confirmação, arraste até o hambúrguer, reset |
| T-G4 | Verificação dos fluxos do admin (criar oculto → testar → publicar → aparece; preset → aparece; exclusões) | F | ✅ 06/10/2026 — mesmo roteiro: validação (sem imagem; nome vazio vindo da API), upload real com preview local, nasce oculto, publicar → aparece no builder, preset → aparece, ocultar avisa e retira ingrediente e preset, exclusão bloqueada (409) explicada, excluir preset e ingrediente; console sem erros; 24/24 em três execuções seguidas, dados deixados como antes |
| T-G5 | Revisão de UX do admin | F | ✅ 06/10/2026 — revisão por capturas (desktop e 390 px): corrigidas miniaturas vazias no admin, texto de apoio colado ao título, barra do topo quebrando no celular, favicon ausente; sem rolagem horizontal no celular. A verificação também revelou o problema dos limites por IP (BD-18, revisado) |
| T-G6 | Revisão da documentação: `apps/web/README.md`, README de `apps/api`, `DATA_MODEL.md`, `ARCHITECTURE.md`, `AI_DECISIONS.md`; mover decisões confirmadas para 🟢 | todas | ✅ 06/10/2026 — READMEs (raiz: como rodar e endereço do admin; `apps/web`: seção do admin; `apps/api`: limites), BD-12/BD-18, `ARCHITECTURE.md` §7, `AI_DECISIONS.md` |

Testes de cada tarefa entram junto com ela; a Fase G é a passada final.

## Fase H — Evolução futura (registrar, não implementar)

| ID | Item | Observação |
| --- | --- | --- |
| T-H1 | Autenticação | Provável Laravel Sanctum (SPA por cookie); encaixe pronto em `/api/admin` (BD-20) |
| T-H2 | Autorização | Policies/Gates nos Form Requests e controllers |
| T-H3 | Roles e permissões | Ex.: admin × editor; pacote só se as regras justificarem |
| T-H4 | Proteção do admin no Next | Segmento `/admin` com layout único; ver docs do Next 16 para o mecanismo |
| T-H5 | Usuários | Pré-requisito de H1–H3 |
| T-H6 | Auditoria | Autoria e histórico de alterações, se fizer sentido |
| T-H7 | Admin de variantes de pão | ✅ 07/10/2026 (pedido do responsável) — API (BD-22): visibilidade, CRUD com duas imagens, preset com pão oculto indisponível, último pão visível protegido, 11 testes. Admin: seção "Tipos de pão" no painel, `/admin/bun-variants/new` e `/[id]` com as duas imagens, avisos de proporção, preview do pão novo com o recheio de um preset ao lado de um pão existente, publicar/ocultar, excluir; editor de preset avisa pão oculto. Cartões de visibilidade e exclusão viraram componentes genéricos. Roteiro de ponta a ponta 34/34 |
| T-H8 | Comando para listar/remover arquivos órfãos | BD-16 |
| T-H9 | Storage externo (S3 ou similar) | Troca de disco por configuração (BD-09) |
| T-H10 | Segundo montador (ex.: pizza) | Retoma `OPEN_DECISIONS.md` §15/§16 para o renderer; decidir BD-04 B ou C |
| T-H11 | Otimização/conversão de imagens no backend | Só se o `<Image>` do Next não bastar |
| T-H12 | Lixeira / soft delete | Não pedido |
| T-H13 | Cache com revalidação sob demanda | Quando a renderização dinâmica pesar |
| T-H14 | Status de publicação com mais estados | Migrar `is_visible` → `status` (BD-14) |

---

## Ordem recomendada e dependências

```text
T-A9 (revisão do responsável)
 │
 ├─▶ T-E1 (catálogo como dado; sem backend) ─────────────────────────────┐
 │                                                                       │
 └─▶ T-B1 ─┬─▶ T-B2 ─▶ T-B4 ─▶ T-B5 ─┬─▶ T-B6 (seed) ──────┐             │
           │                         └─▶ T-B7 (API base) ──┼─▶ T-B9 ─▶ T-E2 ─▶ T-E3 ─▶ T-E5 ─▶ T-E6
           └─▶ T-B3 (storage) ─▶ T-E4 (next.config) ───────┼──────────────────────────▲
                                                           │
                                 T-B7 ─┬─▶ Fase C (ingredientes) ─┐
                                       └─▶ Fase D (presets) ──────┴─▶ Fase F (admin) ─▶ Fase G
```

(T-E3 depende de T-E1, T-E2 e T-B9; T-E5 depende de T-E3, T-E4 e T-B6; T-F3, T-F4 e T-F7 também dependem de
T-E1.)

1. **T-A9** ✅ e **Fase 0** (ambiente WSL2 + Kool; bloqueia tudo o que segue).
2. **T-E1** em paralelo com **T-B1–T-B5**: reduz o risco da integração cedo, sem depender do backend.
3. **T-B6, T-B7, T-B8, T-B9** — seed e API mínima; o builder já pode ler da API.
4. **T-E2–T-E6** — builder lendo da API, com paridade validada. A partir daqui não há segunda fonte de verdade.
5. **Fases C e D** em paralelo (podem começar logo após T-B7, em paralelo com a Fase E).
6. **Fase F** — telas do admin, cada uma assim que seu endpoint existir (F3/F4 também dependem de T-E1 para o
   preview).
7. **Fase G** — passada final de qualidade e documentação.

Paralelizáveis: T-B3 ∥ T-B2/T-B4; T-E1 ∥ Fase B; Fase C ∥ Fase D ∥ Fase E; T-F3–T-F6 ∥ T-F7–T-F8.
