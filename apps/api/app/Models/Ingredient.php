<?php

namespace App\Models;

use Database\Factories\IngredientFactory;
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
    'image_path',
    'image_width',
    'image_height',
    'display_width',
    'resting_surface_ratio',
    'sink_ratio',
    'is_visible',
    'sort_order',
])]
class Ingredient extends Model
{
    /** @use HasFactory<IngredientFactory> */
    use HasFactory;

    protected $attributes = [
        'is_visible' => false,
    ];

    protected function casts(): array
    {
        return [
            'image_width' => 'integer',
            'image_height' => 'integer',
            'display_width' => 'integer',
            'resting_surface_ratio' => 'float',
            'sink_ratio' => 'float',
            'is_visible' => 'boolean',
            'sort_order' => 'integer',
        ];
    }

    public function builder(): BelongsTo
    {
        return $this->belongsTo(Builder::class);
    }

    public function presetItems(): HasMany
    {
        return $this->hasMany(PresetItem::class);
    }

    #[Scope]
    protected function visible(QueryBuilder $query): void
    {
        $query->where('is_visible', true);
    }
}
