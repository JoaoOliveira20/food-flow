# Food Flow — Revisão da documentação (registro de trabalho)

Início: 28/09/2026. Status: 🟢 **Entrevista concluída** — única pendência do responsável: adicionar o documento do desafio (C5).

Registro das pendências encontradas na documentação, das perguntas feitas ao responsável pelo projeto e
das respostas. Os documentos definitivos só são alterados depois que cada ponto é respondido ou
explicitamente adiado.

Legenda da origem: **[Código]** confirmado por análise do código/testes · **[Doc]** registrado na
documentação · **[Resposta]** respondido pelo responsável · **[Pendente]** sem resposta.

---

## Inventário

### A. Decisões técnicas em aberto

| ID | Pendência | Onde | Já definido | Falta | Depende de |
| --- | --- | --- | --- | --- | --- |
| A1 | Modelo de dados | `OPEN_DECISIONS.md` §3; `DATA_MODEL.md` | requisitos (duplicatas, ordem, substituição); modelo provisório em `apps/web/src/burger/composition.ts` [Código] | aceitar o modelo atual como oficial ou manter provisório | responsável |
| A2 | Algoritmo de empilhamento e espessura | `OPEN_DECISIONS.md` §4, §5 | cálculo por `displayWidth`/`restingSurfaceRatio`/`sinkRatio`, ajustado a olho [Código] | adotar como definitivo ou prever medição dos PNGs | responsável |
| A3 | Física real × simulada | `OPEN_DECISIONS.md` §6 | implementação usa spring (aproximação visual) [Código] | confirmar se a questão está encerrada | responsável |
| A4 | CSS × biblioteca em outras partes | `OPEN_DECISIONS.md` §2 | Motion nas camadas; CSS em layout/estados [Código] | regra para o restante da interface | responsável |
| A5 | Arquitetura de reutilização e segundo dataset | `OPEN_DECISIONS.md` §15, §16; `DOMAIN_DECISIONS.md` §21 | objetivo de reutilização | escolha do dataset e prioridade | responsável |

### B. Produto e experiência de usuário

| ID | Pendência | Onde | Já definido | Falta | Depende de |
| --- | --- | --- | --- | --- | --- |
| B1 | Pão do meio seguir a variante | `DOMAIN_DECISIONS.md` §6 × `OPEN_DECISIONS.md` §13 | domínio exige; só existe `middle-bun.png` [Código] | manter a exigência? produzir assets? | responsável |
| B2 | Presets | `DOMAIN_DECISIONS.md` §19; `OPEN_DECISIONS.md` §14 | "presets existirão"; não implementados [Código] | continuam no escopo? formato/quantidade | responsável |
| B3 | Comportamento visual do reset | `DOMAIN_DECISIONS.md` §20 | implementado: camadas atuais saem e as iniciais entram [Código] | aceitar ou definir outro | responsável |
| B4 | Interrupção de animações | `OPEN_DECISIONS.md` §7 | implementado: nada é bloqueado; molas redirecionam [Código] | confirmar como decisão | responsável |
| B5 | Detalhes do drag & drop | `OPEN_DECISIONS.md` §8; `DOMAIN_DECISIONS.md` §12 | implementado: indicador, arrastar move, toque com espera no menu [Código] | confirmar como decisão | responsável |
| B6 | Mobile | `OPEN_DECISIONS.md` §9 | implementado: toque + botões + palco fixo [Código] | confirmar como decisão | responsável |
| B7 | Seleção | `OPEN_DECISIONS.md` §10 | implementado: contorno, faixas de toque, barra de ações [Código] | confirmar como decisão | responsável |
| B8 | Linguagem visual das animações | `OPEN_DECISIONS.md` §11 | valores em `layerMotion.ts` [Código] | aprovar os valores ou mantê-los em ajuste | responsável |
| B9 | Offsets horizontais artísticos | `DOMAIN_DECISIONS.md` §17 | não descartados; não implementados | manter em aberto ou descartar | responsável |
| B10 | Direção artística dos assets | `OPEN_DECISIONS.md` §12 | PNGs atuais em estilo fotográfico [Código] | confirmar esse estilo | responsável |

### C. Requisitos incompletos ou ambíguos

| ID | Pendência | Onde | Já definido | Falta | Depende de |
| --- | --- | --- | --- | --- | --- |
| C1 | Limite de camadas | `OPEN_DECISIONS.md` §19 | código limita a 14 (`MAX_LAYERS`) [Código]; não documentado | o limite é requisito? "20+" é teste ou meta? | responsável |
| C2 | Critério de acessibilidade | `OPEN_DECISIONS.md` §18 | botões alternativos, teclado, movimento reduzido [Código] | nível/critério esperado | responsável |
| C3 | Critério de desempenho | `OPEN_DECISIONS.md` §17 | medições com 5/12/14 camadas (`experiments/COMPARISON.md`) | metas de aceitação | responsável |
| C4 | Composição inicial | nenhum documento | carne, cheddar, cebola roxa, tomate, alface; pão clássico (do mockup) [Código] | confirmar | responsável |
| C5 | Documento original do desafio | `AI_DECISIONS.md` | ausente do repositório | existe? pode ser adicionado? | responsável |

### D. Tarefas em andamento (decisão já existe)

| ID | Tarefa | Estado verificado |
| --- | --- | --- |
| D1 | Motion na aplicação principal | implementado e testado [Código] |
| D2 | Troca de pão altera topo e base | implementado [Código]; pão do meio não (B1) |
| D3 | Drag & drop define a posição | implementado e testado [Código] |
| D4 | Composição centralizada | implementado [Código] |
| D5 | Presets | não implementado (depende de B2) |

### E. Documentação desatualizada ou inconsistente

| ID | Inconsistência | Onde | Correção proposta |
| --- | --- | --- | --- |
| E1 | Diz que os PNGs não estão no repositório | `ASSET_ANALYSIS.md` | registrar que estão presentes (21 arquivos) |
| E2 | Diz que o diretório fica vazio até a cópia | `apps/web/public/assets/ingredients/README.md` | remover a frase desatualizada |
| E3 | "Biblioteca de animação" ainda listada como aberta | `DOMAIN_DECISIONS.md` §24 | marcar como decidida (Motion) |
| E4 | "Console sem erros" sem registrar que avisos não foram capturados; avisos de imagem também existem nos experimentos | `experiments/COMPARISON.md` | acrescentar a ressalva |
| E5 | Desempenho e limites "precisam ser testados", mas já houve medições | `OPEN_DECISIONS.md` §17, §19 | referenciar os resultados (status depende de C1/C3) |

### F. Melhorias opcionais

| ID | Ideia |
| --- | --- |
| F1 | Aviso de LCP do Next para o pão superior (`loading="eager"`) |
| F2 | Corrigir o mesmo aviso de proporção nos três experimentos |
| F3 | "Pouso" animado da miniatura ao soltar; animar os marcadores de inserção |
| F4 | Inicializar um repositório git |

---

## Perguntas e respostas

### Rodada 1 — escopo do produto

| ID | Pergunta | Resposta [Resposta] | Situação |
| --- | --- | --- | --- |
| B1 | O pão do meio deve seguir a variante de pão? | **Retirar a exigência**: o pão do meio é um ingrediente independente, sem variante. | ✅ Decidido — atualizar `DOMAIN_DECISIONS.md` §6 (revisão) e `OPEN_DECISIONS.md` §13. Motivo não informado. |
| B2 | Presets continuam no escopo? | **Sim, no escopo.** | ✅ Escopo confirmado; detalhes na rodada 2. Implementação pendente. |
| C5 | Documento original do desafio | **O responsável vai adicionar** o documento em `docs/`. | ⏳ Aguardando o arquivo; itens de requisitos (C1–C4) serão conferidos com ele quando estiver disponível. |

### Rodada 2 — presets

| ID | Pergunta | Resposta [Resposta] | Situação |
| --- | --- | --- | --- |
| B2.1 | Quais presets? | **Poucos exemplos clássicos**; lista proposta aprovada como está: **Clássico** (pão clássico: carne, cheddar, alface, tomate); **Bacon** (pão brioche: carne, cheddar, bacon, cebola roxa, picles, ketchup); **Duplo** (pão clássico: carne, cheddar, alface, picles, pão do meio, carne, cheddar, alface, cebola roxa). Ordem da base para o topo. | ✅ Decidido; implementação pendente. |
| B2.2 | Onde o usuário escolhe? | **Painel próprio** ("Presets"), no estilo dos cards de tipo de pão. | ✅ Decidido; implementação pendente. |
| B2.3 | O que acontece ao aplicar? | **Substitui a composição, com confirmação** quando houve edição desde o último preset/reset; sem edições, troca direto. | ✅ Decidido; implementação pendente. A **animação** da troca de preset não foi definida (continua aberta em `OPEN_DECISIONS.md` §14). |

### Rodada 3 — comportamentos implementados

| ID | Pergunta | Resposta [Resposta] | Situação |
| --- | --- | --- | --- |
| B3 | Animação do reset | **Confirmar o atual**: todas as camadas atuais saem e as iniciais entram, ao mesmo tempo. | ✅ Decidido; já implementado [Código]. |
| B4 | Interrupção de animações | **Confirmar o atual**: nenhuma ação é bloqueada; cada nova ação redireciona as camadas a partir da posição e velocidade atuais. | ✅ Decidido; já implementado [Código]. |
| B5 | Detalhes do drag & drop | **Confirmar o atual**: arrastar move a instância (duplicar é ação separada); destino como camada translúcida + setas + mensagem "Soltar entre X e Y"; no toque, arrastar do menu exige segurar ~0,3 s; soltar fora cancela. | ✅ Decidido; já implementado [Código]. Validação com pessoas/dispositivos reais continua pendente. |

### Rodada 4 — mobile, seleção e linguagem visual

| ID | Pergunta | Resposta [Resposta] | Situação |
| --- | --- | --- | --- |
| B6 | Mobile | **Confirmar o atual**: hambúrguer fixo no topo com controles rolando por baixo; reorganização por arraste da camada ou Subir/Descer; em paisagem, hambúrguer à esquerda e controles à direita. | ✅ Decidido; já implementado [Código]. Validação em aparelho real pendente. |
| B7 | Seleção | **Confirmar o atual**: tocar seleciona; contorno na camada; barra com Subir, Descer, Duplicar, Substituir, Remover e fechar; faixas de toque sem sobreposição. | ✅ Decidido; já implementado [Código]. |
| B8 | Linguagem visual | **Aprovar como padrão** os valores de `layerMotion.ts`: entrada 56 px, −3°, fade; mola stiffness 320 / damping 26; saída 10 px, escala 0,85, 0,22 s; acomodação na troca de pão. | ✅ Decidido; já implementado [Código]. Ajustes futuros devem ser registrados como revisão. |

### Rodada 5 — decisões técnicas da composição

| ID | Pergunta | Resposta [Resposta] | Situação |
| --- | --- | --- | --- |
| A1 | Modelo de dados | **Oficializar o atual**: instâncias `{ instanceId, ingredientId }` da base para o topo; variante de pão separada; pães superior/inferior derivados da variante; catálogo como dados. Reutilização para outros datasets segue em aberto (§15). | ✅ Decidido; já implementado [Código]. Registrar em `DATA_MODEL.md`. |
| A2 | Empilhamento e espessura | **Oficializar o atual**: três valores por ingrediente (`displayWidth`, `restingSurfaceRatio`, `sinkRatio`), ajustados manualmente. | ✅ Decidido; já implementado [Código]. |
| A3 | Física real × simulada | **Encerrar: simulada** — aproximação visual com molas, sem motor de física. | ✅ Decidido; já implementado [Código]. |

### Rodada 6 — limites, acessibilidade e desempenho

| ID | Pergunta | Resposta [Resposta] | Situação |
| --- | --- | --- | --- |
| C1 | Limite de camadas | **14 é o limite** de ingredientes intermediários; "20+" é apenas cenário de teste (tentar ultrapassar o limite), não meta. | ✅ Decidido; já implementado (`MAX_LAYERS = 14`) [Código]. Testes de ingredientes "muito grandes/pequenos" não foram feitos. |
| C2 | Critério de acessibilidade | **O atual é suficiente**: alternativas ao arraste por botões, teclado e movimento reduzido; sem meta formal de WCAG. | ✅ Decidido; já implementado [Código]. |
| C3 | Critério de desempenho | **As medições bastam**; item encerrado; validação em aparelho real fica como tarefa futura. | ✅ Decidido. Resultados: `experiments/COMPARISON.md` §10 e medição de `apps/web` (136–144 fps; heap 3,22 → 4,63 MB em 40 ciclos). |

### Rodada 7 — CSS, reutilização e offsets

| ID | Pergunta | Resposta [Resposta] | Situação |
| --- | --- | --- | --- |
| A4 | CSS × biblioteca | **CSS para micro-interações** (hover, foco, cores); **Motion** para o movimento da composição e o que depende de estado/presença. | ✅ Decidido. Código atual já segue a regra [Código]. |
| A5 | Reutilização e segundo dataset | **Adiado até o montador de hambúrguer estar concluído** (presets inclusos). | ⏸ Adiado. |
| B9 | Offsets horizontais artísticos | **Descartar**: composição sempre centralizada, sem offsets. | ✅ Decidido; já é o comportamento atual [Código]. Registrar revisão em `DOMAIN_DECISIONS.md` §17. |

### Rodada 8 — assets e composição inicial

| ID | Pergunta | Resposta [Resposta] | Situação |
| --- | --- | --- | --- |
| B10 | Direção artística | **Confirmar fotográfico**: o estilo dos PNGs atuais é a direção decidida. | ✅ Decidido; assets atuais já seguem [Código]. |
| C4 | Composição inicial | **Confirmar a atual**: carne, cheddar, cebola roxa, tomate, alface (base → topo), pão clássico. | ✅ Decidido; já implementado (`INITIAL_INGREDIENT_IDS`) [Código]. |

### Rodada 9 — melhorias opcionais

| ID | Pergunta | Resposta [Resposta] | Situação |
| --- | --- | --- | --- |
| F1 | Aviso de LCP do pão superior | **Corrigir agora** (`loading="eager"` nas imagens das camadas). | 🔧 Em execução nesta tarefa. |
| F2 | Mesmo aviso de proporção nos experimentos | **Deixar como está**; apenas registrar a ressalva em `experiments/COMPARISON.md`. | ✅ Decidido. |
| F4 | Repositório git | **Inicializar e commitar** o estado atual. | 🔧 Em execução nesta tarefa. |

### Rodada 10 — animação dos presets

| ID | Pergunta | Resposta [Resposta] | Situação |
| --- | --- | --- | --- |
| B2.4 | Animação ao aplicar um preset | **Igual ao reset**: camadas atuais saem e as do preset entram ao mesmo tempo; o pão troca com a acomodação existente. | ✅ Decidido; implementação pendente (junto com os presets). |

---

## Resultado

### Correções técnicas desta revisão [Código]

| Item | Arquivos | Validação |
| --- | --- | --- |
| Aviso "width or height modified" (todas as imagens de camada, não só picles e ovo) | `apps/web/src/burger/stackLayout.ts`, `apps/web/src/components/burger-builder/StackLayer.tsx` | zero avisos em dev (1440 e 390 px) com os 13 ingredientes; proporção exibida = proporção do PNG |
| Aviso de LCP do pão superior | `StackLayer.tsx`, `BunPicker.tsx` (`loading="eager"`) | zero avisos em dev |

### Correções documentais (E1–E5)

| ID | Situação |
| --- | --- |
| E1 | ✅ `ASSET_ANALYSIS.md` registra que os 21 PNGs estão no repositório |
| E2 | ✅ `apps/web/public/assets/ingredients/README.md` sem a frase desatualizada |
| E3 | ✅ `DOMAIN_DECISIONS.md` §24 atualizado |
| E4 | ✅ Ressalva sobre avisos adicionada em `experiments/COMPARISON.md` §4 |
| E5 | ✅ `OPEN_DECISIONS.md` §17 e §19 referenciam as medições e as decisões |

### Documentos atualizados

`DOMAIN_DECISIONS.md` (§2, §6, §17, §18, §19, §20, §22, §24), `OPEN_DECISIONS.md` (§2–§19 e lista de fechadas),
`DATA_MODEL.md`, `ASSET_ANALYSIS.md`, `AI_DECISIONS.md`, `experiments/COMPARISON.md`, `apps/web/README.md`,
`apps/web/public/assets/ingredients/README.md`.

### Continuam em aberto

| Item | Motivo |
| --- | --- |
| C5 — documento original do desafio | aguardando o arquivo; C1–C4 poderão ser conferidos com ele |
| `OPEN_DECISIONS.md` §13 — lista definitiva de variantes de pão | as quatro implementadas não foram confirmadas explicitamente |
| `OPEN_DECISIONS.md` §15 e §16 — reutilização e segundo dataset | adiados até o montador de hambúrguer estar concluído |
| Presets | decididos; implementação pendente |
| Validação com pessoas e em aparelhos reais | não realizada |
| F3 — "pouso" animado da miniatura e marcadores animados | melhoria opcional, não solicitada |
| `favicon.ico` inexistente (404 no console) | observado; não discutido |
