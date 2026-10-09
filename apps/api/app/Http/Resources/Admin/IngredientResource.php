<?php

namespace App\Http\Resources\Admin;

use App\Http\Resources\Catalog\ImageResource;
use App\Models\Ingredient;
use App\Models\Preset;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Ingredient
 */
class IngredientResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'builderId' => $this->builder_id,
            'slug' => $this->slug,
            'name' => $this->name,
            'image' => ImageResource::make($this->image_path, $this->image_width, $this->image_height),
            'shape' => [
                'displayWidth' => $this->display_width,
                'restingSurfaceRatio' => $this->resting_surface_ratio,
                'sinkRatio' => $this->sink_ratio,
            ],
            'isVisible' => $this->is_visible,
            'sortOrder' => $this->sort_order,
            'presetsCount' => $this->whenHas('presets_count', fn () => (int) $this->presets_count),
            'presets' => $this->whenLoaded('presets', fn () => $this->presets->map(fn (Preset $preset) => [
                'id' => $preset->id,
                'name' => $preset->name,
            ])->values()),
            'createdAt' => $this->created_at?->toIso8601String(),
            'updatedAt' => $this->updated_at?->toIso8601String(),
        ];
    }
}
