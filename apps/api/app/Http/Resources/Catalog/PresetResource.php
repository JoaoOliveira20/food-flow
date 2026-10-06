<?php

namespace App\Http\Resources\Catalog;

use App\Models\Preset;
use App\Models\PresetItem;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Preset
 */
class PresetResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'bunVariantId' => $this->bun_variant_id,
            'ingredientIds' => $this->items->map(fn (PresetItem $item) => $item->ingredient_id)->values(),
        ];
    }
}
