<?php

namespace App\Exceptions;

use Illuminate\Http\JsonResponse;
use RuntimeException;

class PresetIsInitialException extends RuntimeException
{
    private function __construct(string $message, private readonly string $translationKey)
    {
        parent::__construct($message);
    }

    public static function cannotBeDeleted(): self
    {
        return new self('The initial preset of a builder cannot be deleted.', 'api.preset_is_initial');
    }

    public static function cannotBeHidden(): self
    {
        return new self('The initial preset of a builder cannot be hidden.', 'api.initial_preset_hidden');
    }

    public function render(): JsonResponse
    {
        return response()->json(['message' => __($this->translationKey)], 409);
    }
}
