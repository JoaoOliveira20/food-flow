<?php

namespace App\Media;

final readonly class StoredImage
{
    public function __construct(
        public string $path,
        public int $width,
        public int $height,
    ) {}
}
