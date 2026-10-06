<?php

namespace App\Media;

use Illuminate\Contracts\Filesystem\Factory as FilesystemFactory;
use Illuminate\Contracts\Filesystem\Filesystem;
use Illuminate\Http\File;
use Illuminate\Http\UploadedFile;
use RuntimeException;

class ImageStorage
{
    public function __construct(private readonly FilesystemFactory $filesystems) {}

    public function store(File|UploadedFile $image, string $directory): StoredImage
    {
        $size = @getimagesize($image->getRealPath());

        if ($size === false) {
            throw new RuntimeException('The file is not a readable image.');
        }

        $path = $this->disk()->putFile($directory, $image);

        if ($path === false) {
            throw new RuntimeException("Could not store the image in [{$directory}].");
        }

        return new StoredImage($path, $size[0], $size[1]);
    }

    public function url(string $path): string
    {
        return $this->disk()->url($path);
    }

    public function delete(string $path): void
    {
        $this->disk()->delete($path);
    }

    public function exists(string $path): bool
    {
        return $this->disk()->exists($path);
    }

    private function disk(): Filesystem
    {
        return $this->filesystems->disk(config('media.disk'));
    }
}
