<?php

namespace App\Http\Requests\Admin;

use App\Models\Builder;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Unique;

/**
 * Validation shared by bun variant creation and update (docs/BACKEND_DECISIONS.md BD-22).
 */
final class BunVariantRules
{
    public static function uniqueSlug(Builder $builder, ?int $ignoreBunVariantId = null): Unique
    {
        return Rule::unique('bun_variants', 'slug')
            ->where('builder_id', $builder->id)
            ->ignore($ignoreBunVariantId);
    }

    /**
     * @return array<string, string>
     */
    public static function messages(): array
    {
        $imageMessages = IngredientRules::messages();
        $messages = [];
        foreach (['topImage', 'bottomImage'] as $field) {
            foreach (['dimensions', 'max', 'mimes', 'extensions'] as $rule) {
                $messages["{$field}.{$rule}"] = $imageMessages["image.{$rule}"];
            }
        }

        return [...$messages, 'slug.regex' => $imageMessages['slug.regex']];
    }

    /**
     * @param  array<string, mixed>  $validated
     * @return array<string, mixed>
     */
    public static function toAttributes(array $validated): array
    {
        $columns = ['name' => 'name', 'slug' => 'slug', 'isVisible' => 'is_visible', 'sortOrder' => 'sort_order'];

        $attributes = [];
        foreach ($columns as $field => $column) {
            if (array_key_exists($field, $validated)) {
                $attributes[$column] = $validated[$field];
            }
        }

        return $attributes;
    }
}
