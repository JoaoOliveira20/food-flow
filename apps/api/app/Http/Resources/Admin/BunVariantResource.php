<?php

namespace App\Http\Resources\Admin;

use App\Http\Resources\Catalog\ImageResource;
use App\Models\BunVariant;
use App\Models\Preset;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin BunVariant
 */
class BunVariantResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'builderId' => $this->builder_id,
            'slug' => $this->slug,
            'name' => $this->name,
            'topImage' => ImageResource::make($this->top_image_path, $this->top_image_width, $this->top_image_height),
            'bottomImage' => ImageResource::make($this->bottom_image_path, $this->bottom_image_width, $this->bottom_image_height),
            'isVisible' => $this->is_visible,
            'sortOrder' => $this->sort_order,
            'presetsCount' => $this->whenCounted('presets'),
            'presets' => $this->whenLoaded('presets', fn () => $this->presets->map(fn (Preset $preset) => [
                'id' => $preset->id,
                'name' => $preset->name,
            ])->values()),
            'createdAt' => $this->created_at?->toIso8601String(),
            'updatedAt' => $this->updated_at?->toIso8601String(),
        ];
    }
}
