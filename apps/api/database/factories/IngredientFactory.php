<?php

namespace Database\Factories;

use App\Models\Builder;
use App\Models\Ingredient;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Ingredient>
 */
class IngredientFactory extends Factory
{
    public function definition(): array
    {
        return [
            'builder_id' => Builder::factory(),
            'slug' => fake()->unique()->slug(2),
            'name' => fake()->words(2, true),
            'image_path' => 'ingredients/'.Str::random(40).'.png',
            'image_width' => 336,
            'image_height' => 198,
            'display_width' => 292,
            'resting_surface_ratio' => 0.5,
            'sink_ratio' => 0.1,
            'is_visible' => true,
            'sort_order' => 0,
        ];
    }

    public function hidden(): static
    {
        return $this->state(fn () => ['is_visible' => false]);
    }
}
