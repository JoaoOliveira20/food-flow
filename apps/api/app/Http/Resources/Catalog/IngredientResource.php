<?php

namespace App\Http\Resources\Catalog;

use App\Models\Ingredient;
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
            'slug' => $this->slug,
            'name' => $this->name,
            'image' => ImageResource::make($this->image_path, $this->image_width, $this->image_height),
            'shape' => [
                'displayWidth' => $this->display_width,
                'restingSurfaceRatio' => $this->resting_surface_ratio,
                'sinkRatio' => $this->sink_ratio,
            ],
        ];
    }
}
