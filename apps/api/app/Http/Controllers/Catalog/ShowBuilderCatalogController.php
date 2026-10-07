<?php

namespace App\Http\Controllers\Catalog;

use App\Http\Controllers\Controller;
use App\Http\Resources\Catalog\BuilderCatalogResource;
use App\Models\Builder;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ShowBuilderCatalogController extends Controller
{
    public function __invoke(Builder $builder): BuilderCatalogResource
    {
        $builder->load([
            'bunVariants' => fn (HasMany $bunVariants) => $bunVariants->visible(),
            'ingredients' => fn (HasMany $ingredients) => $ingredients->visible(),
            'presets' => function (HasMany $presets) use ($builder) {
                $presets->available()->with('items');

                if ($builder->initial_preset_id !== null) {
                    $presets->whereKeyNot($builder->initial_preset_id);
                }
            },
            'initialPreset.bunVariant',
            'initialPreset.items.ingredient',
        ]);

        return new BuilderCatalogResource($builder);
    }
}
