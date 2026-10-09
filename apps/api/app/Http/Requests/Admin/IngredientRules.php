<?php

namespace App\Http\Requests\Admin;

use App\Models\Builder;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\File;
use Illuminate\Validation\Rules\Unique;

/**
 * Validation shared by ingredient creation and update (docs/BACKEND_DECISIONS.md BD-04, BD-10).
 */
final class IngredientRules
{
    /** Width of the stack base in the builder renderer (apps/web STACK_BASE_WIDTH). */
    public const MAX_DISPLAY_WIDTH = 340;

    public const SLUG_PATTERN = '/^[a-z0-9]+(?:-[a-z0-9]+)*$/';

    public static function image(): File
    {
        $limits = config('media.images');

        return File::image()
            ->rules('mimes:'.implode(',', $limits['mimes']))
            ->extensions($limits['mimes'])
            ->max($limits['max_kilobytes'])
            ->dimensions(Rule::dimensions()
                ->minWidth($limits['min_width'])
                ->maxWidth($limits['max_side'])
                ->maxHeight($limits['max_side']));
    }

    public static function uniqueSlug(Builder $builder, ?int $ignoreIngredientId = null): Unique
    {
        return Rule::unique('ingredients', 'slug')
            ->where('builder_id', $builder->id)
            ->ignore($ignoreIngredientId);
    }

    /**
     * @return array<string, list<mixed>>
     */
    public static function shape(): array
    {
        return [
            'displayWidth' => ['integer', 'min:1', 'max:'.self::MAX_DISPLAY_WIDTH],
            'restingSurfaceRatio' => ['numeric', 'between:0,1', 'decimal:0,3'],
            'sinkRatio' => ['numeric', 'between:0,1', 'decimal:0,3'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public static function messages(): array
    {
        $limits = config('media.images');

        return [
            'image.dimensions' => "A imagem deve ter pelo menos {$limits['min_width']} px de largura e no máximo {$limits['max_side']} px em cada lado.",
            'image.max' => 'A imagem deve ter no máximo '.($limits['max_kilobytes'] / 1024).' MB.',
            'image.mimes' => 'A imagem deve ser PNG ou WebP (de preferência PNG com fundo transparente).',
            'image.extensions' => 'O nome do arquivo deve terminar em .png ou .webp.',
            'restingSurfaceRatio.decimal' => 'Use no máximo 3 casas decimais na superfície de apoio.',
            'sinkRatio.decimal' => 'Use no máximo 3 casas decimais no afundamento.',
            'slug.regex' => 'O identificador deve ter apenas letras minúsculas, números e hífens (ex.: queijo-prato).',
        ];
    }

    /**
     * @param  array<string, mixed>  $validated
     * @return array<string, mixed>
     */
    public static function toAttributes(array $validated): array
    {
        $columns = [
            'name' => 'name',
            'slug' => 'slug',
            'displayWidth' => 'display_width',
            'restingSurfaceRatio' => 'resting_surface_ratio',
            'sinkRatio' => 'sink_ratio',
            'isVisible' => 'is_visible',
            'sortOrder' => 'sort_order',
        ];

        $attributes = [];
        foreach ($columns as $field => $column) {
            if (array_key_exists($field, $validated)) {
                $attributes[$column] = $validated[$field];
            }
        }

        return $attributes;
    }
}
