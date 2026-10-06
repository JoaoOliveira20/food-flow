<?php

namespace Tests\Feature\Media;

use App\Media\ImageStorage;
use Illuminate\Http\File;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use RuntimeException;
use Tests\TestCase;

class ImageStorageTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        config(['media.disk' => 'media-test']);
        Storage::fake('media-test');
    }

    public function test_it_stores_an_upload_with_a_generated_name_and_its_natural_size(): void
    {
        $upload = UploadedFile::fake()->image('../../evil name.png', 400, 210);

        $image = app(ImageStorage::class)->store($upload, 'ingredients');

        $this->assertMatchesRegularExpression('#^ingredients/[A-Za-z0-9]{40}\.png$#', $image->path);
        $this->assertSame([400, 210], [$image->width, $image->height]);
        Storage::disk('media-test')->assertExists($image->path);
    }

    public function test_it_takes_the_extension_from_the_content_not_from_the_name(): void
    {
        $png = UploadedFile::fake()->image('real.png', 300, 160);
        $upload = new UploadedFile($png->getRealPath(), 'photo.webp', 'image/webp', null, true);

        $image = app(ImageStorage::class)->store($upload, 'ingredients');

        $this->assertStringEndsWith('.png', $image->path);
    }

    public function test_it_stores_a_local_file(): void
    {
        $source = UploadedFile::fake()->image('seed.png', 320, 180);

        $image = app(ImageStorage::class)->store(new File($source->getRealPath()), 'bun-variants');

        $this->assertStringStartsWith('bun-variants/', $image->path);
        Storage::disk('media-test')->assertExists($image->path);
    }

    public function test_it_rejects_a_file_that_is_not_an_image(): void
    {
        $upload = UploadedFile::fake()->createWithContent('fake.png', 'not an image');

        $this->expectException(RuntimeException::class);

        app(ImageStorage::class)->store($upload, 'ingredients');
    }

    public function test_it_builds_the_public_url_and_deletes_files(): void
    {
        $storage = app(ImageStorage::class);
        $image = $storage->store(UploadedFile::fake()->image('x.png', 300, 150), 'ingredients');

        $this->assertSame(Storage::disk('media-test')->url($image->path), $storage->url($image->path));

        $storage->delete($image->path);

        $this->assertFalse($storage->exists($image->path));
    }
}
