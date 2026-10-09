<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\BunVariantRules;
use App\Http\Requests\Admin\StoreBunVariantRequest;
use App\Http\Requests\Admin\UpdateBunVariantRequest;
use App\Http\Resources\Admin\BunVariantResource;
use App\Models\Builder;
use App\Models\BunVariant;
use App\Services\BunVariantService;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

class BunVariantController extends Controller
{
    public function __construct(private readonly BunVariantService $bunVariants) {}

    public function index(Builder $builder): AnonymousResourceCollection
    {
        return BunVariantResource::collection($builder->bunVariants()->withCount('presets')->get());
    }

    public function store(StoreBunVariantRequest $request, Builder $builder): JsonResponse
    {
        $bunVariant = $this->bunVariants->create(
            $builder,
            BunVariantRules::toAttributes($request->validated()),
            $request->file('topImage'),
            $request->file('bottomImage'),
        );

        return $this->detail($bunVariant)->response()->setStatusCode(201);
    }

    public function show(BunVariant $bunVariant): BunVariantResource
    {
        return $this->detail($bunVariant);
    }

    public function update(UpdateBunVariantRequest $request, BunVariant $bunVariant): BunVariantResource
    {
        $newImages = array_filter(['top' => $request->file('topImage'), 'bottom' => $request->file('bottomImage')]);
        $bunVariant = $this->bunVariants->update($bunVariant, BunVariantRules::toAttributes($request->validated()), $newImages);

        return $this->detail($bunVariant);
    }

    public function destroy(BunVariant $bunVariant): Response
    {
        $this->bunVariants->delete($bunVariant);

        return response()->noContent();
    }

    private function detail(BunVariant $bunVariant): BunVariantResource
    {
        return new BunVariantResource($bunVariant->load([
            'presets' => fn (HasMany $presets) => $presets->reorder()->orderBy('name')->select(['id', 'name', 'bun_variant_id']),
        ]));
    }
}
