<?php

namespace Database\Factories;

use App\Models\Builder;
use App\Models\BunVariant;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<BunVariant>
 */
class BunVariantFactory extends Factory
{
    public function definition(): array
    {
        return [
            'builder_id' => Builder::factory(),
            'slug' => fake()->unique()->slug(2),
            'name' => fake()->word(),
            'top_image_path' => 'bun-variants/'.Str::random(40).'.png',
            'top_image_width' => 375,
            'top_image_height' => 208,
            'bottom_image_path' => 'bun-variants/'.Str::random(40).'.png',
            'bottom_image_width' => 336,
            'bottom_image_height' => 146,
            'is_visible' => true,
            'sort_order' => 0,
        ];
    }

    public function hidden(): static
    {
        return $this->state(fn () => ['is_visible' => false]);
    }
}
