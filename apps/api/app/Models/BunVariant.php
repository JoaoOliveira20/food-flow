<?php

namespace App\Models;

use Database\Factories\BunVariantFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'slug',
    'name',
    'top_image_path',
    'top_image_width',
    'top_image_height',
    'bottom_image_path',
    'bottom_image_width',
    'bottom_image_height',
    'sort_order',
])]
class BunVariant extends Model
{
    /** @use HasFactory<BunVariantFactory> */
    use HasFactory;

    protected function casts(): array
    {
        return [
            'top_image_width' => 'integer',
            'top_image_height' => 'integer',
            'bottom_image_width' => 'integer',
            'bottom_image_height' => 'integer',
            'sort_order' => 'integer',
        ];
    }

    public function builder(): BelongsTo
    {
        return $this->belongsTo(Builder::class);
    }
}
