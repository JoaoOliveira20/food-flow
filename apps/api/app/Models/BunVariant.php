<?php

namespace App\Models;

use Database\Factories\BunVariantFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Scope;
use Illuminate\Database\Eloquent\Builder as QueryBuilder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'slug',
    'name',
    'top_image_path',
    'top_image_width',
    'top_image_height',
    'bottom_image_path',
    'bottom_image_width',
    'bottom_image_height',
    'is_visible',
    'sort_order',
])]
class BunVariant extends Model
{
    /** @use HasFactory<BunVariantFactory> */
    use HasFactory;

    protected $attributes = [
        'is_visible' => false,
    ];

    protected function casts(): array
    {
        return [
            'top_image_width' => 'integer',
            'top_image_height' => 'integer',
            'bottom_image_width' => 'integer',
            'bottom_image_height' => 'integer',
            'is_visible' => 'boolean',
            'sort_order' => 'integer',
        ];
    }

    public function builder(): BelongsTo
    {
        return $this->belongsTo(Builder::class);
    }

    public function presets(): HasMany
    {
        return $this->hasMany(Preset::class);
    }

    #[Scope]
    protected function visible(QueryBuilder $query): void
    {
        $query->where('is_visible', true);
    }
}
