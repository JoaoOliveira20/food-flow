<?php

namespace App\Http\Resources\Catalog;

use App\Models\BunVariant;
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
            'slug' => $this->slug,
            'name' => $this->name,
            'topImage' => ImageResource::make($this->top_image_path, $this->top_image_width, $this->top_image_height),
            'bottomImage' => ImageResource::make($this->bottom_image_path, $this->bottom_image_width, $this->bottom_image_height),
        ];
    }
}
