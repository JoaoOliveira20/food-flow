<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\PresetRules;
use App\Http\Requests\Admin\StorePresetRequest;
use App\Http\Requests\Admin\UpdatePresetRequest;
use App\Http\Resources\Admin\PresetResource;
use App\Models\Builder;
use App\Models\Preset;
use App\Services\PresetService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

class PresetController extends Controller
{
    public function __construct(private readonly PresetService $presets) {}

    public function index(Builder $builder): AnonymousResourceCollection
    {
        $presets = $builder->presets()->with('items.ingredient')->get();
        $presets->each->setRelation('builder', $builder);

        return PresetResource::collection($presets);
    }

    public function store(StorePresetRequest $request, Builder $builder): JsonResponse
    {
        $validated = $request->validated();
        $preset = $this->presets->create($builder, PresetRules::toAttributes($validated), $validated['ingredientIds']);

        return $this->detail($preset)->response()->setStatusCode(201);
    }

    public function show(Preset $preset): PresetResource
    {
        return $this->detail($preset);
    }

    public function update(UpdatePresetRequest $request, Preset $preset): PresetResource
    {
        $validated = $request->validated();
        $preset = $this->presets->update($preset, PresetRules::toAttributes($validated), $validated['ingredientIds'] ?? null);

        return $this->detail($preset);
    }

    public function destroy(Preset $preset): Response
    {
        $this->presets->delete($preset);

        return response()->noContent();
    }

    private function detail(Preset $preset): PresetResource
    {
        return new PresetResource($preset->load(['builder', 'items.ingredient']));
    }
}
