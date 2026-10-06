<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\IngredientRules;
use App\Http\Requests\Admin\StoreIngredientRequest;
use App\Http\Requests\Admin\UpdateIngredientRequest;
use App\Http\Resources\Admin\IngredientResource;
use App\Models\Builder;
use App\Models\Ingredient;
use App\Models\Preset;
use App\Models\PresetItem;
use App\Services\IngredientService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

class IngredientController extends Controller
{
    public function __construct(private readonly IngredientService $ingredients) {}

    public function index(Builder $builder): AnonymousResourceCollection
    {
        $ingredients = $builder->ingredients()
            ->addSelect(['presets_count' => PresetItem::query()
                ->selectRaw('count(distinct preset_id)')
                ->whereColumn('ingredient_id', 'ingredients.id')])
            ->get();

        return IngredientResource::collection($ingredients);
    }

    public function store(StoreIngredientRequest $request, Builder $builder): JsonResponse
    {
        $ingredient = $this->ingredients->create(
            $builder,
            IngredientRules::toAttributes($request->validated()),
            $request->file('image'),
        );

        return $this->detail($ingredient)->response()->setStatusCode(201);
    }

    public function show(Ingredient $ingredient): IngredientResource
    {
        return $this->detail($ingredient);
    }

    public function update(UpdateIngredientRequest $request, Ingredient $ingredient): IngredientResource
    {
        $ingredient = $this->ingredients->update(
            $ingredient,
            IngredientRules::toAttributes($request->validated()),
            $request->file('image'),
        );

        return $this->detail($ingredient);
    }

    public function destroy(Ingredient $ingredient): Response
    {
        $this->ingredients->delete($ingredient);

        return response()->noContent();
    }

    private function detail(Ingredient $ingredient): IngredientResource
    {
        $ingredient->setRelation('presets', Preset::query()
            ->whereHas('items', fn ($items) => $items->where('ingredient_id', $ingredient->id))
            ->orderBy('name')
            ->get(['id', 'name']));

        return new IngredientResource($ingredient);
    }
}
