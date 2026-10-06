<?php

namespace App\Http\Requests\Admin;

use App\Models\Builder;
use Illuminate\Validation\Rule;

/**
 * Validation shared by preset creation and update (docs/BACKEND_DECISIONS.md BD-06, BD-13).
 */
final class PresetRules
{
    /**
     * @param  list<string>  $presence  Rules that come before each field ("required" or "sometimes", "required").
     * @return array<string, list<mixed>>
     */
    public static function for(Builder $builder, array $presence, ?int $ignorePresetId = null): array
    {
        return [
            'name' => [...$presence, 'string', 'max:100', Rule::unique('presets', 'name')->where('builder_id', $builder->id)->ignore($ignorePresetId)],
            'bunVariantId' => [...$presence, 'integer', Rule::exists('bun_variants', 'id')->where('builder_id', $builder->id)],
            'ingredientIds' => [...$presence, 'list', 'min:1', 'max:'.$builder->max_layers],
            'ingredientIds.*' => ['required', 'integer', Rule::exists('ingredients', 'id')->where('builder_id', $builder->id)],
            'sortOrder' => ['sometimes', 'required', 'integer', 'min:0', 'max:65535'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public static function messages(Builder $builder): array
    {
        return [
            'name.unique' => 'Já existe um preset com este nome.',
            'bunVariantId.exists' => 'O tipo de pão escolhido não pertence a este montador.',
            'ingredientIds.min' => 'Escolha pelo menos um ingrediente.',
            'ingredientIds.max' => "Um preset pode ter no máximo {$builder->max_layers} ingredientes.",
            'ingredientIds.*.exists' => 'Um dos ingredientes escolhidos não pertence a este montador.',
        ];
    }

    /**
     * @param  array<string, mixed>  $validated
     * @return array<string, mixed>
     */
    public static function toAttributes(array $validated): array
    {
        $columns = ['name' => 'name', 'bunVariantId' => 'bun_variant_id', 'sortOrder' => 'sort_order'];

        $attributes = [];
        foreach ($columns as $field => $column) {
            if (array_key_exists($field, $validated)) {
                $attributes[$column] = $validated[$field];
            }
        }

        return $attributes;
    }
}
