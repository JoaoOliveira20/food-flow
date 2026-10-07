<?php

namespace Tests\Feature\Admin;

use App\Models\Builder;
use App\Models\BunVariant;
use App\Models\Ingredient;
use App\Models\Preset;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class BunVariantManagementTest extends TestCase
{
    use RefreshDatabase;

    private Builder $builder;

    private BunVariant $classic;

    protected function setUp(): void
    {
        parent::setUp();

        config(['media.disk' => 'media-test']);
        Storage::fake('media-test');

        $this->builder = Builder::factory()->create(['slug' => 'burger']);
        $this->classic = BunVariant::factory()->for($this->builder)->create(['slug' => 'classic', 'name' => 'Clássico', 'sort_order' => 0]);
    }

    private function images(): array
    {
        return [
            'topImage' => UploadedFile::fake()->image('topo.png', 360, 210),
            'bottomImage' => UploadedFile::fake()->image('base.png', 330, 140),
        ];
    }

    private function storedFiles(): array
    {
        return Storage::disk('media-test')->allFiles('bun-variants');
    }

    private function create(array $overrides = []): array
    {
        return $this->post("/api/admin/builders/{$this->builder->id}/bun-variants", [
            'name' => 'Australiano',
            ...$this->images(),
            ...$overrides,
        ], ['Accept' => 'application/json'])->assertCreated()->json('data');
    }

    public function test_it_lists_bun_variants_with_usage(): void
    {
        $hidden = BunVariant::factory()->for($this->builder)->hidden()->create(['sort_order' => 1]);
        Preset::factory()->for($this->builder)->for($this->classic)->create();

        $this->getJson("/api/admin/builders/{$this->builder->id}/bun-variants")
            ->assertOk()
            ->assertJsonPath('data.*.id', [$this->classic->id, $hidden->id])
            ->assertJsonPath('data.*.isVisible', [true, false])
            ->assertJsonPath('data.*.presetsCount', [1, 0]);
    }

    public function test_it_creates_a_hidden_bun_variant_with_both_images(): void
    {
        $created = $this->create();

        $this->assertSame('australiano', $created['slug']);
        $this->assertFalse($created['isVisible']);
        $this->assertSame([360, 210], [$created['topImage']['width'], $created['topImage']['height']]);
        $this->assertSame([330, 140], [$created['bottomImage']['width'], $created['bottomImage']['height']]);
        $this->assertCount(2, $this->storedFiles());

        $this->getJson('/api/builders/burger')->assertJsonPath('data.bunVariants.*.id', [$this->classic->id]);
    }

    public function test_it_validates_both_images(): void
    {
        $this->postJson("/api/admin/builders/{$this->builder->id}/bun-variants", [
            'topImage' => UploadedFile::fake()->image('topo.png', 360, 210),
            'bottomImage' => UploadedFile::fake()->image('base.jpg', 330, 140),
            'isVisible' => true,
        ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors([
                'name' => 'O campo nome é obrigatório.',
                'bottomImage' => 'A imagem deve ser PNG ou WebP (de preferência PNG com fundo transparente).',
                'isVisible' => 'Um tipo de pão novo começa oculto; publique-o depois de conferir o preview.',
            ]);

        $this->assertSame([], $this->storedFiles());
    }

    public function test_publishing_makes_it_appear_in_the_public_builder(): void
    {
        $created = $this->create();

        $this->patchJson("/api/admin/bun-variants/{$created['id']}", ['isVisible' => true, 'name' => 'Australiano escuro'])
            ->assertOk()
            ->assertJsonPath('data.isVisible', true)
            ->assertJsonPath('data.name', 'Australiano escuro');

        $this->getJson('/api/builders/burger')->assertJsonPath('data.bunVariants.*.id', [$this->classic->id, $created['id']]);
    }

    public function test_replacing_one_image_keeps_the_other_and_removes_the_old_file(): void
    {
        $created = $this->create();
        $before = BunVariant::findOrFail($created['id']);

        $this->post("/api/admin/bun-variants/{$created['id']}", [
            '_method' => 'PATCH',
            'bottomImage' => UploadedFile::fake()->image('nova-base.png', 340, 150),
        ], ['Accept' => 'application/json'])
            ->assertOk()
            ->assertJsonPath('data.bottomImage.width', 340);

        $after = $before->fresh();
        $this->assertSame($before->top_image_path, $after->top_image_path);
        $this->assertNotSame($before->bottom_image_path, $after->bottom_image_path);
        $this->assertEqualsCanonicalizing([$after->top_image_path, $after->bottom_image_path], $this->storedFiles());
    }

    public function test_hiding_a_bun_makes_its_presets_unavailable(): void
    {
        $brioche = BunVariant::factory()->for($this->builder)->create(['sort_order' => 1]);
        $ingredient = Ingredient::factory()->for($this->builder)->create();
        $preset = Preset::factory()->for($this->builder)->for($brioche)->withIngredients([$ingredient])->create();

        $this->patchJson("/api/admin/bun-variants/{$brioche->id}", ['isVisible' => false])->assertOk();

        $this->getJson('/api/builders/burger')
            ->assertJsonPath('data.bunVariants.*.id', [$this->classic->id])
            ->assertJsonPath('data.presets', []);
        $this->getJson("/api/admin/presets/{$preset->id}")->assertJsonPath('data.isAvailable', false);
    }

    public function test_hiding_the_bun_of_the_initial_preset_starts_empty_on_another_bun(): void
    {
        $brioche = BunVariant::factory()->for($this->builder)->create(['sort_order' => 1]);
        $ingredient = Ingredient::factory()->for($this->builder)->create();
        $initial = Preset::factory()->for($this->builder)->for($brioche)->withIngredients([$ingredient])->create();
        $this->builder->initialPreset()->associate($initial)->save();

        $this->patchJson("/api/admin/bun-variants/{$brioche->id}", ['isVisible' => false])->assertOk();

        $this->getJson('/api/builders/burger')
            ->assertJsonPath('data.initialRecipe', ['bunVariantId' => $this->classic->id, 'ingredientIds' => []]);
    }

    public function test_the_last_visible_bun_cannot_be_hidden_or_deleted(): void
    {
        $this->patchJson("/api/admin/bun-variants/{$this->classic->id}", ['isVisible' => false])
            ->assertConflict()
            ->assertExactJson(['message' => 'O montador precisa de pelo menos um tipo de pão visível. Publique outro tipo de pão antes.']);

        $this->deleteJson("/api/admin/bun-variants/{$this->classic->id}")->assertConflict();

        $this->assertTrue($this->classic->fresh()->is_visible);
    }

    public function test_a_bun_used_by_presets_cannot_be_deleted(): void
    {
        BunVariant::factory()->for($this->builder)->create();
        $preset = Preset::factory()->for($this->builder)->for($this->classic)->create(['name' => 'Clássico']);

        $this->deleteJson("/api/admin/bun-variants/{$this->classic->id}")
            ->assertConflict()
            ->assertJsonPath('presets', [['id' => $preset->id, 'name' => 'Clássico']]);
    }

    public function test_it_deletes_an_unused_bun_and_both_images(): void
    {
        $created = $this->create();

        $this->deleteJson("/api/admin/bun-variants/{$created['id']}")->assertNoContent();

        $this->assertSame([], $this->storedFiles());
        $this->assertNull(BunVariant::find($created['id']));
    }

    public function test_it_shows_the_presets_that_use_a_bun(): void
    {
        $preset = Preset::factory()->for($this->builder)->for($this->classic)->create(['name' => 'Duplo']);

        $this->getJson("/api/admin/bun-variants/{$this->classic->id}")
            ->assertOk()
            ->assertJsonPath('data.presets', [['id' => $preset->id, 'name' => 'Duplo']]);
    }
}
