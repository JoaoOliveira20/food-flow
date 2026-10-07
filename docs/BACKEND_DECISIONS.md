# Food Flow — Decisões da fase Backend, Admin e Conteúdo Dinâmico

Início: 06/10/2026. Status: 🟢 **Revisão T-A9 feita em 06/10/2026** (ver "Revisão do responsável" abaixo);
nenhuma questão aberta. Ambiente (BD-21) adotado; fases 0 e B a G implementadas em 06/10/2026 (`TASKS.md`).

## Revisão do responsável — 06/10/2026

O responsável **aceitou todas as recomendações** deste documento. Com isso, os conflitos C1–C5 e as questões
O1–O3 e O6 ficam resolvidos como recomendado, e as propostas BD-01 a BD-20 passam a valer como decididas, com as
exceções abaixo. As seções seguintes preservam a análise original (alternativas e trade-offs) como histórico.

| Item | Resultado |
| --- | --- |
| C1 | 🟢 Reativada só a parte de dados (montador como entidade); reutilização do renderer continua adiada; pizza não é o segundo dataset oficial |
| C2 | 🟢 Clássico, Bacon e Duplo viram dados iniciais (seed), editáveis no admin |
| C3 | 🟢 Pão continua variante (`DOMAIN_DECISIONS.md` §6) |
| C4 / O2 | 🟢 Composição inicial = preset apontado por `builders.initial_preset_id`, fora do painel de presets |
| C5 | 🟢 Preview local antes de salvar; ingrediente nasce oculto |
| O1 | 🟢 Sem admin de variantes de pão nesta fase (seed + leitura) |
| O3 | 🟢 Presets com disponibilidade derivada (sem campo de visibilidade) |
| O6 | 🟢 Framework de testes padrão do instalador do Laravel |
| O4 | 🟢 **MySQL** (e não SQLite, como fora recomendado). BD-19 atualizado |
| Ambiente | 🟢 WSL2 + Kool/Docker (BD-21), adotado e executado em 06/10/2026 |
| O5 | 🟢 **Só local** (06/10/2026): com Laravel + Next.js, não há hospedagem gratuita prevista; quem quiser testar roda localmente. Mas o projeto deve ser feito **com padrão de produção**, como se fosse ficar no ar (validação, segurança, testes, configuração por ambiente). Publicar exige antes a autenticação (T-H1) |

Requisitos de origem: `docs/requirements/food-flow-backend-admin-evolution.md` (cópia do documento entregue pelo
responsável). Visão de arquitetura: `ARCHITECTURE.md`. Modelo de dados proposto: `DATA_MODEL.md` (seção "Modelo
persistido"). Tarefas: `TASKS.md`.

Legenda (a mesma de `OPEN_DECISIONS.md`, mais 🔷):

| Símbolo | Significado |
| --- | --- |
| 🟢 | Decidido pelo responsável (no documento de requisitos ou antes) |
| 🔷 | **Proposta** da IA, com alternativas analisadas; só vale depois de confirmada |
| ⏳ | Em aberto: precisa de resposta do responsável antes da tarefa correspondente |
| ⚠️ | Conflito ou tensão com uma decisão anterior; precisa de confirmação |
| ⏸ | Adiado / evolução futura |

Regra (igual à de `OPEN_DECISIONS.md`): uma proposta só passa a 🟢 depois de confirmada. Ao confirmar, registrar
a data aqui e mover o histórico para baixo da decisão, sem apagá-lo.

---

## 1. Decisões já tomadas (🟢)

Tomadas pelo responsável no documento de requisitos (06/10/2026). Não são reabertas aqui.

| ID | Decisão | Origem (requisitos) |
| --- | --- | --- |
| DT-01 | A arquitetura passa a ser Next.js → Laravel API → banco de dados → Laravel Storage. | §1 |
| DT-02 | O Laravel é a fonte de verdade de regras de negócio, validações, persistência, ingredientes, presets, montador, uploads, storage e visibilidade. O frontend não é autoridade para regras importantes. | §1, §12, §14 |
| DT-03 | O Next.js fica com builder, interface pública, admin, consumo da API, Motion, drag and drop, preview e estados de loading/error/empty. | §1, §14 |
| DT-04 | Ingredientes e presets pertencem a um montador (contexto). Um ingrediente não aparece automaticamente em todos os montadores. Novos montadores (ex.: pizza) devem poder ser adicionados sem reescrever a arquitetura, sem virar um framework genérico. | §2 |
| DT-05 | Ingredientes e presets deixam de ser dados fixos no frontend; o frontend não mantém uma segunda fonte de verdade. | §3, §13 |
| DT-06 | Admin no Next.js (`/admin`), **sem** login, autenticação, usuários, autorização ou roles nesta versão (demonstração). | §5 |
| DT-07 | Sem autenticação não significa sem segurança: a API valida tudo o que recebe e resiste a requisições feitas diretamente a ela. | §5, §19 |
| DT-08 | Imagens ficam no Storage do Laravel, sem serviço externo por enquanto, sem acoplamento a um caminho físico. | §8 |
| DT-09 | O backend valida uploads pelo conteúdo do arquivo, não só pela extensão. Sem processamento pesado de imagem sem necessidade. | §8 |
| DT-10 | Ao substituir uma imagem, a anterior não pode virar arquivo órfão. | §7, §8 |
| DT-11 | Um ingrediente pode existir sem aparecer no builder público; a regra é aplicada na API (o frontend não "esconde" um item que continua tratando como válido). | §11 |
| DT-12 | O admin mostra orientações para preparar a imagem, adaptadas aos assets reais, e permite visualizar o ingrediente antes de publicá-lo, de preferência com a mesma lógica visual do builder. | §9, §10 |
| DT-13 | Autenticação, autorização, roles e permissões são evolução futura; não implementar agora. | §15 |
| DT-14 | Estilo: frontend em TypeScript, nomes em inglês, sem comentários desnecessários, sem dependências sem necessidade, preservando Motion, drag and drop e regras visuais, sem modificar `experiments/`. Backend nas convenções do Laravel, sem arquitetura excessivamente complexa. | §20 |

### Decisões anteriores que continuam válidas nesta fase

Nenhuma é alterada pelo planejamento. Elas viram **regras que a migração precisa preservar**:

| Decisão | Onde | Efeito nesta fase |
| --- | --- | --- |
| Biblioteca de animação: Motion | `LIBRARY_DECISION.md` | `layerMotion.ts`, `StackLayer.tsx` e `BurgerStage.tsx` não mudam |
| Modelo da composição (instâncias `{ instanceId, ingredientId }`, receita, `applyRecipe`) | `DATA_MODEL.md` | Continua igual; muda só a **origem** do catálogo (ver BD-11) |
| Empilhamento por `displayWidth` / `restingSurfaceRatio` / `sinkRatio` | `OPEN_DECISIONS.md` §4–§5 | Os três valores passam a ser dados do ingrediente, editáveis no admin (BD-04) |
| Pão é uma **variante** que define topo e base; não é camada | `DOMAIN_DECISIONS.md` §6 | Mantido; ver BD-03 e ⚠️ C3 |
| Pão do meio é ingrediente independente | `DOMAIN_DECISIONS.md` §18, §22 | Vira um ingrediente comum no banco |
| Limite de 14 ingredientes intermediários | `OPEN_DECISIONS.md` §19 | Passa a ser validado também no backend (presets); valor mantido (BD-13) |
| Composição inicial (carne, cheddar, cebola roxa, tomate, alface; pão clássico) | `DOMAIN_DECISIONS.md` §2 | Conteúdo mantido; forma de armazenar em BD-07 |
| Presets usam o mesmo sistema da montagem manual; confirmação; animação igual ao reset | `DOMAIN_DECISIONS.md` §19 | Comportamento mantido; os dados vêm da API |
| Estilo fotográfico, PNG com transparência | `OPEN_DECISIONS.md` §12; README dos assets | Base das regras de upload (BD-09, BD-10) |
| CSS para micro-interações; Motion para composição | `OPEN_DECISIONS.md` §2 | Vale também para o admin |

---

## 2. Conflitos e tensões com decisões anteriores (⚠️)

Nenhum foi resolvido silenciosamente. Cada um tem uma recomendação, mas depende de confirmação.

### C1 — Reutilização e segundo dataset estavam adiados

- **Antes:** `OPEN_DECISIONS.md` §15 (arquitetura de reutilização) e §16 (segundo dataset) — ⏸ adiados "até a
  conclusão do montador de hambúrguer, incluindo os presets". Os presets foram concluídos em 29/09/2026.
- **Agora:** os requisitos (§2) pedem modelagem de montador/contexto pensando em pizza.
- **Recomendação:** reativar **apenas a parte de dados** — cada ingrediente, variante de pão e preset pertence a
  um montador (BD-02). A reutilização do **renderer** (empilhamento, animações, arraste) continua adiada, e pizza
  não passa a ser o segundo dataset oficial (os requisitos a citam como exemplo).
- **Confirmar:** essa divisão; se pizza é o segundo dataset escolhido.

### C2 — A lista de presets decidida passa a ser editável

- **Antes:** `DOMAIN_DECISIONS.md` §19 decidiu os presets Clássico, Bacon e Duplo, com composição exata.
- **Agora:** o admin poderá criar, editar e excluir presets (§4). O exemplo dos requisitos usa outros nomes
  ("Classic Burger", "Cheeseburger", "Double Burger").
- **Recomendação:** os três presets decididos viram os **dados iniciais (seed)**, com os nomes e composições
  atuais; depois disso, o conteúdo é responsabilidade de quem usa o admin. Os nomes do exemplo não são adotados.
- **Confirmar:** que a lista do §19 passa a ser "conteúdo inicial" e não mais regra de produto fixa.

### C3 — Pão aparece como ingrediente no exemplo dos requisitos

- **Antes:** `DOMAIN_DECISIONS.md` §6 — pão é uma variante selecionável que define topo e base; não é camada.
  Os presets referenciam a variante (`bunVariantId`).
- **Agora:** o exemplo dos requisitos (§2) lista "pão" entre os ingredientes do Burger, e o documento não menciona
  variantes de pão em nenhum outro ponto (nem no admin).
- **Recomendação:** manter a decisão do §6 e modelar variantes de pão separadamente (BD-03), sem gerenciamento no
  admin nesta fase (são lidas da API e criadas por seed).
- **Confirmar:** que o pão continua variante; se o admin de variantes de pão entra nesta fase (⏳ O1).

### C4 — Composição inicial fixa no código

- **Antes:** `DOMAIN_DECISIONS.md` §2 fixou a composição inicial; ela está em `INITIAL_RECIPE`
  (`apps/web/src/burger/composition.ts`).
- **Agora:** se ingredientes podem ser ocultados ou excluídos, uma receita fixa no frontend pode apontar para um
  ingrediente indisponível e quebra a regra de fonte única (DT-05).
- **Recomendação:** BD-07 (a composição inicial vira dado do montador).
- **Confirmar:** BD-07 e ⏳ O2.

### C5 — Ordem do fluxo de publicação

- **Requisitos (§10):** selecionar imagem → upload/validação → preview → configurar → salvar → testar → tornar
  visível.
- **Proposta (BD-08):** selecionar imagem → **preview local** → salvar (upload e validação no servidor; ingrediente
  nasce **oculto**) → configurar com preview no renderer real → testar → tornar visível. O resultado e as
  garantias são os mesmos, sem arquivos temporários no servidor.
- **Confirmar:** que a ordem proposta atende.

---

## 3. Decisões propostas (🔷)

Cada proposta registra contexto, alternativas, trade-offs e a escolha recomendada. Critério geral pedido pelo
responsável: **a solução mais simples adequada ao estágio atual, que não impeça a evolução.**

### BD-01 — Fronteira Next.js / Laravel

**Contexto:** hoje o Next.js é a aplicação inteira; não há servidor de dados. A divisão de regras está em
`ARCHITECTURE.md` §3.

| Alternativa | Prós | Contras |
| --- | --- | --- |
| **A. Laravel como API JSON pura; Next.js como único frontend** | Fronteira clara; atende DT-01–DT-03; Laravel faz o que faz bem (validação, ORM, storage) | Duas aplicações para rodar; CORS; URL pública da API |
| B. Laravel com Inertia/Blade para o admin | Admin sem CORS e com sessão nativa | Contraria DT-03/§5 (admin no Next) e duplica stack de interface |
| C. Next.js como BFF (todo acesso passa por route handlers do Next) | Navegador fala só com o Next; esconde a URL da API | Uploads passam duas vezes; duas camadas de validação/erro; mais código sem ganho agora |

**Proposta:** A. A leitura pública e a escrita do admin consomem a API diretamente (detalhes em BD-12).

### BD-02 — Montador (contexto) como entidade

**Contexto:** DT-04. Pizza e hambúrguer não compartilham ingredientes de forma útil: o "queijo" da pizza é outra
imagem (vista de cima), com outras configurações visuais.

| Alternativa | Prós | Contras |
| --- | --- | --- |
| **A. Tabela `builders`; `builder_id` obrigatório em ingredientes, variantes de pão e presets** | Integridade por FK; lugar natural para configuração do montador (limite de camadas, composição inicial); novo montador = nova linha + renderer | Uma tabela a mais |
| B. Coluna texto/enum `builder` em cada tabela, sem tabela | Mínimo de estrutura | Sem lugar para configuração por montador; validação do valor espalhada; novo montador exige mudar o enum |
| C. Muitos-para-muitos (ingrediente compartilhado entre montadores) | Reaproveita um cadastro | Imagem e forma dependem do montador; exigiria configurações no pivot. Complexidade sem caso de uso |

**Proposta:** A. Montadores são criados por seed/migração (adicionar um montador exige um renderer novo no
frontend, então não faz sentido criá-los pelo admin). Campos mínimos: `slug` (`burger`), `name`, `max_layers`,
`initial_preset_id` (BD-07). O frontend escolhe o renderer pelo `slug`. Não há campo de "tipo de renderer" até
existir um segundo renderer.

### BD-03 — Variantes de pão

**Contexto:** ⚠️ C3. Uma variante tem duas imagens (topo e base); os presets e a composição inicial referenciam
uma variante. As formas de empilhamento dos pães (`TOP_BUN_SHAPE`, `BOTTOM_BUN_SHAPE`) são iguais para todas as
variantes.

| Alternativa | Prós | Contras |
| --- | --- | --- |
| A. Manter `BUN_VARIANTS` fixo no frontend | Nenhum trabalho agora | Segunda fonte de verdade; o backend não consegue validar `bun_variant_id` dos presets |
| B. Pão como ingrediente com um "tipo" e duas imagens | Uma tabela só | Mistura camada e variante; colunas nulas para todos os outros ingredientes; contraria §6 |
| **C. Tabela `bun_variants` ligada ao montador, só leitura nesta fase (seed)** | Fonte única; presets validáveis por FK; não inventa admin não pedido | Tabela específica de hambúrguer; pizza poderá exigir um conceito equivalente (massa) — decisão futura |

**Proposta:** C. Campos: `builder_id`, `slug`, `name`, imagens de topo e base (caminho + largura + altura),
`sort_order`. `TOP_BUN_SHAPE` e `BOTTOM_BUN_SHAPE` continuam no frontend (são regras do renderer, iguais para
todas as variantes). Admin de variantes: ⏳ O1.

### BD-04 — Configurações visuais do ingrediente

**Contexto:** o renderer precisa de `imageSize` (tamanho natural) e `shape` (`displayWidth`,
`restingSurfaceRatio`, `sinkRatio`). Esses valores são específicos do renderer de empilhamento.

| Alternativa | Prós | Contras |
| --- | --- | --- |
| **A. Colunas tipadas na tabela `ingredients`** | Validação simples por campo; consultas e seeds legíveis; o banco garante tipo | Pizza exigirá outras colunas ou outra estrutura |
| B. Coluna JSON `render_settings` validada conforme o montador | Novo renderer sem migração | Validação condicional por montador desde já; tipos fracos no banco; complexidade por antecipação |
| C. Tabela 1:1 de configurações por renderer | Separa dados do renderer | Uma tabela e um join a mais para um único renderer |

**Proposta:** A, com `display_width`, `resting_surface_ratio`, `sink_ratio`. Quando houver um segundo renderer,
decidir entre B e C com o caso real. `SAUCE_SHAPE` (valores compartilhados pelos molhos) deixa de existir como
constante: o seed grava os mesmos valores nos três molhos.

Faixas de validação propostas (derivadas do renderer, não arbitrárias): proporções entre 0 e 1 (são frações da
altura da imagem); `display_width` maior que 0 e no máximo 340 (`STACK_BASE_WIDTH`, largura-base da pilha). Os
valores atuais estão entre 240 e 318 (largura) e 0–1 (proporções).

### BD-05 — Dimensões da imagem calculadas pelo backend

**Contexto:** hoje `imageSize` é digitado no catálogo e um teste confere com o PNG
(`ingredientCatalog.test.ts`). O `<Image>` do Next precisa do tamanho natural.

**Proposta:** o backend lê largura e altura do arquivo no upload e grava `image_width` / `image_height`. O admin
não digita esses valores; a API os devolve. O teste atual é substituído por esse cálculo (e por teste no backend).
Sem alternativa razoável: digitar à mão foi justamente a causa da distorção dos molhos (`AI_DECISIONS.md`,
29/09/2026).

### BD-06 — Presets e ingredientes ordenados

**Contexto:** um preset é uma receita: variante de pão + lista ordenada (base → topo) de ingredientes **com
repetição** (o Duplo tem carne, cheddar e alface duas vezes).

| Alternativa | Prós | Contras |
| --- | --- | --- |
| **A. Tabela filha `preset_items` (`preset_id`, `ingredient_id`, `position`)** | FK garante que o ingrediente existe; exclusão de ingrediente pode ser bloqueada pelo banco; consulta "quais presets usam X" trivial; aceita repetição | Mais uma tabela; atualização precisa reescrever os itens |
| B. Coluna JSON com os IDs dos ingredientes | Espelha `CompositionRecipe` exatamente; uma tabela só | Sem integridade referencial; checar uso de um ingrediente exige busca em JSON; erros só na aplicação |
| C. JSON com slugs | Legível | Renomear um slug quebra presets; mesmos problemas de B |

**Proposta:** A, com detalhes que evitam armadilhas do Laravel:

- `PresetItem` como model próprio (`Preset hasMany PresetItem`), **não** `belongsToMany`: `sync()` e `attach()` em
  `belongsToMany` tratam o par como único e descartariam repetições.
- `position` de 0 a n−1, base → topo, único por preset.
- Atualizar um preset substitui a lista inteira de itens dentro de uma transação (o admin envia a lista completa,
  como o builder já trata receitas).
- FK `ingredient_id` com `restrict` na exclusão (BD-15).
- `bun_variant_id` obrigatório para o montador `burger` (FK com `restrict`).

### BD-07 — Composição inicial como dado do montador

**Contexto:** ⚠️ C4. Hoje a composição inicial **não** aparece no painel de presets.

| Alternativa | Prós | Contras |
| --- | --- | --- |
| A. Manter `INITIAL_RECIPE` no frontend | Nada muda | Pode referenciar ingrediente oculto/excluído; segunda fonte de verdade |
| B. A composição inicial vira um preset comum, listado no painel | Modelo mínimo | Muda o produto: aparece um quarto preset |
| **C. `builders.initial_preset_id` aponta para um preset que não é listado no painel** | Comportamento atual preservado; editável no admin com o mesmo formulário de presets | Uma regra a mais: o preset inicial é filtrado da lista pública e não pode ser excluído |
| D. Colunas/JSON de receita na tabela `builders` | Sem regra de filtragem | Duplica a estrutura de receita fora de `preset_items` |

**Proposta:** C. Se o preset inicial estiver indisponível (BD-14), a API devolve uma composição inicial vazia
(só os pães) e o admin mostra um aviso. Confirmação de produto: ⏳ O2.

### BD-08 — Fluxo de upload e preview

| Alternativa | Prós | Contras |
| --- | --- | --- |
| **A. Upload junto com o formulário (multipart) ao salvar; preview local antes de salvar; ingrediente nasce oculto** | Uma requisição atômica; sem arquivos temporários nem limpeza agendada; o "teste" é feito com o arquivo real já armazenado, ainda invisível ao público | A validação do servidor só aparece ao salvar (o formulário pré-valida tipo e tamanho para UX) |
| B. Upload temporário (endpoint próprio devolve um token) e depois criação | Erros de imagem antes de preencher o resto | Arquivos temporários, expiração, limpeza agendada, dois fluxos de erro |

**Proposta:** A (⚠️ C5). Fluxo: escolher imagem → preview local (`URL.createObjectURL`) no renderer real → salvar
(oculto) → ajustar configurações visuais com preview → publicar.

Detalhe técnico: o PHP não interpreta corpo multipart em `PUT`/`PATCH`. Atualizações com arquivo usam `POST` com
`_method=PATCH` (convenção do Laravel); atualizações sem arquivo podem usar `PATCH` JSON.

### BD-09 — Storage

| Alternativa | Prós | Contras |
| --- | --- | --- |
| **A. Disco configurável (padrão: `public` local), caminho relativo no banco, URL gerada na resposta** | Sem serviço externo (DT-08); trocar para S3 é configuração; banco independente de host | Precisa de `storage:link`; arquivos de ingredientes ocultos são acessíveis por quem souber a URL |
| B. Gravar a URL completa no banco | Leitura direta | Acopla dados a host/porta; quebra ao mudar de ambiente ou de storage |
| C. Disco privado servido por controller | Pode bloquear imagens de itens ocultos | Cada imagem passa pelo PHP; sem ganho real (ocultar não é sigilo) |
| D. S3/serviço externo agora | Pronto para produção distribuída | Contraria a preferência registrada (DT-08) |

**Proposta:** A.

- Nome do disco em configuração (ex.: `MEDIA_DISK`, padrão `public`); o código sempre usa
  `Storage::disk(config(...))`, nunca caminhos físicos.
- Banco guarda o **caminho relativo** (`ingredients/<hash>.png`); a API Resource devolve a **URL absoluta**.
- Diretórios por tipo: `ingredients/`, `bun-variants/`. Sem diretório por montador (não traz benefício agora; o
  vínculo está no banco).
- Nome do arquivo: hash aleatório do Laravel (`hashName()`), extensão derivada do **conteúdo**. Nunca o nome
  enviado pelo usuário. Nome novo a cada troca também evita cache antigo no navegador e no otimizador do Next.
- "Oculto" significa fora do builder público, não sigilo do arquivo; aceito para a demonstração (registrado como
  risco em `ARCHITECTURE.md` §8).

### BD-10 — Formatos e limites de imagem

Medição dos 21 PNGs atuais (06/10/2026): todos RGBA (com alfa); ingredientes de 289×156 a 407×216; molhos
1354–1426 × 319–350; pães 321–375 de largura; arquivos de 44 a 350 KB. Maior largura exibida: 318 (base) × 1,25
(escala máxima) ≈ 398 px CSS, ou ≈ 795 px físicos em telas 2×. Detalhes: `ASSET_ANALYSIS.md`.

| Formato | Proposta | Motivo |
| --- | --- | --- |
| PNG com alfa | ✅ aceito (preferido) | Formato dos assets atuais |
| WebP | ✅ aceito | Suporta alfa; arquivos menores |
| JPEG | ❌ recusado | Sem transparência — contraria a regra dos assets |
| GIF | ❌ recusado | Paleta limitada; animação sem uso |
| SVG | ❌ recusado | Pode conter scripts; estilo vetorial contraria a direção fotográfica |
| AVIF | ❌ por enquanto | Suporte variável nas bibliotecas de PHP; reavaliar se houver pedido |

Validação no backend (regras de arquivo do Laravel): MIME detectado pelo conteúdo + extensão coerente; tamanho
máximo; dimensões mínimas e máximas; arquivo que não decodifica como imagem é recusado.

| Limite | Valor proposto | Derivação |
| --- | --- | --- |
| Tamanho do arquivo | 2 MB | ~6× o maior asset atual (350 KB); comporta imagens maiores e mais nítidas |
| Largura mínima | 280 px | Aceita todos os assets atuais (o menor tem 289 px); abaixo disso a imagem fica visivelmente borrada |
| Lado máximo | 3000 px | Mais que o dobro do maior asset; protege a memória do servidor e do otimizador do Next |
| Largura recomendada (orientação, não regra) | ≥ 800 px | Nitidez em telas 2× na maior escala do palco |
| Transparência | orientação + aviso no admin | Verificar alfa não exige decodificar a imagem inteira, mas não é preciso recusar: o preview mostra o problema |

Conversão e otimização: **nenhuma** no backend nesta fase. O `<Image>` do Next já entrega a imagem otimizada
(WebP/AVIF, tamanho certo) aos navegadores; o arquivo original preserva a qualidade. Sem nova dependência
(ex.: Intervention Image).

Correção (06/10/2026, T-E4): o builder usa `<Image unoptimized>` em todas as imagens (decisão anterior do frontend),
então o Next **não** otimiza a entrega: o navegador carrega o arquivo direto do Storage. Por isso o limite de 2 MB e a
orientação de tamanho importam. Como o otimizador não é usado, não é preciso `images.remotePatterns` nem
`dangerouslyAllowLocalIP`. O Laravel 13 traz um componente de imagens (`Illuminate\Image`, driver GD) que pode ser
usado se a otimização no backend (T-H11) for necessária, sem pacote extra.

### BD-11 — Integração dos dados com o builder

**Contexto:** hoje os componentes importam constantes de módulo (`INGREDIENTS`, `BUN_VARIANTS`, `PRESETS`,
`INITIAL_RECIPE`) e funções globais (`findIngredient`, `findBunVariant`), usadas em 10 arquivos.

| Alternativa | Prós | Contras |
| --- | --- | --- |
| **A. Catálogo como dado: buscado no servidor (Server Component), passado ao `BurgerBuilder` e repassado às funções puras** | Primeira renderização já com dados (sem spinner no builder); funções continuam puras e testáveis com fixtures; o admin reutiliza o mesmo renderer com dados de rascunho | Refatoração em `stackLayout`, `useCompositionDrag`, `dragMessages` e componentes |
| B. Buscar no cliente (efeito/SWR) | Simples de escrever | Builder vazio até carregar; nova dependência (SWR) ou código de cache manual |
| C. Gerar arquivos de catálogo no build a partir da API | Nenhuma mudança nos componentes | Publicar um ingrediente exigiria novo build; contraria o fluxo pedido |

**Proposta:** A. A refatoração para "catálogo como dado" pode ser feita **antes** do backend existir, usando os
dados atuais como fixture (tarefa T-E1), sem mudança de comportamento. Cache: renderização dinâmica sem cache no
início (publicar deve refletir na próxima visita); revalidação fica como evolução. A configuração exata de cache
deve seguir a documentação do Next 16 em `node_modules/next/dist/docs/` no momento da implementação
(`apps/web/AGENTS.md`).

### BD-12 — Como o admin fala com a API

| Alternativa | Prós | Contras |
| --- | --- | --- |
| **A. Navegador → Laravel diretamente (fetch), com CORS restrito à origem do frontend** | Upload vai direto ao Laravel; erros 422 do Laravel chegam ao formulário sem tradução; caminho natural para Sanctum (SPA por cookie) no futuro | URL da API exposta ao navegador (ela já é pública); configurar CORS |
| B. Server Actions do Next como proxy | Sem CORS | Limite padrão de 1 MB no corpo (documentação do Next 16) — exige aumentar; upload trafega duas vezes; erros precisam ser remapeados |
| C. Route handlers do Next como proxy | Controle total | Mesmo custo de B, mais código |

**Proposta:** A.

Implementação (T-F1, 06/10/2026): as **leituras** do admin são feitas no servidor do Next (`API_URL`, com
`connection()`), como no builder, com `loading`/`error` por rota; as **escritas** saem do navegador direto para a API
(`NEXT_PUBLIC_API_URL`, CORS) e, em seguida, `router.refresh()`/navegação recarregam os dados do servidor. Erros 422
viram mensagens por campo; 409, 413 e 429 têm mensagens próprias.

### BD-13 — Limite de camadas

**Proposta:** `builders.max_layers` (seed: 14). O backend valida presets com ele; a API o envia ao frontend, que
continua aplicando o limite na interação (`hasReachedLayerLimit`). `MAX_LAYERS` deixa de ser constante do
frontend. Um preset precisa de pelo menos 1 ingrediente (todos os presets atuais têm 4 ou mais; um preset vazio
seria igual a "só pão").

### BD-14 — Visibilidade e publicação

| Alternativa | Prós | Contras |
| --- | --- | --- |
| **A. `is_visible` booleano nos ingredientes, padrão `false`** | Atende exatamente o fluxo pedido (oculto → testar → visível); filtro trivial | Não distingue "rascunho" de "retirado de circulação" |
| B. `status` (`draft`, `published`, `hidden`) | Distingue os casos | Nenhum requisito usa a distinção; transições e regras a mais |
| C. `published_at` (data ou nulo) | Data de publicação de graça; permite agendamento | Semântica de data para um liga/desliga; agendamento não foi pedido |

**Proposta:** A. Migrar para B no futuro é uma migração simples (`is_visible` → `status`).

Presets: os requisitos não pedem visibilidade para presets ("Salvar → Preset aparece no Builder"). Proposta:
**disponibilidade derivada**, sem campo novo — a API pública só devolve um preset se todos os seus ingredientes
estiverem visíveis; o admin mostra "indisponível: contém ingrediente oculto". Alternativas consideradas:
`is_visible` também em presets (mais controle, mais um estado para gerenciar); remover os ingredientes ocultos do
preset na resposta (muda a receita silenciosamente — descartado). Confirmação: ⏳ O3. **Revisada pela BD-23** (presets ganharam
`is_visible` próprio).

Variantes de pão: sem visibilidade nesta fase (não há admin de variantes).

### BD-15 — Exclusões

| Entidade | Proposta | Alternativa descartada |
| --- | --- | --- |
| Ingrediente usado em algum preset | Recusar (HTTP 409) informando os presets; sugerir ocultar | Remover o ingrediente dos presets em cascata (altera presets sem aviso) |
| Ingrediente sem uso | Excluir o registro; apagar o arquivo **depois** do commit | Soft delete (lixeira não foi pedida; "ocultar" já cobre o caso de retirar de circulação) |
| Preset comum | Excluir (itens em cascata) | — |
| Preset inicial do montador | Recusar (409) | Excluir e deixar o montador sem composição inicial |
| Montador / variante de pão | Sem exclusão pela API nesta fase | — |

### BD-16 — Substituição e remoção de arquivos

Ordem proposta (nenhum passo apaga algo antes de o novo estado estar salvo):

1. validar o arquivo novo;
2. gravar o arquivo novo no disco;
3. atualizar o registro (transação);
4. se a transação falhar: apagar o arquivo **novo**;
5. depois do commit: apagar o arquivo **antigo**; se a remoção falhar, registrar no log (o arquivo vira órfão,
   mas o dado continua íntegro).

Na exclusão do ingrediente: apagar o registro, depois o arquivo. Um comando para listar/remover órfãos fica como
evolução futura (T-H8), pois o fluxo acima evita órfãos na operação normal.

### BD-17 — Identificadores

- A API e o builder usam o `id` numérico do banco (o frontend o trata como texto em `ingredientId`, sem mudar o
  modelo da composição).
- `slug`: único por montador, gerado a partir do nome na criação. Serve para seeds legíveis, referências humanas
  e, no futuro, URLs. Proposta: editável no admin, com validação de unicidade (não é usado em nomes de arquivo nem
  em relações, então renomear não quebra nada). UUIDs não são necessários (não há dado sensível nem enumeração a
  proteger nesta fase).

### BD-18 — Respostas e erros da API

- JSON via API Resources do Laravel, com o envelope padrão `data`.
- Erros de validação: formato padrão do Laravel (HTTP 422, `message` + `errors` por campo), exibido no formulário.
- 404 para IDs inexistentes ou de outro montador; 409 para exclusões bloqueadas; 413/422 para upload grande
  demais (alinhar `upload_max_filesize` e `post_max_size` do PHP com o limite da regra, para o erro ser claro).
- Rotas separadas em `/api/...` (público, só leitura) e `/api/admin/...` (gestão). Contrato inicial:
  `ARCHITECTURE.md` §5.

Decidido na implementação (T-B7, 06/10/2026):

- **camelCase** nas respostas e nos corpos das requisições (o frontend é TypeScript; as chaves de erro 422
  coincidem com os campos do formulário); a conversão para as colunas snake_case fica nos Form Requests/Resources.
- Mensagens da API em **pt-BR** (`APP_LOCALE=pt_BR`, arquivos em `lang/`), com inglês como alternativa.
- Toda resposta de erro é JSON; modelo inexistente responde 404 com `{"message": "Recurso não encontrado."}`.
- Limites por IP: **leituras 600/min** (só proteção contra sobrecarga: vêm quase todas do servidor do Next, que usa
  um único IP para todos os visitantes) e **escritas do admin 60/min** (vêm do navegador de cada pessoa). Revisão de
  06/10/2026: a primeira versão limitava leituras a 120 e 60/min por IP, o que, compartilhado pelo servidor do Next,
  derrubaria páginas com pouco tráfego (visto como 429 na verificação de ponta a ponta).
- CORS só para `FRONTEND_URL` (padrão `http://localhost:3000`), métodos GET/POST/PATCH/DELETE.
- Eloquent em modo estrito fora de produção (impede consultas N+1 e atributos inexistentes).
- API pura: removidos do esqueleto o Vite/Tailwind, a página de boas-vindas e as rotas web; `/` responde 404.

### BD-19 — Localização do backend no monorepo e banco

| Item | Proposta | Alternativas |
| --- | --- | --- |
| Pasta | `apps/api` (aplicação Laravel completa) | Repositório separado (perde a documentação e a revisão conjunta) |
| pnpm workspace | Excluir `apps/api` (`!apps/api` em `pnpm-workspace.yaml`) | Incluir: o `package.json` do Laravel (Vite) entraria em `pnpm -r lint/typecheck/build` sem esses scripts |
| Scripts da raiz | `dev:api`, `test:api` chamando `php artisan` / `composer` dentro de `apps/api` | Somente comandos manuais |
| Banco | ~~SQLite nesta fase~~ → 🟢 **MySQL** (decisão do responsável, 06/10/2026) | SQLite: zero configuração; PostgreSQL |
| Requisitos | PHP e Composer nas versões exigidas pela versão estável do Laravel **na data da implementação** (verificar; não fixar agora). Com BD-21, PHP e Composer existem só dentro dos containers | — |

Confirmação: O4 respondido (MySQL). Consequência: os testes do backend devem rodar contra um banco MySQL de
teste separado (e não SQLite em memória), para não divergir do banco real em chaves estrangeiras e tipos.

### BD-21 — Ambiente de desenvolvimento: WSL2 + Docker/Kool

🟢 **Adotada em 06/10/2026** — o responsável seguiu o plano e a Fase 0 foi concluída (`TASKS.md`). Implementação: `apps/api/docker-compose.yml` e `kool.yml` escritos no formato do preset do Kool, porque o assistente do Kool 3.6 só oferece PHP até 8.3; imagens `kooldev/php:8.4-nginx` e `mysql:8.4` (oficial); API em `localhost:8000`; MySQL exposto só em `127.0.0.1:3306`; testes em PHPUnit 12 (O6) no banco `food_flow_testing`.

Pedido do responsável: backend dentro do WSL2 com Kool/Docker,
sem instalar PHP/Composer no Windows, mantendo Next.js e experimentos funcionando.

Diagnóstico (06/10/2026):

| Item | Estado encontrado |
| --- | --- |
| Repositório | `C:\Users\palad\Projetos\food-flow` (visto do WSL como `/mnt/c/...`, sistema de arquivos 9p) |
| WSL | WSL 2.7.3; distro `Ubuntu` 26.04 (systemd ativo, usuário `palad` no grupo `docker`); distro padrão é `docker-desktop` |
| Docker | Docker Desktop 29.5 instalado no Windows, **parado**; integração WSL para `Ubuntu` **inativa** (o `docker` do Ubuntu é o atalho do Desktop); sem Docker Engine nativo no Ubuntu |
| Kool | 3.6.0 instalado em `/usr/local/bin/kool` |
| Node no WSL | v22.23.1 via nvm; o projeto exige Node 24+ |
| PATH | 27 entradas do Windows no PATH do Ubuntu; `pnpm` e `npm` resolvem para os binários do Windows |
| Git/SSH no WSL | `origin` usa SSH (`git@github.com:...`); `~/.ssh` pertence ao `root` com chave em modo 644 (o SSH recusa) |
| Fins de linha | `core.autocrlf=true` no Windows; 35 arquivos com CRLF na cópia de trabalho; sem `.gitattributes` |
| Convenção | Outros projetos do responsável ficam em `/home/palad/projetos/` |

Proposta: repositório em `/home/palad/projetos/food-flow` (sistema de arquivos do Linux); Next.js e experimentos
rodando direto no Ubuntu (Node 24 + pnpm); Laravel e MySQL em containers gerenciados pelo Kool, com
`kool.yml`/`docker-compose.yml` em `apps/api`; Docker Desktop com integração WSL para o Ubuntu. Plano completo,
alternativas e etapas: `ARCHITECTURE.md` §10 e `TASKS.md` Fase 0.

### BD-20 — Preparação para autenticação (sem implementar)

Pontos de encaixe criados agora, sem código de autenticação:

- todas as rotas de gestão sob `/api/admin` (um grupo de rotas onde o middleware entrará);
- validação em Form Requests, cujo `authorize()` devolve `true` hoje e receberá Policies depois;
- todas as páginas do admin sob o segmento `/admin` do Next, com um layout próprio (um lugar só para proteger);
- nenhuma coluna de autoria (`created_by`) agora — entra junto com usuários (T-H5/T-H6).

Caminho provável no futuro (não decidido): Laravel Sanctum no modo SPA (cookie), Gates/Policies para
autorização e roles/permissões conforme a necessidade.

### BD-22 — Admin de tipos de pão (T-H7)

🟢 **Decidido em 07/10/2026** — o responsável pediu a T-H7; implementação no mesmo padrão dos ingredientes:

- `bun_variants.is_visible` (padrão `false`); os 4 pães existentes foram marcados visíveis na migration.
- Pão novo **nasce oculto**; duas imagens (topo e base) com as regras de upload do BD-10.
- Só pães visíveis chegam ao catálogo público; **preset com pão oculto fica indisponível**; se o pão do preset inicial
  estiver oculto, o montador abre vazio no primeiro pão visível.
- Exclusão: 409 se o pão for usado por presets (lista os presets); 409 ao ocultar ou excluir o **último pão
  visível** (o montador ficaria indisponível).
- As formas de empilhamento dos pães (`TOP_BUN_SHAPE`/`BOTTOM_BUN_SHAPE`) continuam no renderer (BD-03): as imagens
  novas precisam seguir as proporções dos pães atuais, o que o preview do admin ajuda a conferir.

### BD-23 — Visibilidade própria dos presets

🟢 **Decidido em 07/10/2026** — o responsável pediu para poder deixar um preset só no admin enquanto trabalha nele;
revisa a parte de presets da BD-14 (O3):

- `presets.is_visible` (padrão `false`); os presets existentes foram marcados visíveis na migration.
- Preset novo **nasce oculto** (`isVisible` proibido na criação), como ingredientes e pães; publicar e ocultar pelo
  `PATCH`.
- O catálogo público só devolve presets **visíveis e disponíveis**; a disponibilidade derivada da BD-14 continua
  (`isAvailable`: pão e ingredientes visíveis). No admin os estados são: Publicado, Oculto, Indisponível (publicado
  mas com pão ou ingrediente oculto) e Composição inicial.
- O **preset inicial não pode ser ocultado** (409, como na exclusão): o montador abriria vazio.

---

## 4. Decisões em aberto (⏳)

Respostas de 06/10/2026: ver "Revisão do responsável" no topo. Nenhuma questão aberta (O5 respondida em 06/10/2026).

| ID | Pergunta | Recomendação | Bloqueia |
| --- | --- | --- | --- |
| O1 | Variantes de pão terão gerenciamento no admin nesta fase? | Não; seed + leitura pela API (BD-03) | T-B4, T-F (escopo) |
| O2 | A composição inicial continua fora do painel de presets? | Sim, via `initial_preset_id` (BD-07) | T-B4, T-B6 |
| O3 | Presets têm visibilidade própria ou disponibilidade derivada? | Derivada (BD-14) | T-D1, T-B9 |
| O4 | Banco e ambiente de publicação (local apenas? servidor público? onde roda o Laravel?) | SQLite e execução local nesta fase | T-B1, T-B2, T-E4 |
| O5 | O admin sem autenticação será publicado na internet? | Não publicar sem ao menos proteção básica; se publicar, ter um comando de restauração dos dados de demonstração | Publicação |
| O6 | Framework de testes do backend (PHPUnit ou Pest) | O padrão do instalador do Laravel na data | T-B1 |
| C1–C5 | Conflitos da seção 2 | ver seção 2 | T-A9 |

---

## 5. Evolução futura (⏸)

Não implementar nesta fase. Lista completa e dependências: `TASKS.md`, Fase H.

Autenticação, autorização, roles e permissões, proteção do admin e da API, usuários, auditoria, admin de
variantes de pão, limpeza de órfãos, storage externo, segundo montador, otimização de imagens, lixeira, cache com
revalidação.
