# Food Flow — Data Model

Status: 🟢 **Decidido em 28/09/2026** (oficializa o modelo implementado em `apps/web`; ver `OPEN_DECISIONS.md` §3).

Reutilização para outros datasets continua adiada (`OPEN_DECISIONS.md` §15 e §16).

## Catálogo — `apps/web/src/burger/ingredientCatalog.ts`

- **Ingrediente:** `id`, `name`, `imagePath`, `imageSize` (tamanho natural do PNG) e `shape` (forma de
  empilhamento: `displayWidth`, `restingSurfaceRatio`, `sinkRatio`).
- **Variante de pão:** `id`, `name`, `topBun` e `bottomBun` (imagem e tamanho de cada pão).
- O pão do meio é um ingrediente comum do catálogo e não depende da variante.

## Composição — `apps/web/src/burger/composition.ts`

| Campo | Significado |
| --- | --- |
| `layers` | instâncias `{ instanceId, ingredientId }`, da base para o topo; duplicatas têm `instanceId` próprio |
| `bunVariantId` | variante de pão; define os pães superior e inferior, que não são camadas |
| `selectedInstanceId` | camada selecionada, ou `null` |
| `isReplacingSelection` | se o próximo ingrediente escolhido substitui a camada selecionada |
| `appliedRecipe` | última receita aplicada (estado inicial, reset ou preset); base para saber se houve edição |

- Limite: 14 camadas intermediárias (`MAX_LAYERS`).
- Estado inicial (`INITIAL_RECIPE`): carne, cheddar, cebola roxa, tomate, alface (base → topo), pão clássico.
- **Receita** (`CompositionRecipe`): `bunVariantId` + `ingredientIds` (base → topo). Aplicar uma receita
  cria instâncias novas para cada ingrediente.
- Todas as mudanças passam pelo `compositionReducer` (funções puras); os `instanceId` são criados fora dele.

## Presets — `apps/web/src/burger/presetCatalog.ts`

Decididos em `DOMAIN_DECISIONS.md` §19 (Clássico, Bacon, Duplo); implementados em 29/09/2026.

- **Preset** (`CompositionPreset`): uma receita com `id` e `name`. Não há implementação paralela: aplicar
  um preset usa a mesma ação do reset (`applyRecipe`).
