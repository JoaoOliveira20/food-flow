<?php

namespace App\Http\Resources\Admin;

use App\Models\Builder;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Builder
 */
class BuilderResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'slug' => $this->slug,
            'name' => $this->name,
            'maxLayers' => $this->max_layers,
            'initialPresetId' => $this->initial_preset_id,
            'ingredientsCount' => $this->whenCounted('ingredients'),
            'visibleIngredientsCount' => $this->whenCounted('visible_ingredients'),
            'presetsCount' => $this->whenCounted('presets'),
        ];
    }
}
