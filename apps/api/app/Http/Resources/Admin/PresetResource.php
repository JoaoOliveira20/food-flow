<?php

namespace App\Http\Resources\Admin;

use App\Models\Preset;
use App\Models\PresetItem;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Expects the preset with "items.ingredient", "bunVariant" and "builder" loaded.
 *
 * @mixin Preset
 */
class PresetResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'builderId' => $this->builder_id,
            'name' => $this->name,
            'bunVariantId' => $this->bun_variant_id,
            'ingredientIds' => $this->items->map(fn (PresetItem $item) => $item->ingredient_id)->values(),
            'sortOrder' => $this->sort_order,
            'isVisible' => $this->is_visible,
            'isInitial' => $this->builder->initial_preset_id === $this->id,
            'isAvailable' => $this->bunVariant->is_visible && $this->items->every(fn (PresetItem $item) => $item->ingredient->is_visible),
            'createdAt' => $this->created_at?->toIso8601String(),
            'updatedAt' => $this->updated_at?->toIso8601String(),
        ];
    }
}
