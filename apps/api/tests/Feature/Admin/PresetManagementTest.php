<?php

namespace Tests\Feature\Admin;

use App\Models\Builder;
use App\Models\BunVariant;
use App\Models\Ingredient;
use App\Models\Preset;
use App\Models\PresetItem;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PresetManagementTest extends TestCase
{
    use RefreshDatabase;

    private Builder $builder;

    private BunVariant $classic;

    private Ingredient $beef;

    private Ingredient $cheddar;

    protected function setUp(): void
    {
        parent::setUp();

        $this->builder = Builder::factory()->create(['slug' => 'burger', 'max_layers' => 4]);
        $this->classic = BunVariant::factory()->for($this->builder)->create();
        $this->beef = Ingredient::factory()->for($this->builder)->create();
        $this->cheddar = Ingredient::factory()->for($this->builder)->create();
    }

    private function storeUrl(): string
    {
        return "/api/admin/builders/{$this->builder->id}/presets";
    }

    public function test_it_lists_presets_with_availability_and_the_initial_flag(): void
    {
        $hidden = Ingredient::factory()->for($this->builder)->hidden()->create();
        $initial = Preset::factory()->for($this->builder)->for($this->classic)->withIngredients([$this->beef])->create(['sort_order' => 0]);
        $unavailable = Preset::factory()->for($this->builder)->for($this->classic)->withIngredients([$this->beef, $hidden])->create(['sort_order' => 1]);
        $this->builder->initialPreset()->associate($initial)->save();

        $this->getJson($this->storeUrl())
            ->assertOk()
            ->assertJsonPath('data.*.id', [$initial->id, $unavailable->id])
            ->assertJsonPath('data.*.isInitial', [true, false])
            ->assertJsonPath('data.*.isAvailable', [true, false])
            ->assertJsonPath('data.*.isVisible', [true, true])
            ->assertJsonPath('data.1.ingredientIds', [$this->beef->id, $hidden->id]);
    }

    public function test_it_creates_a_preset_keeping_order_and_repetitions(): void
    {
        $ingredientIds = [$this->beef->id, $this->cheddar->id, $this->beef->id];

        $response = $this->postJson($this->storeUrl(), [
            'name' => 'Duplo',
            'bunVariantId' => $this->classic->id,
            'ingredientIds' => $ingredientIds,
        ]);

        $response->assertCreated()
            ->assertJsonPath('data.name', 'Duplo')
            ->assertJsonPath('data.bunVariantId', $this->classic->id)
            ->assertJsonPath('data.ingredientIds', $ingredientIds)
            ->assertJsonPath('data.isInitial', false)
            ->assertJsonPath('data.isAvailable', true)
            ->assertJsonPath('data.isVisible', false);

        $this->getJson('/api/builders/burger')->assertJsonPath('data.presets', []);

        $this->patchJson("/api/admin/presets/{$response->json('data.id')}", ['isVisible' => true])
            ->assertOk()
            ->assertJsonPath('data.isVisible', true);

        $this->getJson('/api/builders/burger')->assertJsonPath('data.presets.0.ingredientIds', $ingredientIds);
    }

    public function test_a_new_preset_cannot_be_created_already_published(): void
    {
        $this->postJson($this->storeUrl(), [
            'name' => 'Duplo',
            'bunVariantId' => $this->classic->id,
            'ingredientIds' => [$this->beef->id],
            'isVisible' => true,
        ])->assertJsonValidationErrors(['isVisible' => 'Um preset novo começa oculto; publique-o depois de conferir no montador.']);
    }

    public function test_hiding_a_preset_removes_it_from_the_public_builder_and_publishing_brings_it_back(): void
    {
        $preset = Preset::factory()->for($this->builder)->for($this->classic)->withIngredients([$this->beef])->create();

        $this->getJson('/api/builders/burger')->assertJsonPath('data.presets.*.id', [$preset->id]);

        $this->patchJson("/api/admin/presets/{$preset->id}", ['isVisible' => false])
            ->assertOk()
            ->assertJsonPath('data.isVisible', false)
            ->assertJsonPath('data.isAvailable', true)
            ->assertJsonPath('data.ingredientIds', [$this->beef->id]);
        $this->getJson('/api/builders/burger')->assertJsonPath('data.presets', []);

        $this->patchJson("/api/admin/presets/{$preset->id}", ['isVisible' => true])->assertOk();
        $this->getJson('/api/builders/burger')->assertJsonPath('data.presets.*.id', [$preset->id]);
    }

    public function test_a_published_preset_with_a_hidden_ingredient_stays_out_of_the_public_builder(): void
    {
        $hidden = Ingredient::factory()->for($this->builder)->hidden()->create();
        Preset::factory()->for($this->builder)->for($this->classic)->withIngredients([$hidden])->create();

        $this->getJson('/api/builders/burger')->assertJsonPath('data.presets', []);
    }

    public function test_it_validates_the_preset_with_translated_messages(): void
    {
        $this->postJson($this->storeUrl(), ['ingredientIds' => []])
            ->assertUnprocessable()
            ->assertJsonValidationErrors([
                'name' => 'O campo nome é obrigatório.',
                'bunVariantId' => 'O campo tipo de pão é obrigatório.',
                'ingredientIds' => 'O campo ingredientes é obrigatório.',
            ]);
    }

    public function test_it_enforces_the_layer_limit_of_the_builder(): void
    {
        $this->postJson($this->storeUrl(), [
            'name' => 'Grande demais',
            'bunVariantId' => $this->classic->id,
            'ingredientIds' => array_fill(0, 5, $this->beef->id),
        ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['ingredientIds' => 'Um preset pode ter no máximo 4 ingredientes.']);
    }

    public function test_it_rejects_items_from_another_builder_or_that_do_not_exist(): void
    {
        $pizza = Builder::factory()->create();
        $pepperoni = Ingredient::factory()->for($pizza)->create();
        $pizzaCrust = BunVariant::factory()->for($pizza)->create();

        $this->postJson($this->storeUrl(), [
            'name' => 'Misturado',
            'bunVariantId' => $pizzaCrust->id,
            'ingredientIds' => [$this->beef->id, $pepperoni->id, 999],
        ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors([
                'bunVariantId' => 'O tipo de pão escolhido não pertence a este montador.',
                'ingredientIds.1' => 'Um dos ingredientes escolhidos não pertence a este montador.',
                'ingredientIds.2' => 'Um dos ingredientes escolhidos não pertence a este montador.',
            ]);

        $this->assertSame(0, Preset::count());
    }

    public function test_it_rejects_malformed_ingredient_lists(): void
    {
        $this->postJson($this->storeUrl(), [
            'name' => 'Estranho',
            'bunVariantId' => $this->classic->id,
            'ingredientIds' => ['first' => $this->beef->id],
        ])->assertJsonValidationErrors(['ingredientIds' => 'O campo ingredientes deve ser uma lista.']);

        $this->postJson($this->storeUrl(), [
            'name' => 'Estranho',
            'bunVariantId' => $this->classic->id,
            'ingredientIds' => ['abc'],
        ])->assertJsonValidationErrors(['ingredientIds.0' => 'O campo ingrediente deve ser um número inteiro.']);
    }

    public function test_preset_names_are_unique_per_builder(): void
    {
        Preset::factory()->for($this->builder)->for($this->classic)->create(['name' => 'Clássico']);

        $this->postJson($this->storeUrl(), [
            'name' => 'Clássico',
            'bunVariantId' => $this->classic->id,
            'ingredientIds' => [$this->beef->id],
        ])->assertJsonValidationErrors(['name' => 'Já existe um preset com este nome.']);
    }

    public function test_it_allows_hidden_ingredients_and_keeps_the_preset_out_of_the_public_builder(): void
    {
        $hidden = Ingredient::factory()->for($this->builder)->hidden()->create();

        $this->postJson($this->storeUrl(), [
            'name' => 'Em teste',
            'bunVariantId' => $this->classic->id,
            'ingredientIds' => [$hidden->id],
        ])
            ->assertCreated()
            ->assertJsonPath('data.isAvailable', false);

        $this->getJson('/api/builders/burger')->assertJsonPath('data.presets', []);
    }

    public function test_it_updates_fields_and_replaces_the_whole_ingredient_list(): void
    {
        $preset = Preset::factory()->for($this->builder)->for($this->classic)->withIngredients([$this->beef, $this->cheddar, $this->beef])->create();
        $brioche = BunVariant::factory()->for($this->builder)->create();

        $this->patchJson("/api/admin/presets/{$preset->id}", [
            'name' => 'Simples',
            'bunVariantId' => $brioche->id,
            'ingredientIds' => [$this->cheddar->id],
        ])
            ->assertOk()
            ->assertJsonPath('data.name', 'Simples')
            ->assertJsonPath('data.bunVariantId', $brioche->id)
            ->assertJsonPath('data.ingredientIds', [$this->cheddar->id]);

        $this->assertSame(1, PresetItem::count());
    }

    public function test_a_partial_update_keeps_the_ingredients(): void
    {
        $preset = Preset::factory()->for($this->builder)->for($this->classic)->withIngredients([$this->beef, $this->cheddar])->create(['name' => 'Antigo']);

        $this->patchJson("/api/admin/presets/{$preset->id}", ['name' => 'Antigo'])
            ->assertOk()
            ->assertJsonPath('data.ingredientIds', [$this->beef->id, $this->cheddar->id]);
    }

    public function test_an_invalid_update_changes_nothing(): void
    {
        $preset = Preset::factory()->for($this->builder)->for($this->classic)->withIngredients([$this->beef])->create(['name' => 'Original']);

        $this->patchJson("/api/admin/presets/{$preset->id}", ['name' => 'Novo', 'ingredientIds' => [999]])
            ->assertUnprocessable();

        $this->assertSame('Original', $preset->fresh()->name);
        $this->assertSame([$this->beef->id], $preset->fresh()->items->pluck('ingredient_id')->all());
    }

    public function test_it_deletes_a_preset_and_its_items(): void
    {
        $preset = Preset::factory()->for($this->builder)->for($this->classic)->withIngredients([$this->beef])->create();

        $this->deleteJson("/api/admin/presets/{$preset->id}")->assertNoContent();

        $this->assertModelMissing($preset);
        $this->assertSame(0, PresetItem::count());
    }

    public function test_it_refuses_to_delete_the_initial_preset(): void
    {
        $initial = Preset::factory()->for($this->builder)->for($this->classic)->withIngredients([$this->beef])->create();
        $this->builder->initialPreset()->associate($initial)->save();

        $this->deleteJson("/api/admin/presets/{$initial->id}")
            ->assertConflict()
            ->assertExactJson(['message' => 'O preset inicial do montador não pode ser excluído; ele define a composição que aparece ao abrir o montador.']);

        $this->assertModelExists($initial);
    }

    public function test_it_refuses_to_hide_the_initial_preset(): void
    {
        $initial = Preset::factory()->for($this->builder)->for($this->classic)->withIngredients([$this->beef])->create();
        $this->builder->initialPreset()->associate($initial)->save();

        $this->patchJson("/api/admin/presets/{$initial->id}", ['isVisible' => false])
            ->assertConflict()
            ->assertExactJson(['message' => 'A composição inicial não pode ser ocultada; ela é o hambúrguer que aparece ao abrir o montador.']);

        $this->assertTrue($initial->fresh()->is_visible);
    }

    public function test_the_initial_preset_can_be_edited(): void
    {
        $initial = Preset::factory()->for($this->builder)->for($this->classic)->withIngredients([$this->beef])->create();
        $this->builder->initialPreset()->associate($initial)->save();

        $this->patchJson("/api/admin/presets/{$initial->id}", ['ingredientIds' => [$this->cheddar->id, $this->beef->id]])
            ->assertOk()
            ->assertJsonPath('data.isInitial', true);

        $this->getJson('/api/builders/burger')
            ->assertJsonPath('data.initialRecipe.ingredientIds', [$this->cheddar->id, $this->beef->id]);
    }
}
