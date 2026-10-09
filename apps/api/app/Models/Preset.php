<?php

namespace App\Models;

use Database\Factories\PresetFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Scope;
use Illuminate\Database\Eloquent\Builder as QueryBuilder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['bun_variant_id', 'name', 'is_visible', 'sort_order'])]
class Preset extends Model
{
    /** @use HasFactory<PresetFactory> */
    use HasFactory;

    protected $attributes = [
        'is_visible' => false,
    ];

    protected function casts(): array
    {
        return [
            'is_visible' => 'boolean',
            'sort_order' => 'integer',
        ];
    }

    public function builder(): BelongsTo
    {
        return $this->belongsTo(Builder::class);
    }

    public function bunVariant(): BelongsTo
    {
        return $this->belongsTo(BunVariant::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(PresetItem::class)->orderBy('position');
    }

    #[Scope]
    protected function visible(QueryBuilder $query): void
    {
        $query->where('is_visible', true);
    }

    /**
     * Presets whose bun and ingredients are all visible (BD-14), whatever the preset's own visibility (BD-23).
     */
    #[Scope]
    protected function available(QueryBuilder $query): void
    {
        $query
            ->whereHas('bunVariant', fn (QueryBuilder $bunVariants) => $bunVariants->where('is_visible', true))
            ->whereDoesntHave('items.ingredient', fn (QueryBuilder $ingredients) => $ingredients->where('is_visible', false));
    }

    public function isAvailable(): bool
    {
        $this->loadMissing(['bunVariant', 'items.ingredient']);

        return $this->bunVariant->is_visible && $this->items->every(fn (PresetItem $item) => $item->ingredient->is_visible);
    }

    /**
     * @param  list<int>  $ingredientIds  Ingredients from the bottom to the top of the stack.
     */
    public function replaceItems(array $ingredientIds): void
    {
        $this->items()->delete();

        $this->items()->createMany(array_map(
            fn (int $ingredientId, int $position) => ['ingredient_id' => $ingredientId, 'position' => $position],
            $ingredientIds,
            array_keys($ingredientIds),
        ));

        $this->unsetRelation('items');
    }
}
