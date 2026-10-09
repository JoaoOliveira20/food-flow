<?php

namespace App\Http\Requests\Admin;

use App\Models\Builder;
use Illuminate\Foundation\Http\FormRequest;

class StoreIngredientRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        /** @var Builder $builder */
        $builder = $this->route('builder');
        $shape = IngredientRules::shape();

        return [
            'name' => ['required', 'string', 'max:100'],
            'slug' => ['sometimes', 'string', 'max:100', 'regex:'.IngredientRules::SLUG_PATTERN, IngredientRules::uniqueSlug($builder)],
            'image' => ['required', IngredientRules::image()],
            'displayWidth' => ['required', ...$shape['displayWidth']],
            'restingSurfaceRatio' => ['required', ...$shape['restingSurfaceRatio']],
            'sinkRatio' => ['required', ...$shape['sinkRatio']],
            'sortOrder' => ['sometimes', 'integer', 'min:0', 'max:65535'],
            'isVisible' => ['prohibited'],
        ];
    }

    public function messages(): array
    {
        return [
            ...IngredientRules::messages(),
            'isVisible.prohibited' => 'Um ingrediente novo começa oculto; publique-o depois de conferir o preview.',
        ];
    }
}
