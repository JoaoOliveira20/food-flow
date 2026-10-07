<?php

namespace Database\Seeders;

use App\Media\ImageStorage;
use App\Media\StoredImage;
use App\Models\Builder;
use Illuminate\Database\Seeder;
use Illuminate\Http\File;
use Illuminate\Support\Facades\DB;
use Throwable;

/**
 * Initial content of the burger builder: the catalog that lived in apps/web before
 * the backend existed (docs/DOMAIN_DECISIONS.md §2 and §19, docs/BACKEND_DECISIONS.md).
 */
class BurgerCatalogSeeder extends Seeder
{
    private const SAUCE_SHAPE = ['display_width' => 256, 'resting_surface_ratio' => 0.95, 'sink_ratio' => 0.78];

    private const BUN_VARIANTS = [
        ['slug' => 'classic', 'name' => 'Clássico', 'file' => 'classic'],
        ['slug' => 'brioche', 'name' => 'Brioche', 'file' => 'brioche'],
        ['slug' => 'multigrain', 'name' => 'Multigrãos', 'file' => 'multigrain'],
        ['slug' => 'charcoal', 'name' => 'Escuro', 'file' => 'charcoal'],
    ];

    private const INGREDIENTS = [
        ['slug' => 'beef', 'name' => 'Carne', 'file' => 'beef-patty', 'shape' => ['display_width' => 292, 'resting_surface_ratio' => 0.5, 'sink_ratio' => 0.1]],
        ['slug' => 'cheddar', 'name' => 'Cheddar', 'file' => 'cheddar', 'shape' => ['display_width' => 304, 'resting_surface_ratio' => 0.4, 'sink_ratio' => 0.3]],
        ['slug' => 'swiss', 'name' => 'Queijo suíço', 'file' => 'swiss-cheese', 'shape' => ['display_width' => 296, 'resting_surface_ratio' => 0.4, 'sink_ratio' => 0.3]],
        ['slug' => 'bacon', 'name' => 'Bacon', 'file' => 'bacon', 'shape' => ['display_width' => 300, 'resting_surface_ratio' => 0.32, 'sink_ratio' => 0.22]],
        ['slug' => 'lettuce', 'name' => 'Alface', 'file' => 'lettuce', 'shape' => ['display_width' => 318, 'resting_surface_ratio' => 0.4, 'sink_ratio' => 0.24]],
        ['slug' => 'tomato', 'name' => 'Tomate', 'file' => 'tomato', 'shape' => ['display_width' => 282, 'resting_surface_ratio' => 0.42, 'sink_ratio' => 0.16]],
        ['slug' => 'onion', 'name' => 'Cebola roxa', 'file' => 'red-onion', 'shape' => ['display_width' => 276, 'resting_surface_ratio' => 0.36, 'sink_ratio' => 0.16]],
        ['slug' => 'pickles', 'name' => 'Picles', 'file' => 'pickles', 'shape' => ['display_width' => 240, 'resting_surface_ratio' => 0.34, 'sink_ratio' => 0.2]],
        ['slug' => 'egg', 'name' => 'Ovo', 'file' => 'fried-egg', 'shape' => ['display_width' => 280, 'resting_surface_ratio' => 0.32, 'sink_ratio' => 0.2]],
        ['slug' => 'mayo', 'name' => 'Maionese', 'file' => 'mayonnaise', 'shape' => self::SAUCE_SHAPE],
        ['slug' => 'ketchup', 'name' => 'Ketchup', 'file' => 'ketchup', 'shape' => self::SAUCE_SHAPE],
        ['slug' => 'mustard', 'name' => 'Mostarda', 'file' => 'mustard', 'shape' => self::SAUCE_SHAPE],
        ['slug' => 'middle-bun', 'name' => 'Pão do meio', 'file' => 'middle-bun', 'shape' => ['display_width' => 296, 'resting_surface_ratio' => 0.56, 'sink_ratio' => 0.1]],
    ];

    private const INITIAL_PRESET = [
        'name' => 'Composição inicial',
        'bun' => 'classic',
        'ingredients' => ['beef', 'cheddar', 'onion', 'tomato', 'lettuce'],
    ];

    private const PRESETS = [
        ['name' => 'Clássico', 'bun' => 'classic', 'ingredients' => ['beef', 'cheddar', 'lettuce', 'tomato']],
        ['name' => 'Bacon', 'bun' => 'brioche', 'ingredients' => ['beef', 'cheddar', 'bacon', 'onion', 'pickles', 'ketchup']],
        ['name' => 'Duplo', 'bun' => 'classic', 'ingredients' => ['beef', 'cheddar', 'lettuce', 'pickles', 'middle-bun', 'beef', 'cheddar', 'lettuce', 'onion']],
    ];

    /** @var list<string> */
    private array $storedPaths = [];

    public function __construct(private readonly ImageStorage $images) {}

    public function run(): void
    {
        if (Builder::where('slug', 'burger')->exists()) {
            $this->command?->info('Burger builder already seeded; skipping.');

            return;
        }

        try {
            DB::transaction(fn () => $this->seed());
        } catch (Throwable $exception) {
            array_map($this->images->delete(...), $this->storedPaths);

            throw $exception;
        }
    }

    private function seed(): void
    {
        $builder = Builder::create(['slug' => 'burger', 'name' => 'Hambúrguer', 'max_layers' => 14]);

        $bunVariants = [];
        foreach (self::BUN_VARIANTS as $order => $variant) {
            $top = $this->storeImage("bun-top-{$variant['file']}", 'bun_variants');
            $bottom = $this->storeImage("bun-bottom-{$variant['file']}", 'bun_variants');

            $bunVariants[$variant['slug']] = $builder->bunVariants()->create([
                'slug' => $variant['slug'],
                'name' => $variant['name'],
                'top_image_path' => $top->path,
                'top_image_width' => $top->width,
                'top_image_height' => $top->height,
                'bottom_image_path' => $bottom->path,
                'bottom_image_width' => $bottom->width,
                'bottom_image_height' => $bottom->height,
                'is_visible' => true,
                'sort_order' => $order,
            ]);
        }

        $ingredients = [];
        foreach (self::INGREDIENTS as $order => $ingredient) {
            $image = $this->storeImage($ingredient['file'], 'ingredients');

            $ingredients[$ingredient['slug']] = $builder->ingredients()->create([
                'slug' => $ingredient['slug'],
                'name' => $ingredient['name'],
                'image_path' => $image->path,
                'image_width' => $image->width,
                'image_height' => $image->height,
                ...$ingredient['shape'],
                'is_visible' => true,
                'sort_order' => $order,
            ]);
        }

        $createPreset = function (array $preset, int $order) use ($builder, $bunVariants, $ingredients) {
            $model = $builder->presets()->create([
                'name' => $preset['name'],
                'bun_variant_id' => $bunVariants[$preset['bun']]->id,
                'is_visible' => true,
                'sort_order' => $order,
            ]);

            $model->replaceItems(array_map(
                fn (string $slug) => $ingredients[$slug]->id,
                $preset['ingredients'],
            ));

            return $model;
        };

        $initialPreset = $createPreset(self::INITIAL_PRESET, 0);
        foreach (self::PRESETS as $order => $preset) {
            $createPreset($preset, $order + 1);
        }

        $builder->initialPreset()->associate($initialPreset)->save();
    }

    private function storeImage(string $fileName, string $directoryKey): StoredImage
    {
        $image = $this->images->store(
            new File(database_path("seeders/assets/{$fileName}.png")),
            config("media.directories.{$directoryKey}"),
        );

        $this->storedPaths[] = $image->path;

        return $image;
    }
}
