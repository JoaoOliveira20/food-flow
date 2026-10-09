<?php

namespace App\Http\Requests\Admin;

use App\Models\Ingredient;
use Illuminate\Foundation\Http\FormRequest;

class UpdateIngredientRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        /** @var Ingredient $ingredient */
        $ingredient = $this->route('ingredient');
        $shape = IngredientRules::shape();

        return [
            'name' => ['sometimes', 'required', 'string', 'max:100'],
            'slug' => ['sometimes', 'required', 'string', 'max:100', 'regex:'.IngredientRules::SLUG_PATTERN, IngredientRules::uniqueSlug($ingredient->builder, $ingredient->id)],
            'image' => ['sometimes', 'required', IngredientRules::image()],
            'displayWidth' => ['sometimes', 'required', ...$shape['displayWidth']],
            'restingSurfaceRatio' => ['sometimes', 'required', ...$shape['restingSurfaceRatio']],
            'sinkRatio' => ['sometimes', 'required', ...$shape['sinkRatio']],
            'sortOrder' => ['sometimes', 'required', 'integer', 'min:0', 'max:65535'],
            'isVisible' => ['sometimes', 'required', 'boolean'],
        ];
    }

    public function messages(): array
    {
        return IngredientRules::messages();
    }
}
