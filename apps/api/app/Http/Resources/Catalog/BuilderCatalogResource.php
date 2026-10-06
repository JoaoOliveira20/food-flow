<?php

namespace App\Http\Resources\Catalog;

use App\Models\Builder;
use App\Models\PresetItem;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Everything the public builder needs in one consistent response
 * (docs/ARCHITECTURE.md §5). Expects the relations loaded by the controller.
 *
 * @mixin Builder
 */
class BuilderCatalogResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'slug' => $this->slug,
            'name' => $this->name,
            'maxLayers' => $this->max_layers,
            'bunVariants' => BunVariantResource::collection($this->bunVariants),
            'ingredients' => IngredientResource::collection($this->ingredients),
            'presets' => PresetResource::collection($this->presets),
            'initialRecipe' => $this->initialRecipe(),
        ];
    }

    /**
     * The initial preset when it is available; otherwise an empty composition,
     * so a hidden ingredient never reaches the public builder (BD-07, BD-14).
     *
     * @return array{bunVariantId: int, ingredientIds: list<int>}|null
     */
    private function initialRecipe(): ?array
    {
        $preset = $this->initialPreset;
        $bunVariantId = $preset?->bun_variant_id ?? $this->bunVariants->first()?->id;

        if ($bunVariantId === null) {
            return null;
        }

        $isAvailable = $preset !== null && $preset->items->every(fn (PresetItem $item) => $item->ingredient->is_visible);

        return [
            'bunVariantId' => $bunVariantId,
            'ingredientIds' => $isAvailable ? $preset->items->map(fn (PresetItem $item) => $item->ingredient_id)->values()->all() : [],
        ];
    }
}
