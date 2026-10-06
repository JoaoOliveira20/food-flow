<?php

namespace Tests\Feature\Seeders;

use App\Models\Builder;
use App\Models\BunVariant;
use App\Models\Ingredient;
use App\Models\Preset;
use Database\Seeders\BurgerCatalogSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class BurgerCatalogSeederTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        config(['media.disk' => 'media-test']);
        Storage::fake('media-test');
    }

    public function test_it_seeds_the_burger_builder_with_the_current_catalog(): void
    {
        $this->seed(BurgerCatalogSeeder::class);

        $builder = Builder::where('slug', 'burger')->firstOrFail();

        $this->assertSame(14, $builder->max_layers);
        $this->assertSame(['classic', 'brioche', 'multigrain', 'charcoal'], $builder->bunVariants->pluck('slug')->all());
        $this->assertSame(
            ['beef', 'cheddar', 'swiss', 'bacon', 'lettuce', 'tomato', 'onion', 'pickles', 'egg', 'mayo', 'ketchup', 'mustard', 'middle-bun'],
            $builder->ingredients->pluck('slug')->all(),
        );
        $this->assertTrue($builder->ingredients->every->is_visible);
    }

    public function test_it_seeds_the_presets_and_the_initial_composition(): void
    {
        $this->seed(BurgerCatalogSeeder::class);

        $builder = Builder::where('slug', 'burger')->firstOrFail();
        $recipe = fn (Preset $preset) => [
            $preset->bunVariant->slug,
            $preset->items->map(fn ($item) => $item->ingredient->slug)->all(),
        ];

        $this->assertSame('Composição inicial', $builder->initialPreset->name);
        $this->assertSame(['classic', ['beef', 'cheddar', 'onion', 'tomato', 'lettuce']], $recipe($builder->initialPreset));

        $presets = $builder->presets->except($builder->initial_preset_id)->keyBy('name');
        $this->assertSame(['Clássico', 'Bacon', 'Duplo'], $presets->keys()->all());
        $this->assertSame(['classic', ['beef', 'cheddar', 'lettuce', 'tomato']], $recipe($presets['Clássico']));
        $this->assertSame(['brioche', ['beef', 'cheddar', 'bacon', 'onion', 'pickles', 'ketchup']], $recipe($presets['Bacon']));
        $this->assertSame(
            ['classic', ['beef', 'cheddar', 'lettuce', 'pickles', 'middle-bun', 'beef', 'cheddar', 'lettuce', 'onion']],
            $recipe($presets['Duplo']),
        );
    }

    public function test_it_keeps_the_stacking_shape_of_each_ingredient(): void
    {
        $this->seed(BurgerCatalogSeeder::class);

        $shape = fn (string $slug) => Ingredient::where('slug', $slug)->firstOrFail()
            ->only(['display_width', 'resting_surface_ratio', 'sink_ratio']);

        $this->assertSame(['display_width' => 292, 'resting_surface_ratio' => 0.5, 'sink_ratio' => 0.1], $shape('beef'));
        $this->assertSame(['display_width' => 256, 'resting_surface_ratio' => 0.95, 'sink_ratio' => 0.78], $shape('ketchup'));
        $this->assertSame(['display_width' => 296, 'resting_surface_ratio' => 0.56, 'sink_ratio' => 0.1], $shape('middle-bun'));
    }

    public function test_stored_images_exist_and_record_their_natural_size(): void
    {
        $this->seed(BurgerCatalogSeeder::class);

        $images = Ingredient::all()->map(fn (Ingredient $ingredient) => [$ingredient->image_path, $ingredient->image_width, $ingredient->image_height])
            ->concat(BunVariant::all()->flatMap(fn (BunVariant $variant) => [
                [$variant->top_image_path, $variant->top_image_width, $variant->top_image_height],
                [$variant->bottom_image_path, $variant->bottom_image_width, $variant->bottom_image_height],
            ]));

        $this->assertCount(21, $images);
        foreach ($images as [$path, $width, $height]) {
            Storage::disk('media-test')->assertExists($path);
            [$fileWidth, $fileHeight] = getimagesizefromstring(Storage::disk('media-test')->get($path));
            $this->assertSame([$fileWidth, $fileHeight], [$width, $height], $path);
        }
        $this->assertSame([1426, 350], [Ingredient::where('slug', 'ketchup')->value('image_width'), Ingredient::where('slug', 'ketchup')->value('image_height')]);
    }

    public function test_running_it_again_does_not_duplicate_anything(): void
    {
        $this->seed(BurgerCatalogSeeder::class);
        $files = count(Storage::disk('media-test')->allFiles());

        $this->seed(BurgerCatalogSeeder::class);

        $this->assertSame(1, Builder::count());
        $this->assertSame(13, Ingredient::count());
        $this->assertCount($files, Storage::disk('media-test')->allFiles());
    }
}
