<?php

namespace Database\Factories;

use App\Models\Builder;
use App\Models\BunVariant;
use App\Models\Ingredient;
use App\Models\Preset;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Preset>
 */
class PresetFactory extends Factory
{
    public function definition(): array
    {
        return [
            'builder_id' => Builder::factory(),
            'bun_variant_id' => fn (array $attributes) => BunVariant::factory()->create(['builder_id' => $attributes['builder_id']]),
            'name' => fake()->unique()->words(2, true),
            'is_visible' => true,
            'sort_order' => 0,
        ];
    }

    public function hidden(): static
    {
        return $this->state(fn () => ['is_visible' => false]);
    }

    /**
     * @param  list<Ingredient>  $ingredients  From the bottom to the top of the stack.
     */
    public function withIngredients(array $ingredients): static
    {
        return $this->afterCreating(fn (Preset $preset) => $preset->replaceItems(
            array_map(fn (Ingredient $ingredient) => $ingredient->id, $ingredients),
        ));
    }
}
