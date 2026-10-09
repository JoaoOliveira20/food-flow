<?php

namespace Tests\Feature\Admin;

use App\Models\Builder;
use App\Models\Ingredient;
use App\Models\Preset;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class IngredientManagementTest extends TestCase
{
    use RefreshDatabase;

    private Builder $builder;

    protected function setUp(): void
    {
        parent::setUp();

        config(['media.disk' => 'media-test']);
        Storage::fake('media-test');

        $this->builder = Builder::factory()->create(['slug' => 'burger']);
    }

    private function validPayload(array $overrides = []): array
    {
        return [
            'name' => 'Queijo prato',
            'image' => UploadedFile::fake()->image('queijo.png', 340, 160),
            'displayWidth' => 300,
            'restingSurfaceRatio' => 0.4,
            'sinkRatio' => 0.3,
            ...$overrides,
        ];
    }

    private function storedFiles(): array
    {
        return Storage::disk('media-test')->allFiles('ingredients');
    }

    public function test_it_lists_all_ingredients_of_the_builder_including_hidden_ones(): void
    {
        $visible = Ingredient::factory()->for($this->builder)->create(['sort_order' => 0]);
        $hidden = Ingredient::factory()->for($this->builder)->hidden()->create(['sort_order' => 1]);
        Ingredient::factory()->create();
        Preset::factory()->for($this->builder)->withIngredients([$visible, $visible])->create();
        Preset::factory()->for($this->builder)->withIngredients([$visible])->create();

        $this->getJson("/api/admin/builders/{$this->builder->id}/ingredients")
            ->assertOk()
            ->assertJsonPath('data.*.id', [$visible->id, $hidden->id])
            ->assertJsonPath('data.*.isVisible', [true, false])
            ->assertJsonPath('data.*.presetsCount', [2, 0]);
    }

    public function test_it_creates_a_hidden_ingredient_with_the_image_size_read_from_the_file(): void
    {
        $response = $this->postJson("/api/admin/builders/{$this->builder->id}/ingredients", $this->validPayload());

        $response->assertCreated()
            ->assertJsonPath('data.name', 'Queijo prato')
            ->assertJsonPath('data.slug', 'queijo-prato')
            ->assertJsonPath('data.isVisible', false)
            ->assertJsonPath('data.image.width', 340)
            ->assertJsonPath('data.image.height', 160)
            ->assertJsonPath('data.shape', ['displayWidth' => 300, 'restingSurfaceRatio' => 0.4, 'sinkRatio' => 0.3])
            ->assertJsonPath('data.presets', []);

        $ingredient = Ingredient::findOrFail($response->json('data.id'));
        $this->assertSame([$ingredient->image_path], $this->storedFiles());
        $this->assertSame(Storage::disk('media-test')->url($ingredient->image_path), $response->json('data.image.url'));
    }

    public function test_new_ingredients_do_not_reach_the_public_builder(): void
    {
        $this->postJson("/api/admin/builders/{$this->builder->id}/ingredients", $this->validPayload())->assertCreated();

        $this->getJson('/api/builders/burger')->assertJsonPath('data.ingredients', []);
    }

    public function test_it_generates_unique_slugs_and_appends_to_the_display_order(): void
    {
        Ingredient::factory()->for($this->builder)->create(['slug' => 'queijo-prato', 'sort_order' => 4]);

        $this->postJson("/api/admin/builders/{$this->builder->id}/ingredients", $this->validPayload())
            ->assertCreated()
            ->assertJsonPath('data.slug', 'queijo-prato-2')
            ->assertJsonPath('data.sortOrder', 5);
    }

    public function test_it_rejects_a_repeated_explicit_slug_in_the_same_builder_only(): void
    {
        Ingredient::factory()->for($this->builder)->create(['slug' => 'bacon']);
        Ingredient::factory()->create(['slug' => 'prato']);

        $this->postJson("/api/admin/builders/{$this->builder->id}/ingredients", $this->validPayload(['slug' => 'bacon']))
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['slug' => 'Já existe um registro com este identificador.']);

        $this->postJson("/api/admin/builders/{$this->builder->id}/ingredients", $this->validPayload(['slug' => 'prato']))
            ->assertCreated();
    }

    public function test_it_validates_required_fields_and_ranges_with_translated_messages(): void
    {
        $this->postJson("/api/admin/builders/{$this->builder->id}/ingredients", [
            'displayWidth' => 341,
            'restingSurfaceRatio' => 1.5,
            'sinkRatio' => 0.1234,
            'isVisible' => true,
        ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors([
                'name' => 'O campo nome é obrigatório.',
                'image' => 'O campo imagem é obrigatório.',
                'displayWidth' => 'O campo largura de exibição deve ser no máximo 340.',
                'restingSurfaceRatio' => 'O campo superfície de apoio deve estar entre 0 e 1.',
                'sinkRatio' => 'Use no máximo 3 casas decimais no afundamento.',
                'isVisible' => 'Um ingrediente novo começa oculto; publique-o depois de conferir o preview.',
            ]);

        $this->assertSame([], $this->storedFiles());
    }

    /**
     * An upload whose type is detected from its content, as in a real request
     * (UploadedFile::fake() reports the type from the file name instead).
     */
    private static function realUpload(string $name, string $content): UploadedFile
    {
        $path = tempnam(sys_get_temp_dir(), 'upload');
        file_put_contents($path, $content);

        return new UploadedFile($path, $name, null, null, true);
    }

    /**
     * @return array<string, array{0: callable(): UploadedFile, 1: string}>
     */
    public static function invalidImages(): array
    {
        return [
            'jpeg' => [fn () => UploadedFile::fake()->image('foto.jpg', 400, 200), 'A imagem deve ser PNG ou WebP (de preferência PNG com fundo transparente).'],
            'gif' => [fn () => UploadedFile::fake()->image('anim.gif', 400, 200), 'A imagem deve ser PNG ou WebP (de preferência PNG com fundo transparente).'],
            'svg' => [fn () => self::realUpload('logo.svg', '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>'), 'A imagem deve ser uma imagem.'],
            'text renamed to png' => [fn () => self::realUpload('fake.png', 'definitely not an image'), 'A imagem deve ser uma imagem.'],
            'php renamed to png' => [fn () => self::realUpload('shell.png', '<?php echo "hi";'), 'A imagem deve ser uma imagem.'],
            'png with another extension' => [fn () => self::realUpload('image.php', UploadedFile::fake()->image('real.png', 400, 200)->getContent()), 'O nome do arquivo deve terminar em .png ou .webp.'],
            'too narrow' => [fn () => UploadedFile::fake()->image('small.png', 279, 120), 'A imagem deve ter pelo menos 280 px de largura e no máximo 3000 px em cada lado.'],
            'too tall' => [fn () => UploadedFile::fake()->image('tall.png', 300, 3001), 'A imagem deve ter pelo menos 280 px de largura e no máximo 3000 px em cada lado.'],
            'too heavy' => [fn () => UploadedFile::fake()->image('heavy.png', 400, 200)->size(2049), 'A imagem deve ter no máximo 2 MB.'],
        ];
    }

    #[DataProvider('invalidImages')]
    public function test_it_rejects_invalid_images(callable $makeImage, string $message): void
    {
        $this->postJson("/api/admin/builders/{$this->builder->id}/ingredients", $this->validPayload(['image' => $makeImage()]))
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['image' => $message]);

        $this->assertSame([], $this->storedFiles());
        $this->assertSame(0, Ingredient::count());
    }

    public function test_it_accepts_webp_images(): void
    {
        $this->postJson("/api/admin/builders/{$this->builder->id}/ingredients", $this->validPayload([
            'image' => UploadedFile::fake()->image('alface.webp', 380, 200),
        ]))->assertCreated();

        $this->assertStringEndsWith('.webp', $this->storedFiles()[0]);
    }

    public function test_it_shows_an_ingredient_with_the_presets_that_use_it(): void
    {
        $ingredient = Ingredient::factory()->for($this->builder)->create();
        $preset = Preset::factory()->for($this->builder)->withIngredients([$ingredient])->create(['name' => 'Duplo']);

        $this->getJson("/api/admin/ingredients/{$ingredient->id}")
            ->assertOk()
            ->assertJsonPath('data.presets', [['id' => $preset->id, 'name' => 'Duplo']]);
    }

    public function test_it_updates_fields_partially_and_publishes(): void
    {
        $ingredient = Ingredient::factory()->for($this->builder)->hidden()->create(['name' => 'Tomate']);

        $this->patchJson("/api/admin/ingredients/{$ingredient->id}", ['displayWidth' => 280, 'isVisible' => true])
            ->assertOk()
            ->assertJsonPath('data.name', 'Tomate')
            ->assertJsonPath('data.shape.displayWidth', 280)
            ->assertJsonPath('data.isVisible', true);

        $this->getJson('/api/builders/burger')->assertJsonPath('data.ingredients.0.id', $ingredient->id);
    }

    public function test_hiding_an_ingredient_makes_its_presets_unavailable(): void
    {
        $ingredient = Ingredient::factory()->for($this->builder)->create();
        Preset::factory()->for($this->builder)->withIngredients([$ingredient])->create();

        $this->patchJson("/api/admin/ingredients/{$ingredient->id}", ['isVisible' => false])->assertOk();

        $this->getJson('/api/builders/burger')
            ->assertJsonPath('data.ingredients', [])
            ->assertJsonPath('data.presets', []);
    }

    public function test_replacing_the_image_removes_the_previous_file_only_after_saving(): void
    {
        $created = $this->postJson("/api/admin/builders/{$this->builder->id}/ingredients", $this->validPayload())->json('data');
        $previousPath = Ingredient::findOrFail($created['id'])->image_path;

        $this->post("/api/admin/ingredients/{$created['id']}", [
            '_method' => 'PATCH',
            'image' => UploadedFile::fake()->image('novo.png', 500, 230),
        ], ['Accept' => 'application/json'])
            ->assertOk()
            ->assertJsonPath('data.image.width', 500)
            ->assertJsonPath('data.image.height', 230);

        $currentPath = Ingredient::findOrFail($created['id'])->image_path;
        $this->assertNotSame($previousPath, $currentPath);
        $this->assertSame([$currentPath], $this->storedFiles());
    }

    public function test_a_rejected_replacement_keeps_the_current_image(): void
    {
        $created = $this->postJson("/api/admin/builders/{$this->builder->id}/ingredients", $this->validPayload())->json('data');
        $path = Ingredient::findOrFail($created['id'])->image_path;

        $this->post("/api/admin/ingredients/{$created['id']}", [
            '_method' => 'PATCH',
            'image' => UploadedFile::fake()->image('foto.jpg', 400, 200),
        ], ['Accept' => 'application/json'])->assertUnprocessable();

        $this->assertSame($path, Ingredient::findOrFail($created['id'])->image_path);
        $this->assertSame([$path], $this->storedFiles());
    }

    public function test_a_failed_save_removes_the_newly_stored_image(): void
    {
        $ingredient = Ingredient::factory()->for($this->builder)->create(['slug' => 'existing']);
        $other = Ingredient::factory()->for($this->builder)->create();
        Storage::disk('media-test')->put($other->image_path, 'old');

        Ingredient::updating(function (Ingredient $model) use ($other) {
            if ($model->is($other)) {
                throw new \RuntimeException('Database failure');
            }
        });

        $this->withoutExceptionHandling();

        try {
            $this->post("/api/admin/ingredients/{$other->id}", [
                '_method' => 'PATCH',
                'image' => UploadedFile::fake()->image('novo.png', 400, 200),
            ], ['Accept' => 'application/json']);
            $this->fail('The update should have failed.');
        } catch (\RuntimeException $exception) {
            $this->assertSame('Database failure', $exception->getMessage());
        }

        $this->assertSame([$other->image_path], $this->storedFiles());
        $this->assertSame($other->image_path, $other->fresh()->image_path);
        $this->assertTrue($ingredient->exists);
    }

    public function test_it_deletes_an_unused_ingredient_and_its_image(): void
    {
        $created = $this->postJson("/api/admin/builders/{$this->builder->id}/ingredients", $this->validPayload())->json('data');

        $this->deleteJson("/api/admin/ingredients/{$created['id']}")->assertNoContent();

        $this->assertSame(0, Ingredient::count());
        $this->assertSame([], $this->storedFiles());
    }

    public function test_it_refuses_to_delete_an_ingredient_used_by_presets(): void
    {
        $ingredient = Ingredient::factory()->for($this->builder)->create();
        $preset = Preset::factory()->for($this->builder)->withIngredients([$ingredient])->create(['name' => 'Bacon']);

        $this->deleteJson("/api/admin/ingredients/{$ingredient->id}")
            ->assertConflict()
            ->assertExactJson([
                'message' => 'Este ingrediente é usado nos presets: Bacon. Remova-o desses presets ou apenas oculte o ingrediente.',
                'presets' => [['id' => $preset->id, 'name' => 'Bacon']],
            ]);

        $this->assertModelExists($ingredient);
    }

    public function test_unknown_builders_and_ingredients_are_not_found(): void
    {
        $this->postJson('/api/admin/builders/999/ingredients', $this->validPayload())->assertNotFound();
        $this->patchJson('/api/admin/ingredients/999', ['name' => 'X'])->assertNotFound();
        $this->deleteJson('/api/admin/ingredients/999')->assertNotFound();
    }
}
