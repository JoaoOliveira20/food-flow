<?php

namespace App\Http\Requests\Admin;

use App\Models\Builder;
use Illuminate\Foundation\Http\FormRequest;

class StorePresetRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return PresetRules::for($this->builder(), ['required']);
    }

    public function messages(): array
    {
        return PresetRules::messages($this->builder());
    }

    private function builder(): Builder
    {
        return $this->route('builder');
    }
}
