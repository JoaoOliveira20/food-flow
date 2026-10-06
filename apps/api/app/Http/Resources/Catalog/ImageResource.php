<?php

namespace App\Http\Resources\Catalog;

use App\Media\ImageStorage;

final class ImageResource
{
    /**
     * @return array{url: string, width: int, height: int}
     */
    public static function make(string $path, int $width, int $height): array
    {
        return [
            'url' => app(ImageStorage::class)->url($path),
            'width' => $width,
            'height' => $height,
        ];
    }
}
