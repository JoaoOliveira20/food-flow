<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\Admin\BuilderResource;
use App\Models\Builder;
use Illuminate\Database\Eloquent\Builder as QueryBuilder;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class BuilderController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        $builders = Builder::query()
            ->withCount([
                'ingredients',
                'ingredients as visible_ingredients_count' => fn (QueryBuilder $query) => $query->where('is_visible', true),
                'presets',
                'bunVariants',
                'bunVariants as visible_bun_variants_count' => fn (QueryBuilder $query) => $query->where('is_visible', true),
            ])
            ->orderBy('name')
            ->get();

        return BuilderResource::collection($builders);
    }
}
