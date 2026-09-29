# Food Flow — Domain Decisions

Este documento registra as decisões de domínio e comportamento que já foram tomadas para o projeto **Food Flow**.

A finalidade é separar:

* o que já foi decidido;
* o que é uma regra do produto;
* o que ainda pode mudar por meio de experimentação.

As decisões técnicas que ainda dependem de pesquisa ou experimentos não devem ser tratadas como definitivas.

---

## 1. Identidade do projeto

### Nome

**Food Flow**

### Conceito

O Food Flow é um experimento visual de composição de elementos em camadas.

O primeiro caso de uso será um **montador de hambúrguer**, mas o sistema deve ser desenvolvido pensando em reutilização futura.

O hambúrguer é o primeiro dataset e não deve definir toda a arquitetura do sistema.

---

# 2. Composição inicial

A composição representa um hambúrguer completo visualmente.

A estrutura possui:

* pão inferior;
* ingredientes;
* pão superior.

O pão inferior e o pão superior fazem parte da composição visual do hambúrguer.

Durante a edição, os ingredientes são inseridos no espaço entre os dois pães.

### Estado inicial do montador

Decidido em 28/09/2026: o montador abre com, da base para o topo, carne, cheddar, cebola roxa, tomate e alface, com pão clássico (composição inspirada no mockup de `docs/design/references/`).

---

# 3. Pão superior

### Decisão revisada

O pão superior **sempre permanece visível** na composição normal do hambúrguer.

A decisão anterior de esconder o pão superior durante a edição foi descartada.

### Motivo

Manter o pão superior sempre aparente proporciona uma referência visual clara para o limite da composição.

Sem o pão superior, o hambúrguer passa a parecer visualmente incompleto durante a montagem, principalmente quando poucos ingredientes estão presentes.

O objetivo agora é que o usuário sempre veja um hambúrguer completo enquanto modifica seu conteúdo.

### Comportamento ao adicionar ingrediente

Quando um novo ingrediente é adicionado:

1. o ingrediente aparece na região superior da composição;
2. ele entra diretamente **abaixo do pão superior**;
3. ocorre uma animação simples de entrada;
4. as camadas necessárias se reorganizam;
5. o pão superior permanece visível.

O pão superior **não precisa sair da composição** para que um novo ingrediente seja adicionado.

### Comportamento esperado

Visualmente:

```text
Antes:

       TOP BUN
          ↓
       LETTUCE
       TOMATO
       CHEESE
       BEEF
     BOTTOM BUN


Adicionar BACON:

       TOP BUN
          ↓
        BACON  ← novo ingrediente
       LETTUCE
       TOMATO
       CHEESE
       BEEF
     BOTTOM BUN
```

A nova camada entra no topo da pilha de ingredientes, imediatamente abaixo do pão superior.

---

# 4. Entrada de novos ingredientes

A entrada padrão de um ingrediente adicionado por clique será uma animação simples.

O ingrediente deve:

1. aparecer acima ou próximo da região do pão superior;
2. mover-se para sua posição entre os ingredientes;
3. acomodar-se na composição.

A animação não precisa simular física complexa.

A prioridade é:

* clareza;
* fluidez;
* sensação de entrada;
* integração com a composição.

O ingrediente não deve simplesmente aparecer instantaneamente ou utilizar apenas `opacity`.

---

# 5. Posição padrão de inserção

Ao adicionar um ingrediente através do controle de ingredientes, ele será inserido no topo da composição de ingredientes.

Exemplo:

```text
TOP BUN
Lettuce
Cheese
Beef
BOTTOM BUN
```

Adicionar Bacon:

```text
TOP BUN
Bacon
Lettuce
Cheese
Beef
BOTTOM BUN
```

Isso representa o comportamento padrão de **adicionar**.

A posição poderá ser diferente quando o usuário utilizar drag & drop para escolher explicitamente outro ponto da composição.

---

# 6. Variações de pão

O pão é tratado como uma variante selecionável.

Alterar o tipo de pão deve alterar visualmente os pães correspondentes da composição.

A alteração deve afetar:

* pão inferior;
* pão superior.

O pão intermediário **não** segue a variante: é um ingrediente independente (revisão de 28/09/2026 — ver seção 22).

As variantes devem possuir diferenças visuais perceptíveis.

### Cor e aparência

Os diferentes tipos de pão devem possuir **cores e características visuais próprias**.

Por exemplo, uma variante mais clara deve possuir aparência claramente diferente de uma variante mais escura.

A mudança de tipo de pão deve ser imediatamente perceptível na composição.

O objetivo não é apenas trocar um asset quase idêntico.

---

# 7. Reconhecibilidade dos assets

As artes dos ingredientes são parte importante da experiência.

Cada ingrediente deve ser visualmente reconhecível mesmo sem que o usuário leia seu nome.

Por exemplo:

* tomate deve parecer claramente um tomate;
* queijo deve parecer claramente queijo;
* bacon deve possuir características visuais de bacon;
* alface deve ser identificável como alface;
* carne deve ser visualmente identificável como carne;
* cebola deve possuir características reconhecíveis de cebola.

Os nomes dos ingredientes continuarão sendo exibidos na interface, mas o usuário também deve conseguir reconhecer os ingredientes através da própria imagem.

### Regra visual

> O asset deve comunicar o que ele representa antes mesmo da leitura do texto.

As artes devem possuir qualidade suficiente para sustentar essa função.

---

# 8. Qualidade e consistência das artes

Os assets devem ser tratados como elementos visuais principais da experiência, e não como placeholders.

Eles devem possuir:

* boa resolução;
* fundo transparente quando necessário;
* proporções coerentes;
* iluminação consistente;
* estilo visual consistente;
* detalhes suficientes para identificação;
* aparência física convincente;
* recorte limpo.

Ingredientes diferentes devem parecer pertencer ao mesmo conjunto visual.

Evitar misturar:

```text
foto realista
+
ilustração cartoon
+
ícone vetorial
+
imagem genérica
```

na mesma composição.

---

# 9. Ordem dos ingredientes

A ordem dos ingredientes é controlada pelo usuário.

Não existe uma ordem fixa obrigatória como:

```text
carne → queijo → alface → tomate
```

O usuário pode criar combinações diferentes.

Exemplo:

```text
TOP BUN
Lettuce
Beef
Cheese
Beef
Tomato
BOTTOM BUN
```

A composição precisa respeitar a ordem definida pelo usuário.

---

# 10. Ingredientes duplicados

Ingredientes podem ser duplicados.

É permitido possuir várias instâncias do mesmo ingrediente.

Exemplos:

* duas carnes;
* três queijos;
* duas folhas de alface;
* carne → salada → carne;
* queijo → carne → queijo.

O sistema não deve assumir que cada ingrediente existe apenas uma vez.

---

# 11. Adicionar por clique

Ao clicar em um ingrediente disponível para adicioná-lo à composição:

1. uma nova instância do ingrediente é criada;
2. ela é inserida no topo da composição;
3. fica imediatamente abaixo do pão superior;
4. executa a animação de entrada;
5. as camadas são reorganizadas.

Exemplo:

```text
TOP BUN
Cheese
Lettuce
Beef
BOTTOM BUN
```

Adicionar Tomato:

```text
TOP BUN
Tomato
Cheese
Lettuce
Beef
BOTTOM BUN
```

---

# 12. Adicionar por Drag & Drop

O usuário poderá utilizar drag & drop para determinar onde o ingrediente será inserido.

Nesse caso, a posição do drop deverá influenciar a posição lógica do novo elemento dentro da composição.

O sistema deverá então:

1. identificar a posição desejada;
2. inserir o ingrediente nessa posição;
3. recalcular a composição;
4. reorganizar visualmente as camadas afetadas.

A forma exata de calcular a posição a partir do drop ainda está em aberto.

---

# 13. Alteração de ingredientes existentes

Ao selecionar um ingrediente que já está na composição, o usuário poderá realizar ações como:

* adicionar outro ingrediente;
* remover o ingrediente selecionado;
* substituir o ingrediente selecionado.

---

# 14. Substituição

Ao substituir um ingrediente, a nova camada deve manter a posição lógica da camada original.

Exemplo:

```text
TOP BUN
Tomato
Lettuce
Cheese
Beef
BOTTOM BUN
```

Se `Lettuce` for substituída por `Bacon`:

```text
TOP BUN
Tomato
Bacon
Cheese
Beef
BOTTOM BUN
```

A posição dentro da composição permanece.

---

# 15. Remoção

Quando uma camada é removida, as camadas restantes devem ser reorganizadas.

Exemplo:

```text
TOP BUN
Tomato
Lettuce
Cheese
Beef
BOTTOM BUN
```

Removendo `Cheese`:

```text
TOP BUN
Tomato
Lettuce
Beef
BOTTOM BUN
```

As camadas que estavam acima não devem simplesmente permanecer na posição anterior.

Elas precisam ser recalculadas e visualmente acomodadas.

O pão superior continua presente durante todo o processo.

---

# 16. Remoção no meio da composição

A remoção de uma camada intermediária deve provocar a reorganização das camadas afetadas.

Exemplo:

```text
TOP BUN
A
B
C
D
BOTTOM BUN
```

Removendo `C`:

```text
TOP BUN
A
B
D
BOTTOM BUN
```

`D` deve reagir à mudança e ocupar a nova posição.

---

# 17. Posicionamento horizontal

A composição deve permanecer visualmente centralizada.

A regra atual é:

> ingredientes não devem produzir um hambúrguer visualmente torto por causa de posições horizontais arbitrárias.

Offsets horizontais artísticos foram **descartados** (28/09/2026): a composição é sempre centralizada (revisão — ver seção 22).

---

# 18. Pão intermediário

Um pão intermediário pode existir como uma camada normal da composição.

Isso permite representar estruturas como um hambúrguer com múltiplos níveis, por exemplo uma composição semelhante a um Big Mac.

O pão intermediário é um ingrediente independente e não muda com a variante de pão (revisão de 28/09/2026 — ver seção 22).

---

# 19. Presets

O projeto deverá possuir presets de hambúrgueres.

Um preset representa uma composição previamente definida.

Os presets devem utilizar o mesmo sistema de composição utilizado pela montagem manual.

O preset não deve possuir uma implementação paralela específica.

### Presets decididos (28/09/2026)

Implementados em 29/09/2026 (`apps/web/src/burger/presetCatalog.ts`). Ingredientes da base para o topo:

| Preset | Pão | Ingredientes |
| --- | --- | --- |
| Clássico | clássico | carne, cheddar, alface, tomate |
| Bacon | brioche | carne, cheddar, bacon, cebola roxa, picles, ketchup |
| Duplo | clássico | carne, cheddar, alface, picles, pão do meio, carne, cheddar, alface, cebola roxa |

* A escolha fica em um painel próprio ("Presets"), no estilo dos cards de tipo de pão.
* Aplicar um preset substitui a composição. Se a composição foi editada desde o último preset ou reset, é pedida confirmação; sem edições, a troca é direta.
* A animação é igual à do reset: as camadas atuais saem e as do preset entram ao mesmo tempo; o pão troca com a acomodação existente.

Detalhes de implementação (29/09/2026; escolhidos na implementação e reversíveis, não são decisões de produto confirmadas):

* A confirmação aparece dentro do painel de presets ("Trocar" / "Cancelar"), sem janela modal do navegador.
* "Editada" significa ingredientes, ordem ou pão diferentes da última receita aplicada; selecionar camadas não conta, e desfazer as mudanças volta a dispensar a confirmação.
* O preset igual à composição atual fica marcado; escolhê-lo não altera nada.
* Cada card mostra uma miniatura da composição do preset, gerada a partir dos mesmos dados e do mesmo cálculo de empilhamento.

---

# 20. Reset

A ação de reset deve retornar a composição ao estado inicial antes das customizações do usuário.

Comportamento visual decidido em 28/09/2026: todas as camadas atuais fazem a animação de saída e as camadas iniciais fazem a de entrada, ao mesmo tempo.

---

# 21. Reutilização

O sistema não deve depender de nomes específicos como:

```text
burger
cheese
bacon
lettuce
```

O modelo deve trabalhar com entidades genéricas de camadas/componentes.

O objetivo é permitir que o mecanismo seja reutilizado posteriormente com outros datasets.

Possíveis exemplos:

* sanduíche;
* pizza desconstruída;
* produto desmontado;
* peça industrial;
* produto cosmético;
* outro objeto composto por partes.

---

# 22. Decisões revisadas

As seguintes decisões foram **explicitamente substituídas**:

### Decisão anterior

> O pão superior ficaria oculto durante a edição e sairia quando o usuário adicionasse um ingrediente.

### Nova decisão

> O pão superior permanece sempre visível na composição e os novos ingredientes entram diretamente abaixo dele.

### Motivo

A ausência do pão superior fazia a composição parecer visualmente incompleta durante a montagem.

A nova abordagem mantém a leitura visual de um hambúrguer durante toda a interação e simplifica a entrada de novos ingredientes.

---

### Revisões de 28/09/2026

| Decisão anterior | Nova decisão | Motivo |
| --- | --- | --- |
| Trocar o tipo de pão altera também o pão intermediário (seções 6 e 18). | O pão intermediário é um ingrediente independente e não segue a variante. | Não informado. (Contexto: existe apenas um asset de pão do meio.) |
| Pequenos offsets horizontais artísticos não descartados (seção 17). | Offsets descartados; composição sempre centralizada. | Não informado. |

Registro da entrevista: `DOCUMENTATION_REVIEW.md`.

---

# 23. Princípios visuais definidos

Até este momento, os seguintes princípios são considerados decisões do projeto:

1. O hambúrguer deve parecer completo durante a edição.
2. O pão superior permanece visível.
3. Novos ingredientes entram abaixo do pão superior.
4. A entrada deve possuir uma animação simples e clara.
5. O tipo de pão deve possuir diferença visual perceptível.
6. Alterar o pão deve alterar sua aparência/cor.
7. Os ingredientes devem ser reconhecíveis visualmente sem depender exclusivamente do texto.
8. Os assets devem possuir qualidade visual suficiente para serem parte central da experiência.
9. A composição deve permanecer centralizada.
10. Ingredientes podem ser duplicados.
11. A ordem pode ser alterada pelo usuário.
12. Drag & drop pode determinar uma posição específica.
13. Substituição preserva a posição lógica.
14. Remoção reorganiza as camadas afetadas.
15. O sistema deve continuar sendo reutilizável para outros datasets.

---

# 24. Decisões que ainda permanecem abertas

Ainda não foram definidos:

* segundo dataset;
* arquitetura final de reutilização.

Ambos foram adiados até a conclusão do montador de hambúrguer, incluindo os presets (28/09/2026).

Decididos em 28/09/2026 (detalhes em `OPEN_DECISIONS.md`, que mantém o histórico de cada item): biblioteca de animação (Motion), modelo de dados, algoritmo de empilhamento e cálculo das posições, tratamento da espessura, física simulada, interrupção de animações, detalhes do drag & drop, estratégia mobile e linguagem visual.
