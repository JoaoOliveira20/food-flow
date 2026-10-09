<?php

namespace App\Services;

use App\Exceptions\IngredientInUseException;
use App\Media\ImageStorage;
use App\Media\StoredImage;
use App\Models\Builder;
use App\Models\Ingredient;
use App\Models\Preset;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Throwable;

/**
 * Creates, updates and deletes ingredients keeping database rows and stored
 * images consistent (docs/BACKEND_DECISIONS.md BD-08, BD-15, BD-16).
 */
class IngredientService
{
    public function __construct(private readonly ImageStorage $images) {}

    /**
     * @param  array<string, mixed>  $attributes  Column values, without the image.
     */
    public function create(Builder $builder, array $attributes, UploadedFile $image): Ingredient
    {
        $stored = $this->storeImage($image);

        return $this->withStoredImage($stored, fn () => DB::transaction(fn () => $builder->ingredients()->create([
            ...$attributes,
            'slug' => $attributes['slug'] ?? $this->availableSlug($builder, $attributes['name']),
            'sort_order' => $attributes['sort_order'] ?? $this->nextSortOrder($builder),
            'is_visible' => false,
            ...$this->imageAttributes($stored),
        ])));
    }

    /**
     * @param  array<string, mixed>  $attributes  Column values, without the image.
     */
    public function update(Ingredient $ingredient, array $attributes, ?UploadedFile $image = null): Ingredient
    {
        if ($image === null) {
            $ingredient->update($attributes);

            return $ingredient;
        }

        $previousPath = $ingredient->image_path;
        $stored = $this->storeImage($image);

        $this->withStoredImage($stored, fn () => DB::transaction(
            fn () => $ingredient->update([...$attributes, ...$this->imageAttributes($stored)]),
        ));

        $this->deleteQuietly($previousPath);

        return $ingredient;
    }

    public function delete(Ingredient $ingredient): void
    {
        $presets = Preset::query()
            ->whereHas('items', fn ($items) => $items->where('ingredient_id', $ingredient->id))
            ->orderBy('name')
            ->get(['id', 'name']);

        if ($presets->isNotEmpty()) {
            throw new IngredientInUseException($presets);
        }

        $ingredient->delete();
        $this->deleteQuietly($ingredient->image_path);
    }

    private function storeImage(UploadedFile $image): StoredImage
    {
        return $this->images->store($image, config('media.directories.ingredients'));
    }

    /**
     * Runs the database work and removes the newly stored image if it fails,
     * so a failed request never leaves an orphan file.
     *
     * @template T
     *
     * @param  callable(): T  $work
     * @return T
     */
    private function withStoredImage(StoredImage $stored, callable $work): mixed
    {
        try {
            return $work();
        } catch (Throwable $exception) {
            $this->deleteQuietly($stored->path);

            throw $exception;
        }
    }

    /**
     * @return array<string, mixed>
     */
    private function imageAttributes(StoredImage $stored): array
    {
        return [
            'image_path' => $stored->path,
            'image_width' => $stored->width,
            'image_height' => $stored->height,
        ];
    }

    private function deleteQuietly(string $path): void
    {
        try {
            $this->images->delete($path);
        } catch (Throwable $exception) {
            Log::warning('Could not delete an ingredient image; it is now orphaned.', ['path' => $path, 'exception' => $exception]);
        }
    }

    private function availableSlug(Builder $builder, string $name): string
    {
        $base = Str::slug($name) ?: 'ingrediente';
        $slug = $base;

        for ($suffix = 2; $builder->ingredients()->where('slug', $slug)->exists(); $suffix++) {
            $slug = "{$base}-{$suffix}";
        }

        return $slug;
    }

    private function nextSortOrder(Builder $builder): int
    {
        $last = $builder->ingredients()->reorder()->max('sort_order');

        return $last === null ? 0 : $last + 1;
    }
}
