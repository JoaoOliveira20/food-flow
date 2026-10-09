<?php

namespace App\Exceptions;

use App\Models\Preset;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Collection;
use RuntimeException;

class IngredientInUseException extends RuntimeException
{
    /**
     * @param  Collection<int, Preset>  $presets
     */
    public function __construct(public readonly Collection $presets)
    {
        parent::__construct('The ingredient is used by presets.');
    }

    public function render(): JsonResponse
    {
        return response()->json([
            'message' => __('api.ingredient_in_use', ['presets' => $this->presets->pluck('name')->join(', ')]),
            'presets' => $this->presets->map(fn (Preset $preset) => ['id' => $preset->id, 'name' => $preset->name])->values(),
        ], 409);
    }
}
