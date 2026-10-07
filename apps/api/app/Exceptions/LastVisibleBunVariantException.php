<?php

namespace App\Exceptions;

use Illuminate\Http\JsonResponse;
use RuntimeException;

class LastVisibleBunVariantException extends RuntimeException
{
    public function __construct()
    {
        parent::__construct('A builder needs at least one visible bun variant.');
    }

    public function render(): JsonResponse
    {
        return response()->json(['message' => __('api.last_visible_bun_variant')], 409);
    }
}
