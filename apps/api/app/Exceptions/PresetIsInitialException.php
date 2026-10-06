<?php

namespace App\Exceptions;

use Illuminate\Http\JsonResponse;
use RuntimeException;

class PresetIsInitialException extends RuntimeException
{
    public function __construct()
    {
        parent::__construct('The initial preset of a builder cannot be deleted.');
    }

    public function render(): JsonResponse
    {
        return response()->json(['message' => __('api.preset_is_initial')], 409);
    }
}
