<?php

namespace Tests\Feature\Models;

use App\Models\Builder;
use App\Models\BunVariant;
use App\Models\Ingredient;
use App\Models\Preset;
use App\Models\PresetItem;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CatalogModelsTest extends TestCase
{
    use RefreshDatabase;

    public function test_a_builder_lists_its_own_records_in_display_order(): void
    {
        $builder = Builder::factory()->create();
        $second = Ingredient::factory()->for($builder)->create(['sort_order' => 2]);
        $first = Ingredient::factory()->for($builder)->create(['sort_order' => 1]);
        Ingredient::factory()->create();

        $this->assertSame([$first->id, $second->id], $builder->ingredients->pluck('id')->all());
    }

    public function test_new_ingredients_are_hidden_by_default(): void
    {
        $ingredient = Builder::factory()->create()->ingredients()->create([
            'slug' => 'ketchup',
            'name' => 'Ketchup',
            'image_path' => 'ingredients/ketchup.png',
            'image_width' => 1426,
            'image_height' => 350,
            'display_width' => 256,
            'resting_surface_ratio' => 0.95,
            'sink_ratio' => 0.78,
        ]);

        $this->assertFalse($ingredient->fresh()->is_visible);
        $this->assertSame(0.78, $ingredient->fresh()->sink_ratio);
    }

    public function test_the_visible_scope_excludes_hidden_ingredients(): void
    {
        $visible = Ingredient::factory()->create();
        Ingredient::factory()->hidden()->create();

        $this->assertSame([$visible->id], Ingredient::visible()->pluck('id')->all());
    }

    public function test_preset_items_keep_order_and_allow_repeated_ingredients(): void
    {
        $builder = Builder::factory()->create();
        $beef = Ingredient::factory()->for($builder)->create();
        $cheddar = Ingredient::factory()->for($builder)->create();

        $preset = Preset::factory()->for($builder)->withIngredients([$beef, $cheddar, $beef])->create();

        $this->assertSame(
            [$beef->id, $cheddar->id, $beef->id],
            $preset->items->pluck('ingredient_id')->all(),
        );
        $this->assertSame([0, 1, 2], $preset->items->pluck('position')->all());
    }

    public function test_replacing_items_overwrites_the_whole_list(): void
    {
        $builder = Builder::factory()->create();
        [$beef, $tomato] = Ingredient::factory()->for($builder)->count(2)->create();
        $preset = Preset::factory()->for($builder)->withIngredients([$beef, $tomato, $beef])->create();

        $preset->replaceItems([$tomato->id]);

        $this->assertSame([$tomato->id], $preset->items->pluck('ingredient_id')->all());
        $this->assertSame(1, PresetItem::count());
    }

    public function test_a_preset_is_available_only_when_all_its_ingredients_are_visible(): void
    {
        $builder = Builder::factory()->create();
        $visible = Ingredient::factory()->for($builder)->create();
        $hidden = Ingredient::factory()->for($builder)->hidden()->create();
        $available = Preset::factory()->for($builder)->withIngredients([$visible])->create();
        $unavailable = Preset::factory()->for($builder)->withIngredients([$visible, $hidden])->create();

        $this->assertSame([$available->id], Preset::available()->pluck('id')->all());
        $this->assertTrue($available->isAvailable());
        $this->assertFalse($unavailable->isAvailable());
    }

    public function test_the_database_blocks_deleting_an_ingredient_used_by_a_preset(): void
    {
        $builder = Builder::factory()->create();
        $ingredient = Ingredient::factory()->for($builder)->create();
        Preset::factory()->for($builder)->withIngredients([$ingredient])->create();

        $this->expectException(QueryException::class);

        $ingredient->delete();
    }

    public function test_deleting_a_preset_deletes_its_items(): void
    {
        $builder = Builder::factory()->create();
        $preset = Preset::factory()->for($builder)->withIngredients([Ingredient::factory()->for($builder)->create()])->create();

        $preset->delete();

        $this->assertSame(0, PresetItem::count());
    }

    public function test_the_database_blocks_deleting_the_initial_preset(): void
    {
        $builder = Builder::factory()->create();
        $preset = Preset::factory()->for($builder)->create();
        $builder->initialPreset()->associate($preset)->save();

        $this->expectException(QueryException::class);

        $preset->delete();
    }

    public function test_bun_variants_belong_to_a_builder(): void
    {
        $variant = BunVariant::factory()->create();

        $this->assertTrue($variant->builder->bunVariants->contains($variant));
    }
}
