# Food Flow — Evolução para Backend, Admin e Conteúdo Dinâmico

## Objetivo

O Food Flow deve entrar em uma nova fase de evolução.

Atualmente temos um builder frontend para montagem de hambúrgueres. A próxima evolução é separar responsabilidades entre frontend e backend, transformar ingredientes e presets em dados gerenciáveis e criar uma área administrativa simples.

**Nesta etapa, NÃO implemente essas mudanças. O objetivo é analisar, documentar, criar decisões e tarefas.**

Antes de alterar código:

1. Leia toda a documentação existente do projeto.
2. Entenda a arquitetura atual e as decisões já registradas.
3. Compare o estado atual da implementação com a documentação.
4. Incorpore as informações deste documento sem apagar ou contradizer decisões anteriores.
5. Identifique dependências entre as novas tarefas.
6. Atualize/crie os documentos apropriados seguindo o padrão já utilizado no projeto.
7. Crie um plano de implementação organizado.
8. Não implemente as tarefas desta nova fase ainda.

Se houver conflito entre este documento e uma decisão anterior, não escolha silenciosamente. Registre o conflito e indique o que precisa ser confirmado.

---

# 1. Nova arquitetura

A aplicação deverá evoluir para:

```text
Next.js
    ↓
Laravel API
    ↓
Database
    ↓
Laravel Storage
```

O Next.js será principalmente o frontend.

O Laravel será a fonte de verdade para:

- API;
- regras de negócio;
- validações;
- persistência;
- ingredientes;
- presets;
- relacionamento com o tipo de montador;
- upload e armazenamento de imagens;
- visibilidade/publicação;
- validações de arquivos.

O frontend não deve ser considerado autoridade para regras importantes.

## Next.js

Responsável principalmente por:

- builder;
- interface pública;
- admin;
- consumo da API;
- apresentação dos dados;
- interações;
- Motion;
- drag and drop;
- preview;
- estados de loading/error/empty.

## Laravel

Responsável principalmente por:

- API;
- regras de negócio;
- validações;
- banco;
- ingredientes;
- presets;
- uploads;
- storage;
- visibilidade/publicação;
- integridade dos dados.

---

# 2. Montadores e contexto

O projeto atualmente trabalha com hambúrgueres, mas deverá permitir futuramente outros montadores, como pizza.

Um ingrediente não deve aparecer automaticamente em todos os montadores.

Exemplo:

```text
Burger
├── pão
├── carne
├── queijo
├── alface
└── ketchup

Pizza
├── massa
├── molho
├── queijo
└── pepperoni
```

A arquitetura precisa de uma forma clara de identificar a qual montador/contexto cada ingrediente e preset pertence.

Deve ser possível futuramente adicionar novos montadores sem reescrever toda a arquitetura.

Não transformar isso em um framework genérico complexo. A solução deve ser simples e extensível.

O Claude deve analisar a melhor modelagem e registrar a decisão.

---

# 3. Ingredientes dinâmicos

Os ingredientes atuais devem deixar de depender exclusivamente de dados hardcoded no frontend.

Fluxo desejado:

```text
Admin
   ↓
Cria/edita ingrediente
   ↓
Laravel API
   ↓
Database + Storage
   ↓
Next.js consulta API
   ↓
Ingrediente aparece no builder
```

A modelagem deve considerar pelo menos:

- identificador;
- nome;
- slug ou identificador equivalente;
- imagem;
- montador/contexto;
- visibilidade/publicação;
- configurações visuais necessárias ao builder;
- timestamps.

Não criar campos apenas por antecipação.

---

# 4. Presets

Os presets atuais também devem ser gerenciáveis pelo admin.

O admin deverá conseguir:

- visualizar presets;
- criar presets;
- editar presets;
- alterar nome;
- alterar ingredientes;
- alterar outras configurações relevantes;
- excluir presets quando apropriado;
- visualizar o preset;
- associar o preset ao montador correto.

Exemplo:

```text
Presets
├── Classic Burger
├── Cheeseburger
└── Double Burger
```

A modelagem deve representar corretamente:

```text
Preset
    ↓
Ingredients
```

e respeitar a ordem/configuração necessária pelo builder.

Presets também devem pertencer a um montador/contexto.

---

# 5. Área administrativa

Criar uma área administrativa no Next.js, inicialmente simples.

Exemplo:

```text
/admin
```

Nesta primeira versão:

- não haverá login;
- não haverá autenticação;
- não haverá usuários;
- não haverá autorização;
- não haverá roles/permissões;
- qualquer pessoa poderá acessar;
- qualquer pessoa poderá criar/editar/excluir dados.

Isso é proposital para uma primeira versão de demonstração.

## Importante

Não ter autenticação não significa não ter segurança.

A API deve validar tudo que recebe, especialmente:

- dados;
- uploads;
- tipos de arquivo;
- tamanho;
- campos obrigatórios;
- relacionamentos;
- IDs;
- valores permitidos;
- consistência.

Não confiar no frontend como mecanismo de segurança.

---

# 6. Dashboard administrativo

O admin deve mostrar inicialmente os dados existentes.

Conceito:

```text
Admin

Ingredientes
[ quantidade ]

Presets
[ quantidade ]

----------------------------

Ingredientes

[miniatura] Carne
[miniatura] Queijo
[miniatura] Alface
[miniatura] Ketchup
...

[ + Novo ingrediente ]

----------------------------

Presets

Classic Burger
Cheeseburger
Double Burger
...

[ + Novo preset ]
```

Os itens devem ter ações para configurar/editar.

O design pode evoluir posteriormente.

---

# 7. Gerenciamento de ingredientes

O admin deverá permitir:

- visualizar ingredientes;
- visualizar miniaturas;
- criar ingrediente;
- editar ingrediente;
- alterar nome;
- alterar imagem;
- alterar configurações relevantes;
- alterar visibilidade;
- excluir quando permitido;
- visualizar informações.

Ao substituir uma imagem, considerar corretamente o destino da imagem anterior para evitar arquivos órfãos.

---

# 8. Upload de imagens

O Laravel será responsável pelo armazenamento.

A preferência atual é utilizar o Storage do próprio Laravel, sem adicionar serviço externo desnecessariamente.

Porém, evitar acoplamento desnecessário a um caminho físico específico para permitir futura troca de storage.

O Claude deve analisar e documentar a melhor estratégia.

## Validações

Considerar no backend:

- tipos permitidos;
- MIME type;
- extensão;
- tamanho máximo;
- dimensões mínimas/máximas, se fizer sentido;
- nome seguro;
- nome único;
- localização do arquivo;
- substituição de imagem;
- remoção de arquivos antigos;
- tratamento de erros;
- rejeição de arquivos que não sejam imagens válidas.

Não confiar apenas na extensão enviada pelo usuário.

## Formatos

Avaliar:

- PNG com transparência;
- WebP;
- outros formatos;
- conversão;
- otimização.

Como o Food Flow depende bastante da aparência dos ingredientes, preservar a qualidade visual.

Não adicionar processamento pesado sem necessidade.

---

# 9. Orientação para imagens

Ao criar/editar um ingrediente, o admin deverá mostrar uma pequena orientação sobre como preparar uma boa imagem.

Exemplo:

> **Dicas para uma boa imagem**
>
> - Prefira PNG com fundo transparente.
> - Centralize o ingrediente.
> - Evite espaços vazios excessivos.
> - Evite fundos coloridos.
> - Mantenha boa qualidade e nitidez.
> - Evite imagens muito pequenas.
> - O ingrediente deve ser facilmente reconhecível.
> - Procure manter um estilo visual semelhante aos demais ingredientes.

O texto final deve ser adaptado aos assets reais do projeto.

Não definir números arbitrários como requisitos definitivos sem analisar os assets e o renderer atual.

---

# 10. Preview antes da publicação

Ao criar ou alterar um ingrediente, deve ser possível visualizar a imagem antes de torná-la visível para os usuários.

Fluxo desejado:

```text
Selecionar imagem
       ↓
Upload/validação
       ↓
Preview
       ↓
Configurar ingrediente
       ↓
Salvar
       ↓
Testar visualmente
       ↓
Tornar visível
```

O preview deve permitir verificar:

- tamanho;
- proporção;
- transparência;
- enquadramento;
- aparência;
- integração visual com o builder.

Sempre que possível, utilizar a mesma lógica visual do builder real.

---

# 11. Visibilidade/publicação

Cada ingrediente deverá poder ser criado sem aparecer imediatamente no montador público.

Exemplo:

```text
Ketchup
Visível: Sim
```

ou:

```text
Novo ingrediente
Visível: Não
```

Fluxo:

```text
Ingrediente criado
        ↓
Visível = Não
        ↓
Admin testa
        ↓
Admin aprova
        ↓
Visível = Sim
        ↓
Aparece no builder
```

A regra deve ser aplicada no backend/API.

O frontend não deve simplesmente esconder um ingrediente que deveria estar indisponível e continuar tratando-o como válido.

## Decisão a analisar

Avaliar se basta algo como:

```text
is_visible
```

ou se é melhor utilizar um estado como:

```text
draft
published
hidden
```

Escolher a solução mais simples adequada ao estágio atual e registrar a decisão.

---

# 12. Regras e validações

As regras importantes devem existir no Laravel.

Exemplos:

- ingrediente pertence a um montador válido;
- nome obrigatório;
- identificador único quando necessário;
- imagem válida;
- preset válido;
- preset não referencia ingredientes inexistentes;
- ingredientes incompatíveis com um montador não podem ser aceitos;
- dados inválidos retornam erros claros;
- exclusões respeitam relações existentes.

Antes de definir novas regras, analisar as regras atuais do builder.

Não duplicar automaticamente todas as validações do frontend.

Diferenciar regras de negócio de regras puramente visuais.

---

# 13. Next.js consumindo Laravel

O objetivo final é que o frontend consuma os dados do backend.

Conceito:

```text
Next.js
   │
   ├── GET /api/ingredients
   ├── GET /api/presets
   ├── POST /api/ingredients
   ├── PUT/PATCH /api/ingredients/{id}
   ├── DELETE /api/ingredients/{id}
   └── ...
              ↓
          Laravel
              ↓
       Database + Storage
```

Os endpoints exatos devem ser definidos após analisar a arquitetura.

O frontend não deve manter uma segunda fonte de verdade com os mesmos ingredientes/presets.

---

# 14. Divisão de responsabilidades

Analisar quais regras devem ficar em cada camada.

Orientação inicial:

```text
Backend
- ingrediente pertence ao montador correto;
- ingrediente existe;
- preset é válido;
- dados são válidos;
- imagem é válida;
- item está publicado/visível.

Frontend
- animação;
- drag and drop;
- feedback visual;
- preview;
- interação;
- composição visual.
```

A divisão definitiva deve ser documentada após análise.

---

# 15. Futuro: autenticação e controle de acesso

Não implementar agora.

No futuro, o sistema poderá possuir:

```text
Usuário
    ↓
Autenticação
    ↓
Autorização
    ↓
Roles/Permissões
    ↓
Área administrativa
```

Conceitos futuros:

- authentication;
- authorization;
- roles;
- permissions;
- admin;
- user;
- protected routes;
- protected API endpoints.

O conceito que deverá ser utilizado é principalmente **controle de acesso/autorização**, podendo envolver **roles e permissões**.

Registrar como evolução futura.

---

# 16. Tarefas a criar

Após analisar a documentação atual, criar tarefas seguindo o padrão já existente.

## Fase A — Arquitetura

- analisar arquitetura atual;
- definir fronteira Next.js/Laravel;
- definir estrutura do backend;
- definir modelo de dados;
- definir montador/contexto;
- definir relacionamento entre ingredientes e montadores;
- definir relacionamento entre presets e ingredientes;
- definir Storage;
- definir respostas da API;
- definir visibilidade/publicação.

## Fase B — Backend base

- configurar Laravel;
- configurar banco;
- migrations;
- models;
- relacionamentos;
- API;
- validações;
- tratamento de erros;
- Storage.

## Fase C — Ingredientes

- CRUD;
- upload;
- validação;
- substituição de imagem;
- remoção;
- visibilidade/publicação;
- configurações visuais;
- endpoints.

## Fase D — Presets

- modelagem;
- CRUD;
- relacionamento com ingredientes;
- validações;
- endpoints;
- associação com montador;
- edição dos ingredientes.

## Fase E — Integração

- remover dados hardcoded quando apropriado;
- consumir ingredientes da API;
- consumir presets;
- adaptar builder;
- preservar regras;
- loading/error/empty states;
- impedir ingredientes ocultos no builder público.

## Fase F — Admin

- dashboard;
- listagem de ingredientes;
- thumbnails;
- criação;
- edição;
- exclusão;
- upload;
- preview;
- orientação para imagens;
- visibilidade;
- listagem de presets;
- criação;
- edição;
- alteração dos ingredientes;
- preview.

## Fase G — Qualidade

- testes;
- typecheck;
- lint;
- build;
- validação da API;
- validação de uploads;
- testes administrativos;
- testes do builder com dados reais;
- revisão de UX;
- revisão da documentação.

## Fase H — Futuro

Registrar, mas não implementar:

- autenticação;
- autorização;
- roles;
- permissões;
- proteção do admin;
- usuários;
- auditoria, se fizer sentido.

---

# 17. Dependências

Organizar as tarefas respeitando dependências.

Exemplo:

```text
Modelagem
   ↓
Migrations
   ↓
Models/Relations
   ↓
API
   ↓
Frontend consumindo API
   ↓
Admin
```

Se tarefas puderem ser executadas em paralelo, documentar isso.

---

# 18. Decisões que precisam de análise

Antes da implementação, analisar e documentar:

### Storage

- estrutura de diretórios;
- nomes dos arquivos;
- URLs;
- substituição;
- limpeza;
- possibilidade de storage externo no futuro.

### Modelagem

Avaliar a melhor forma de representar:

```text
Builder/Context
    ↓
Ingredients
    ↓
Presets
```

### Presets

Avaliar como representar os ingredientes e sua ordem de forma compatível com o builder atual.

### Imagens

Avaliar:

- formatos;
- transparência;
- tamanho;
- dimensões;
- otimização;
- armazenamento;
- preview.

### Visibilidade

Avaliar:

```text
is_visible
```

versus estado de publicação.

Escolher a solução mais simples adequada ao estágio atual.

---

# 19. Segurança sem autenticação

Mesmo que qualquer pessoa possa acessar `/admin`, a API não deve confiar no cliente.

Especial atenção para:

- upload;
- tamanho;
- MIME type;
- extensão;
- nomes;
- caminhos;
- IDs;
- relações;
- montadores;
- ingredientes;
- presets.

O backend deve continuar seguro contra requisições feitas diretamente à API.

---

# 20. Estilo de implementação

Manter os padrões já definidos no projeto.

## Frontend

- TypeScript;
- código legível;
- nomes intuitivos em inglês;
- sem comentários desnecessários;
- evitar hardcode;
- evitar abstrações prematuras;
- evitar overengineering;
- não instalar dependências sem necessidade;
- preservar Motion;
- preservar drag and drop;
- preservar regras visuais;
- não modificar experimentos.

## Backend

Seguir convenções e boas práticas do Laravel.

Priorizar:

- clareza;
- validação;
- separação de responsabilidades;
- segurança;
- manutenção simples;
- código compreensível.

Não criar arquitetura excessivamente complexa.

---

# 21. Resultado esperado

A evolução deve permitir:

```text
Entrar no Admin
      ↓
Criar ingrediente
      ↓
Enviar imagem
      ↓
Laravel valida
      ↓
Imagem armazenada
      ↓
Preview
      ↓
Configurar ingrediente
      ↓
Deixar oculto ou publicar
      ↓
Ingrediente aparece no Builder
```

E:

```text
Entrar no Admin
      ↓
Criar/editar preset
      ↓
Selecionar ingredientes
      ↓
Salvar
      ↓
Preset aparece no Builder
```

---

# 22. Instrução final

**Não implemente esta evolução nesta etapa.**

Primeiro leia os documentos existentes do Food Flow e entenda como o projeto organiza:

- decisões;
- arquitetura;
- tarefas;
- progresso;
- regras;
- experimentos;
- documentação.

Depois incorpore as informações deste documento ao sistema de documentação existente.

Crie ou atualize os documentos necessários mantendo o padrão existente.

Crie as novas tarefas em ordem lógica e com dependências claras.

Separe:

- decisões já tomadas;
- decisões propostas;
- decisões ainda abertas;
- tarefas;
- futuras evoluções.

Não reabra decisões já consolidadas.

Não invente requisitos.

Ao final apresente:

1. documentos atualizados/criados;
2. novas decisões registradas;
3. decisões ainda abertas;
4. tarefas adicionadas;
5. ordem recomendada de implementação;
6. dependências;
7. riscos e pontos técnicos que precisam de atenção.
