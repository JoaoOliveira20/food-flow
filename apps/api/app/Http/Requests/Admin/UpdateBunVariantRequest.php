<?php

namespace App\Http\Requests\Admin;

use App\Models\BunVariant;
use Illuminate\Foundation\Http\FormRequest;

class UpdateBunVariantRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        /** @var BunVariant $bunVariant */
        $bunVariant = $this->route('bunVariant');

        return [
            'name' => ['sometimes', 'required', 'string', 'max:100'],
            'slug' => ['sometimes', 'required', 'string', 'max:100', 'regex:'.IngredientRules::SLUG_PATTERN, BunVariantRules::uniqueSlug($bunVariant->builder, $bunVariant->id)],
            'topImage' => ['sometimes', 'required', IngredientRules::image()],
            'bottomImage' => ['sometimes', 'required', IngredientRules::image()],
            'sortOrder' => ['sometimes', 'required', 'integer', 'min:0', 'max:65535'],
            'isVisible' => ['sometimes', 'required', 'boolean'],
        ];
    }

    public function messages(): array
    {
        return BunVariantRules::messages();
    }
}
