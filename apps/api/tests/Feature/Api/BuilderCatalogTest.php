<?php

namespace Tests\Feature\Api;

use App\Models\Builder;
use App\Models\BunVariant;
use App\Models\Ingredient;
use App\Models\Preset;
use Database\Seeders\BurgerCatalogSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Illuminate\Testing\Fluent\AssertableJson;
use Tests\TestCase;

class BuilderCatalogTest extends TestCase
{
    use RefreshDatabase;

    private Builder $builder;

    private BunVariant $classic;

    protected function setUp(): void
    {
        parent::setUp();

        config(['media.disk' => 'media-test']);
        Storage::fake('media-test');

        $this->builder = Builder::factory()->create(['slug' => 'burger', 'name' => 'Hambúrguer', 'max_layers' => 14]);
        $this->classic = BunVariant::factory()->for($this->builder)->create(['slug' => 'classic', 'sort_order' => 0]);
    }

    public function test_an_unknown_builder_is_not_found(): void
    {
        $this->getJson('/api/builders/pizza')
            ->assertNotFound()
            ->assertExactJson(['message' => 'Recurso não encontrado.']);
    }

    public function test_it_returns_the_builder_configuration_and_bun_variants(): void
    {
        $this->getJson('/api/builders/burger')
            ->assertOk()
            ->assertHeader('X-RateLimit-Limit', '600')
            ->assertJson(fn (AssertableJson $json) => $json
                ->has('data', fn (AssertableJson $data) => $data
                    ->where('slug', 'burger')
                    ->where('name', 'Hambúrguer')
                    ->where('maxLayers', 14)
                    ->has('bunVariants', 1, fn (AssertableJson $variant) => $variant
                        ->where('id', $this->classic->id)
                        ->where('slug', 'classic')
                        ->where('topImage.url', Storage::disk('media-test')->url($this->classic->top_image_path))
                        ->where('topImage.width', 375)
                        ->where('bottomImage.height', 146)
                        ->etc())
                    ->etc()));
    }

    public function test_it_returns_only_visible_ingredients_in_display_order(): void
    {
        $second = Ingredient::factory()->for($this->builder)->create(['sort_order' => 2]);
        $first = Ingredient::factory()->for($this->builder)->create([
            'sort_order' => 1,
            'display_width' => 256,
            'resting_surface_ratio' => 0.95,
            'sink_ratio' => 0.78,
        ]);
        Ingredient::factory()->for($this->builder)->hidden()->create();
        Ingredient::factory()->create();

        $this->getJson('/api/builders/burger')
            ->assertOk()
            ->assertJsonPath('data.ingredients.*.id', [$first->id, $second->id])
            ->assertJsonPath('data.ingredients.0.shape', ['displayWidth' => 256, 'restingSurfaceRatio' => 0.95, 'sinkRatio' => 0.78])
            ->assertJsonPath('data.ingredients.0.image', [
                'url' => Storage::disk('media-test')->url($first->image_path),
                'width' => 336,
                'height' => 198,
            ]);
    }

    public function test_it_returns_only_available_presets_with_ordered_and_repeated_ingredients(): void
    {
        $beef = Ingredient::factory()->for($this->builder)->create();
        $cheddar = Ingredient::factory()->for($this->builder)->create();
        $hidden = Ingredient::factory()->for($this->builder)->hidden()->create();
        $double = Preset::factory()->for($this->builder)->for($this->classic)->withIngredients([$beef, $cheddar, $beef])->create(['name' => 'Duplo']);
        Preset::factory()->for($this->builder)->for($this->classic)->withIngredients([$beef, $hidden])->create(['name' => 'Oculto']);

        $this->getJson('/api/builders/burger')
            ->assertOk()
            ->assertJsonPath('data.presets', [[
                'id' => $double->id,
                'name' => 'Duplo',
                'bunVariantId' => $this->classic->id,
                'ingredientIds' => [$beef->id, $cheddar->id, $beef->id],
            ]]);
    }

    public function test_the_initial_preset_becomes_the_initial_recipe_and_is_not_listed(): void
    {
        $beef = Ingredient::factory()->for($this->builder)->create();
        $tomato = Ingredient::factory()->for($this->builder)->create();
        $initial = Preset::factory()->for($this->builder)->for($this->classic)->withIngredients([$beef, $tomato])->create();
        $this->builder->initialPreset()->associate($initial)->save();

        $this->getJson('/api/builders/burger')
            ->assertOk()
            ->assertJsonPath('data.presets', [])
            ->assertJsonPath('data.initialRecipe', ['bunVariantId' => $this->classic->id, 'ingredientIds' => [$beef->id, $tomato->id]]);
    }

    public function test_an_unavailable_initial_preset_becomes_an_empty_composition(): void
    {
        $brioche = BunVariant::factory()->for($this->builder)->create(['sort_order' => 1]);
        $hidden = Ingredient::factory()->for($this->builder)->hidden()->create();
        $initial = Preset::factory()->for($this->builder)->for($brioche)->withIngredients([$hidden])->create();
        $this->builder->initialPreset()->associate($initial)->save();

        $this->getJson('/api/builders/burger')
            ->assertOk()
            ->assertJsonPath('data.initialRecipe', ['bunVariantId' => $brioche->id, 'ingredientIds' => []]);
    }

    public function test_without_an_initial_preset_it_starts_empty_with_the_first_bun_variant(): void
    {
        $this->getJson('/api/builders/burger')
            ->assertOk()
            ->assertJsonPath('data.initialRecipe', ['bunVariantId' => $this->classic->id, 'ingredientIds' => []]);
    }

    public function test_it_serves_the_seeded_catalog(): void
    {
        $this->classic->delete();
        $this->builder->delete();
        $this->seed(BurgerCatalogSeeder::class);

        $this->getJson('/api/builders/burger')
            ->assertOk()
            ->assertJsonCount(4, 'data.bunVariants')
            ->assertJsonCount(13, 'data.ingredients')
            ->assertJsonPath('data.presets.*.name', ['Clássico', 'Bacon', 'Duplo'])
            ->assertJsonCount(5, 'data.initialRecipe.ingredientIds');
    }
}
