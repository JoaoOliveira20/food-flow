<?php

namespace App\Services;

use App\Exceptions\PresetIsInitialException;
use App\Models\Builder;
use App\Models\Preset;
use Illuminate\Support\Facades\DB;

/**
 * Creates, updates and deletes presets with their ordered ingredients
 * (docs/BACKEND_DECISIONS.md BD-06, BD-07, BD-15).
 */
class PresetService
{
    /**
     * @param  array<string, mixed>  $attributes  Column values, without the ingredients.
     * @param  list<int>  $ingredientIds  From the bottom to the top of the stack.
     */
    public function create(Builder $builder, array $attributes, array $ingredientIds): Preset
    {
        return DB::transaction(function () use ($builder, $attributes, $ingredientIds) {
            $preset = $builder->presets()->create([
                ...$attributes,
                'sort_order' => $attributes['sort_order'] ?? $this->nextSortOrder($builder),
            ]);
            $preset->replaceItems($ingredientIds);

            return $preset;
        });
    }

    /**
     * @param  array<string, mixed>  $attributes  Column values, without the ingredients.
     * @param  list<int>|null  $ingredientIds  The complete new list, or null to keep the current one.
     */
    public function update(Preset $preset, array $attributes, ?array $ingredientIds): Preset
    {
        DB::transaction(function () use ($preset, $attributes, $ingredientIds) {
            $preset->update($attributes);

            if ($ingredientIds !== null) {
                $preset->replaceItems($ingredientIds);
                $preset->touch();
            }
        });

        return $preset;
    }

    public function delete(Preset $preset): void
    {
        if (Builder::where('initial_preset_id', $preset->id)->exists()) {
            throw new PresetIsInitialException;
        }

        $preset->delete();
    }

    private function nextSortOrder(Builder $builder): int
    {
        $last = $builder->presets()->reorder()->max('sort_order');

        return $last === null ? 0 : $last + 1;
    }
}
