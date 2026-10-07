<?php

namespace App\Services;

use App\Exceptions\BunVariantInUseException;
use App\Exceptions\LastVisibleBunVariantException;
use App\Media\ImageStorage;
use App\Media\StoredImage;
use App\Models\Builder;
use App\Models\BunVariant;
use App\Models\Preset;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Throwable;

/**
 * Creates, updates and deletes bun variants keeping rows and both images consistent,
 * and never leaving the builder without a visible bun (docs/BACKEND_DECISIONS.md BD-22).
 */
class BunVariantService
{
    public function __construct(private readonly ImageStorage $images) {}

    /**
     * @param  array<string, mixed>  $attributes  Column values, without the images.
     */
    public function create(Builder $builder, array $attributes, UploadedFile $topImage, UploadedFile $bottomImage): BunVariant
    {
        $stored = $this->storeImages(['top' => $topImage, 'bottom' => $bottomImage]);

        return $this->withStoredImages($stored, fn () => DB::transaction(fn () => $builder->bunVariants()->create([
            ...$attributes,
            'slug' => $attributes['slug'] ?? $this->availableSlug($builder, $attributes['name']),
            'sort_order' => $attributes['sort_order'] ?? $this->nextSortOrder($builder),
            'is_visible' => false,
            ...$this->imageAttributes($stored),
        ])));
    }

    /**
     * @param  array<string, mixed>  $attributes  Column values, without the images.
     * @param  array<'top'|'bottom', UploadedFile>  $newImages
     */
    public function update(BunVariant $bunVariant, array $attributes, array $newImages = []): BunVariant
    {
        if (($attributes['is_visible'] ?? true) === false && $bunVariant->is_visible) {
            $this->ensureAnotherVisibleBunVariant($bunVariant);
        }

        $previousPaths = [];
        foreach (array_keys($newImages) as $position) {
            $previousPaths[] = $bunVariant->{"{$position}_image_path"};
        }
        $stored = $this->storeImages($newImages);

        $this->withStoredImages($stored, fn () => DB::transaction(
            fn () => $bunVariant->update([...$attributes, ...$this->imageAttributes($stored)]),
        ));

        array_map($this->deleteQuietly(...), $previousPaths);

        return $bunVariant;
    }

    public function delete(BunVariant $bunVariant): void
    {
        $presets = Preset::query()
            ->where('bun_variant_id', $bunVariant->id)
            ->orderBy('name')
            ->get(['id', 'name']);

        if ($presets->isNotEmpty()) {
            throw new BunVariantInUseException($presets);
        }

        if ($bunVariant->is_visible) {
            $this->ensureAnotherVisibleBunVariant($bunVariant);
        }

        $bunVariant->delete();
        $this->deleteQuietly($bunVariant->top_image_path);
        $this->deleteQuietly($bunVariant->bottom_image_path);
    }

    private function ensureAnotherVisibleBunVariant(BunVariant $bunVariant): void
    {
        $hasAnother = BunVariant::query()
            ->where('builder_id', $bunVariant->builder_id)
            ->whereKeyNot($bunVariant->id)
            ->visible()
            ->exists();

        if (! $hasAnother) {
            throw new LastVisibleBunVariantException;
        }
    }

    /**
     * @param  array<'top'|'bottom', UploadedFile>  $images
     * @return array<'top'|'bottom', StoredImage>
     */
    private function storeImages(array $images): array
    {
        $stored = [];
        try {
            foreach ($images as $position => $image) {
                $stored[$position] = $this->images->store($image, config('media.directories.bun_variants'));
            }
        } catch (Throwable $exception) {
            array_map(fn (StoredImage $image) => $this->deleteQuietly($image->path), $stored);

            throw $exception;
        }

        return $stored;
    }

    /**
     * @template T
     *
     * @param  array<'top'|'bottom', StoredImage>  $stored
     * @param  callable(): T  $work
     * @return T
     */
    private function withStoredImages(array $stored, callable $work): mixed
    {
        try {
            return $work();
        } catch (Throwable $exception) {
            array_map(fn (StoredImage $image) => $this->deleteQuietly($image->path), $stored);

            throw $exception;
        }
    }

    /**
     * @param  array<'top'|'bottom', StoredImage>  $stored
     * @return array<string, mixed>
     */
    private function imageAttributes(array $stored): array
    {
        $attributes = [];
        foreach ($stored as $position => $image) {
            $attributes["{$position}_image_path"] = $image->path;
            $attributes["{$position}_image_width"] = $image->width;
            $attributes["{$position}_image_height"] = $image->height;
        }

        return $attributes;
    }

    private function deleteQuietly(string $path): void
    {
        try {
            $this->images->delete($path);
        } catch (Throwable $exception) {
            Log::warning('Could not delete a bun variant image; it is now orphaned.', ['path' => $path, 'exception' => $exception]);
        }
    }

    private function availableSlug(Builder $builder, string $name): string
    {
        $base = Str::slug($name) ?: 'pao';
        $slug = $base;

        for ($suffix = 2; $builder->bunVariants()->where('slug', $slug)->exists(); $suffix++) {
            $slug = "{$base}-{$suffix}";
        }

        return $slug;
    }

    private function nextSortOrder(Builder $builder): int
    {
        $last = $builder->bunVariants()->reorder()->max('sort_order');

        return $last === null ? 0 : $last + 1;
    }
}
