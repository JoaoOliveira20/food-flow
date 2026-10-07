<?php

namespace App\Http\Requests\Admin;

use App\Models\Builder;
use Illuminate\Foundation\Http\FormRequest;

class StoreBunVariantRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        /** @var Builder $builder */
        $builder = $this->route('builder');

        return [
            'name' => ['required', 'string', 'max:100'],
            'slug' => ['sometimes', 'string', 'max:100', 'regex:'.IngredientRules::SLUG_PATTERN, BunVariantRules::uniqueSlug($builder)],
            'topImage' => ['required', IngredientRules::image()],
            'bottomImage' => ['required', IngredientRules::image()],
            'sortOrder' => ['sometimes', 'integer', 'min:0', 'max:65535'],
            'isVisible' => ['prohibited'],
        ];
    }

    public function messages(): array
    {
        return [
            ...BunVariantRules::messages(),
            'isVisible.prohibited' => 'Um tipo de pão novo começa oculto; publique-o depois de conferir o preview.',
        ];
    }
}
