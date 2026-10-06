<?php

namespace Tests\Feature\Api;

use App\Models\Builder;
use App\Models\Ingredient;
use App\Models\Preset;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Route;
use Tests\TestCase;

class ApiBehaviourTest extends TestCase
{
    use RefreshDatabase;

    public function test_unknown_routes_answer_with_json(): void
    {
        $this->get('/api/unknown')
            ->assertNotFound()
            ->assertJsonStructure(['message']);
    }

    public function test_missing_models_answer_with_a_translated_message(): void
    {
        Route::middleware('api')->get('/api/testing/builders/{builder}', fn (Builder $builder) => $builder);

        $this->getJson('/api/testing/builders/999')
            ->assertNotFound()
            ->assertExactJson(['message' => 'Recurso não encontrado.']);
    }

    public function test_cors_allows_only_the_frontend_origin(): void
    {
        $this->withHeaders(['Origin' => 'http://localhost:3000'])
            ->getJson('/api/admin/builders')
            ->assertHeader('Access-Control-Allow-Origin', 'http://localhost:3000');

        $response = $this->withHeaders(['Origin' => 'https://evil.example'])->getJson('/api/admin/builders');

        $this->assertNotSame('https://evil.example', $response->headers->get('Access-Control-Allow-Origin'));
    }

    public function test_reads_get_a_high_limit_and_admin_writes_a_strict_one(): void
    {
        $this->getJson('/api/admin/builders')
            ->assertOk()
            ->assertHeader('X-RateLimit-Limit', '600');

        $this->deleteJson('/api/admin/presets/999')
            ->assertNotFound()
            ->assertHeader('X-RateLimit-Limit', '60');
    }

    public function test_admin_writes_are_blocked_after_the_limit(): void
    {
        foreach (range(1, 60) as $attempt) {
            $this->deleteJson('/api/admin/presets/999')->assertNotFound();
        }

        $this->deleteJson('/api/admin/presets/999')->assertTooManyRequests();
        $this->getJson('/api/admin/builders')->assertOk();
    }

    public function test_the_admin_lists_builders_with_counts(): void
    {
        $builder = Builder::factory()->create(['slug' => 'burger', 'name' => 'Hambúrguer']);
        $ingredient = Ingredient::factory()->for($builder)->create();
        Ingredient::factory()->for($builder)->hidden()->create();
        Preset::factory()->for($builder)->withIngredients([$ingredient])->create();

        $this->getJson('/api/admin/builders')
            ->assertOk()
            ->assertExactJson(['data' => [[
                'id' => $builder->id,
                'slug' => 'burger',
                'name' => 'Hambúrguer',
                'maxLayers' => 14,
                'initialPresetId' => null,
                'ingredientsCount' => 2,
                'visibleIngredientsCount' => 1,
                'presetsCount' => 1,
            ]]]);
    }
}
