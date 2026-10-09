# Food Flow — Open Decisions

Este documento registra decisões que ainda não foram tomadas ou que possuem detalhes importantes em aberto.

**Regra:** uma questão só deve sair deste documento quando houver uma decisão consciente baseada em pesquisa, experimento ou implementação.

Itens decididos permanecem aqui com a decisão no topo (🟢) e o texto anterior como histórico. ⏸ indica item adiado. 🔷 indica proposta registrada que aguarda confirmação do responsável.

---

## 1. Biblioteca de animação

🟢 **Decidido em 28/09/2026 — Motion for React (`motion`)**

Candidatas avaliadas em experimentos práticos: Motion for React, GSAP e React Spring (`experiments/`).

Decisão, justificativa e trade-offs: `LIBRARY_DECISION.md`. Comparação completa: `experiments/COMPARISON.md`.

---

## 2. CSS puro vs biblioteca

🟢 **Decidido**

**Decisão (28/09/2026):** CSS para micro-interações de interface (hover, foco, cores); Motion para o movimento da composição e para o que depende de estado ou presença.

_Histórico:_

Precisamos determinar quais partes da experiência podem ser resolvidas com CSS e quais realmente justificam uma biblioteca de animação.

Estado da implementação (28/09/2026): o Motion anima as camadas da composição; CSS é usado apenas para layout, aparência e estados estáticos. A pergunta sobre outras partes da interface continua aberta.

---

## 3. Modelo de dados

🟢 **Decidido**

**Decisão (28/09/2026):** o modelo implementado foi oficializado — ver `DATA_MODEL.md`.

_Histórico:_

Já sabemos que:

* ingredientes podem aparecer várias vezes;
* a ordem importa;
* cada ocorrência pode ser manipulada;
* substituição preserva posição;
* drag & drop pode alterar posição;
* dados devem ser separados da lógica visual.

Ainda precisamos definir a estrutura final.

Estado da implementação (28/09/2026): `apps/web` usa uma versão provisória, vinda do experimento validado — instâncias `{ instanceId, ingredientId }` em ordem da base para o topo, variante de pão separada e catálogo de ingredientes orientado a dados (`apps/web/src/burger/composition.ts` e `ingredientCatalog.ts`). A estrutura ainda não foi formalizada em `DATA_MODEL.md`.

---

## 4. Algoritmo de empilhamento

🟢 **Decidido**

**Decisão (28/09/2026):** o algoritmo implementado foi oficializado: cada ingrediente declara `displayWidth`, `restingSurfaceRatio` e `sinkRatio`, ajustados manualmente, e a pilha é calculada num único laço (`apps/web/src/burger/stackLayout.ts`).

_Histórico:_

Precisamos definir como o sistema calcula:

* posição vertical;
* espaço entre camadas;
* espessura;
* sobreposição;
* proporção;
* reorganização;
* comportamento com muitas camadas.

A solução não pode depender de posições absolutas individuais para cada ingrediente.

Estado da implementação (28/09/2026): `apps/web/src/burger/stackLayout.ts` calcula a pilha num único laço a partir de três valores por ingrediente (`displayWidth`, `restingSurfaceRatio`, `sinkRatio`), ajustados visualmente. Continua em aberto como algoritmo definitivo (ex.: espessura medida dos PNGs, muitas camadas).

---

## 5. Espessura visual

🟢 **Decidido**

**Decisão (28/09/2026):** a espessura é representada por `restingSurfaceRatio` (onde a próxima camada se apoia) e `sinkRatio` (quanto a camada afunda na de baixo), declarados por ingrediente.

_Histórico:_

Precisamos decidir como representar a espessura de cada camada e quanto ela influencia a composição.

---

## 6. Física real vs física simulada

🟢 **Decidido**

**Decisão (28/09/2026):** física simulada — aproximação visual com molas do Motion, sem motor de física.

_Histórico:_

Ainda não foi decidido se será utilizada física real ou apenas uma aproximação visual.

A animação atualmente possui uma direção definida de **entrada vertical simples**, mas os detalhes do movimento ainda dependem dos experimentos.

---

## 7. Interrupção de animações

🟢 **Decidido**

**Decisão (28/09/2026):** nenhuma interação é bloqueada durante animações; cada nova ação redireciona as camadas a partir da posição e velocidade atuais. Já implementado.

_Histórico:_

Precisamos decidir o comportamento quando o usuário realiza uma nova ação enquanto outra animação ainda está acontecendo.

Estado da implementação (28/09/2026): nenhuma interação é bloqueada durante animações; o Motion redireciona cada camada a partir da posição e velocidade atuais. Testado com rajadas de ações em `apps/web`. Falta validar a sensação com pessoas.

---

## 8. Drag & Drop

🟢 **Decidido**

**Decisão (28/09/2026):** arrastar uma camada move a instância (duplicar é ação separada); o destino é indicado pela camada translúcida, setas ▶ ◀ e a mensagem "Soltar entre X e Y"; no toque, arrastar do menu exige segurar ~0,3 s; soltar fora cancela. Já implementado; validação com pessoas e dispositivos reais pendente.

_Histórico:_

Já está decidido que:

> drag & drop pode determinar a posição de inserção.

Ainda precisamos definir:

* indicador de posição;
* comportamento ao arrastar ingrediente existente;
* diferença entre mover e duplicar;
* comportamento em touch;
* comportamento durante animações.

Estado da implementação (28/09/2026): em `apps/web`, o arraste usa Pointer Events (mouse e toque); a posição de inserção é indicada pela camada translúcida no destino, setas e a mensagem "Soltar entre X e Y"; no toque, arrastar do menu exige segurar ~0,3 s; arrastar move a instância (duplicar continua sendo uma ação separada). Os detalhes seguem em aberto para validação com pessoas e dispositivos reais.

---

## 9. Mobile

🟢 **Decidido**

**Decisão (28/09/2026):** hambúrguer fixo no topo com os controles rolando por baixo; reorganização por arraste da camada ou pelos botões Subir/Descer; em paisagem, hambúrguer à esquerda e controles à direita. Já implementado; validação em aparelho real pendente.

_Histórico:_

Ainda precisamos decidir a melhor forma de reorganizar ingredientes em dispositivos touch.

Possibilidades a investigar:

* drag & drop touch;
* long press;
* modo de reorganização;
* toque + controles;
* combinação dessas abordagens.

---

## 10. Seleção

🟢 **Decidido**

**Decisão (28/09/2026):** tocar numa camada a seleciona, com contorno na camada e barra de ações (Subir, Descer, Duplicar, Substituir, Remover, fechar); cada camada tem uma faixa de toque própria, sem sobreposição. Já implementado.

_Histórico:_

O usuário poderá selecionar ingredientes existentes.

Ainda precisamos definir:

* representação visual da seleção;
* ações disponíveis;
* comportamento quando várias camadas se sobrepõem;
* experiência mobile.

---

## 11. Linguagem visual

🟢 **Decidido**

**Decisão (28/09/2026):** os valores de `apps/web/src/components/burger-builder/layerMotion.ts` são o padrão: entrada de 56 px com −3° e fade; mola stiffness 320 / damping 26; saída de 10 px, escala 0,85 em 0,22 s; acomodação na troca de pão. Ajustes futuros devem ser registrados como revisão.

_Histórico:_

Já existe uma direção:

* movimento simples;
* entrada vertical;
* sensação de integração física;
* pouca dependência de efeitos.

Ainda precisamos definir:

* duração;
* aceleração;
* desaceleração;
* spring;
* rotação;
* escala;
* sombra;
* reação das camadas vizinhas;
* timing de reorganização.

---

## 12. Qualidade dos assets

🟢 **Decidido**

**Decisão (28/09/2026):** estilo fotográfico/realista dos PNGs atuais.

_Histórico:_

Já está decidido que os assets precisam:

* ser visualmente reconhecíveis;
* possuir boa qualidade;
* ter consistência visual;
* funcionar sem depender da leitura do nome;
* possuir aparência coerente entre si.

Ainda precisamos definir a direção artística exata:

* fotografia;
* ilustração;
* 2D estilizado;
* pintura digital;
* combinação de estilos.

---

## 13. Variantes de pão

🟡 **Parcialmente decidido**

**Decisão (28/09/2026):** o pão intermediário é um ingrediente independente e não segue a variante (revisão em `DOMAIN_DECISIONS.md` §22); a troca é animada com a acomodação aprovada no §11. As quatro variantes implementadas (clássico, brioche, multigrãos, escuro) não foram confirmadas explicitamente como a lista definitiva.

_Histórico:_

Já está decidido que mudar o tipo de pão deve produzir uma mudança visual perceptível, incluindo diferença de cor/aparência.

Ainda precisamos definir:

* quais variantes existirão;
* aparência de cada variante;
* como o pão intermediário seguirá essa variação;
* se a troca será instantânea ou animada.

Estado da implementação (28/09/2026): em `apps/web`, a troca altera os pães superior e inferior, com uma leve acomodação animada. O pão do meio continua uma camada independente e **não** muda com a variante, porque só existe um asset (`middle-bun.png`); isso ainda não atende a `DOMAIN_DECISIONS.md` §6. Proposta: produzir um PNG de pão do meio por variante e associá-lo à variante no catálogo, sem mudar a lógica de composição.

Nota (06/10/2026): na fase Backend/Admin, as quatro variantes atuais viram dados iniciais (seed) do backend; a lista continua não confirmada (`BACKEND_DECISIONS.md` BD-03, ⏳ O1).

---

## 14. Presets

🟢 **Decidido e implementado**

**Decisão (28/09/2026):** presets Clássico, Bacon e Duplo, em painel próprio; aplicar substitui a composição, com confirmação se houve edição desde o último preset/reset; animação igual à do reset. Detalhes em `DOMAIN_DECISIONS.md` §19.

Implementado em 29/09/2026 (`apps/web/src/burger/presetCatalog.ts`, `PresetPicker.tsx`); detalhes de implementação em `DOMAIN_DECISIONS.md` §19.

_Histórico:_

Presets existirão.

Ainda precisamos definir:

* formato;
* quantidade;
* composição;
* comportamento da animação ao trocar de preset.

---

## 15. Arquitetura de reutilização

⏸ **Adiado**

**Decisão (28/09/2026):** adiado até a conclusão do montador de hambúrguer, incluindo os presets.

🟢 **06/10/2026 — conflito resolvido pelo responsável (parte de dados reativada):** os requisitos da fase Backend/Admin pedem que ingredientes e presets pertençam a um montador, pensando em pizza. Proposta: reativar só a parte de **dados** (montador como entidade) e manter adiada a reutilização do **renderer**. Ver `BACKEND_DECISIONS.md` C1 e BD-02. O item continua ⏸ para o renderer.

_Histórico:_

Precisamos descobrir o que pode ser compartilhado entre:

* Burger;
* Sandwich;
* Pizza;
* outros datasets.

Ainda não foi decidido se haverá uma única estratégia de composição ou estratégias diferentes sobre uma infraestrutura compartilhada.

---

## 16. Segundo dataset

⏸ **Adiado**

**Decisão (28/09/2026):** adiado até a conclusão do montador de hambúrguer, incluindo os presets.

🟢 **06/10/2026:** os requisitos citam pizza como exemplo de montador futuro. Confirmado que pizza **não** foi escolhida como segundo dataset (`BACKEND_DECISIONS.md` C1).

_Histórico:_

Precisamos escolher um segundo dataset que realmente teste a reutilização do sistema.

---

## 17. Performance

🟢 **Decidido**

**Decisão (28/09/2026):** as medições realizadas bastam: 5, 12 e 14 camadas com ~136–144 fps e memória estável (`experiments/COMPARISON.md` §10 e medição de `apps/web`). Validação em aparelho real fica como tarefa futura.

_Histórico:_

Precisamos testar o comportamento com:

* poucas camadas;
* muitas camadas;
* imagens maiores;
* múltiplas animações;
* alterações rápidas.

---

## 18. Acessibilidade

🟢 **Decidido**

**Decisão (28/09/2026):** o suporte atual é suficiente: alternativas ao arraste por botões, navegação por teclado e respeito a movimento reduzido; sem meta formal de WCAG.

_Histórico:_

Precisamos definir como as principais ações poderão ser executadas sem depender exclusivamente de drag & drop.

---

## 19. Limites da composição

🟢 **Decidido**

**Decisão (28/09/2026):** o limite é de 14 ingredientes intermediários (`MAX_LAYERS`); "20+ camadas" é apenas um cenário de teste de tentativa de ultrapassar o limite. Testados: 5, 12 e 14 camadas e várias duplicatas; ingredientes "muito grandes/pequenos" não foram testados.

_Histórico:_

Precisamos testar o sistema com:

* 6 camadas;
* 12 camadas;
* 20+ camadas;
* ingredientes muito grandes;
* ingredientes muito pequenos;
* várias duplicatas.

---

## 20. Backend, admin e conteúdo dinâmico

🟢 **Revisado pelo responsável em 06/10/2026** — recomendações aceitas; banco MySQL. Pendentes: ambiente (BD-21) e O5. Os símbolos 🔷 da tabela abaixo passaram a 🟢 com a revisão.

As questões técnicas desta fase estão em `BACKEND_DECISIONS.md`, com alternativas e trade-offs; o planejamento das tarefas, em `TASKS.md`. Resumo:

| Questão | Situação | Onde |
| --- | --- | --- |
| Fronteira Next.js/Laravel | 🟢 decidida (requisitos); detalhes 🔷 propostos | DT-01–DT-03, BD-01, BD-12 |
| Montador/contexto | 🔷 tabela `builders` | BD-02 (⚠️ C1) |
| Variantes de pão | 🔷 tabela própria, só leitura | BD-03 (⚠️ C3, ⏳ O1) |
| Modelagem dos ingredientes e configurações visuais | 🔷 colunas tipadas; dimensões calculadas no upload | BD-04, BD-05 |
| Presets ↔ ingredientes | 🔷 tabela de itens ordenados com repetição | BD-06 (⚠️ C2) |
| Composição inicial | 🔷 preset inicial do montador | BD-07 (⚠️ C4, ⏳ O2) |
| Upload e preview | 🔷 multipart ao salvar; nasce oculto | BD-08 (⚠️ C5) |
| Storage | 🔷 disco configurável, caminho relativo, nome por hash | BD-09, BD-16 |
| Formatos e limites de imagem | 🔷 PNG/WebP; 2 MB; 280–3000 px | BD-10 |
| Visibilidade/publicação | 🔷 `is_visible`; presets com disponibilidade derivada | BD-14 (⏳ O3) |
| Banco e ambiente | 🟢 MySQL, `apps/api`; ambiente WSL2 + Kool 🔷 proposto | BD-19, BD-21 |
| Autenticação e controle de acesso | ⏸ futuro; pontos de encaixe preparados | BD-20, `TASKS.md` Fase H |

---

# Decisões já fechadas e que não devem voltar para este documento

As seguintes questões já possuem decisão:

* o pão superior permanece visível;
* novos ingredientes entram abaixo do pão superior;
* o pão superior não precisa sair durante a edição;
* ingredientes podem ser duplicados;
* adicionar por clique insere no topo da pilha de ingredientes;
* drag & drop pode definir outra posição;
* substituir preserva posição;
* remover reorganiza as camadas;
* variantes de pão possuem diferenças visuais perceptíveis;
* assets devem ser reconhecíveis sem depender do texto;
* assets devem possuir boa qualidade e consistência visual;
* biblioteca de animação: Motion for React (`motion`) — ver `LIBRARY_DECISION.md`;
* itens 2 a 12 e 14, 17, 18 e 19 acima, decididos em 28/09/2026 (entrevista registrada em `DOCUMENTATION_REVIEW.md`).

Se uma dessas decisões for alterada novamente, registrar a mudança em `DOMAIN_DECISIONS.md` com o motivo da revisão.
