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

---

## Modelo persistido — fase Backend/Admin

Status: 🔷 **Proposta de 06/10/2026, aguardando revisão** (`BACKEND_DECISIONS.md`). O modelo da composição
acima **não muda**: muda a origem do catálogo e dos presets, que passam a vir da API.

```text
builders 1 ──── * bun_variants
    │  1 ──── * ingredients ──── * preset_items * ──── 1 presets * ──── 1 builders
    │                                                     │
    └── initial_preset_id ─────────────────────────────────┘   (presets.bun_variant_id → bun_variants)
```

| Tabela | Campos | Regras |
| --- | --- | --- |
| `builders` | `id`, `slug` (único), `name`, `max_layers`, `initial_preset_id` (nulo), timestamps | Criado por seed (BD-02). Seed: `burger`, 14 camadas (BD-13) |
| `bun_variants` | `id`, `builder_id`, `slug`, `name`, `top_image_path`, `top_image_width`, `top_image_height`, `bottom_image_path`, `bottom_image_width`, `bottom_image_height`, `sort_order`, timestamps | `slug` único por montador; só leitura nesta fase (BD-03) |
| `ingredients` | `id`, `builder_id`, `slug`, `name`, `image_path`, `image_width`, `image_height`, `display_width`, `resting_surface_ratio`, `sink_ratio`, `is_visible` (padrão `false`), `sort_order`, timestamps | `slug` único por montador; dimensões calculadas no upload (BD-04, BD-05, BD-14) |
| `presets` | `id`, `builder_id`, `name`, `bun_variant_id`, `sort_order`, timestamps | Variante do mesmo montador (BD-06) |
| `preset_items` | `id`, `preset_id`, `ingredient_id`, `position` | `position` 0..n−1 base → topo, único por preset; repetição de ingrediente permitida; `ingredient_id` com `restrict` (BD-06, BD-15) |

Correspondência com o frontend atual:

| Hoje (`apps/web/src/burger/`) | Depois |
| --- | --- |
| `Ingredient.id` (`"beef"`) | `ingredients.id` (texto no frontend); `"beef"` vira `slug` |
| `Ingredient.imagePath` / `imageSize` | URL gerada pela API + `image_width`/`image_height` |
| `Ingredient.shape` | `display_width`, `resting_surface_ratio`, `sink_ratio` |
| `BunVariant` | `bun_variants` |
| `CompositionPreset` | `presets` + `preset_items` |
| `INITIAL_RECIPE` | preset apontado por `builders.initial_preset_id` (BD-07) |
| `MAX_LAYERS` | `builders.max_layers` |
| `sort_order` | Ordem de exibição nos painéis; hoje é a ordem dos arrays. Necessário para preservar a ordem atual dos painéis |

Campos **não** incluídos por não terem requisito: descrição, preço, categoria, `status` de publicação, autoria,
soft delete, UUID.
