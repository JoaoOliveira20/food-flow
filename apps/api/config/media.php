<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Media Disk
    |--------------------------------------------------------------------------
    |
    | Filesystem disk that stores uploaded images. The database keeps only the
    | path relative to this disk, so switching to another disk (e.g. S3) is a
    | configuration change. See docs/BACKEND_DECISIONS.md (BD-09).
    |
    */

    'disk' => env('MEDIA_DISK', 'public'),

    'directories' => [
        'ingredients' => 'ingredients',
        'bun_variants' => 'bun-variants',
    ],

    /*
    |--------------------------------------------------------------------------
    | Image Rules
    |--------------------------------------------------------------------------
    |
    | Limits derived from the current assets (docs/ASSET_ANALYSIS.md, BD-10).
    |
    */

    'images' => [
        'mimes' => ['png', 'webp'],
        'max_kilobytes' => 2048,
        'min_width' => 280,
        'max_side' => 3000,
    ],

];
