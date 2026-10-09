<?php

namespace App\Http\Requests\Admin;

use App\Models\Builder;
use App\Models\Preset;
use Illuminate\Foundation\Http\FormRequest;

class UpdatePresetRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return PresetRules::for($this->builder(), ['sometimes', 'required'], $this->preset()->id);
    }

    public function messages(): array
    {
        return PresetRules::messages($this->builder());
    }

    private function preset(): Preset
    {
        return $this->route('preset');
    }

    private function builder(): Builder
    {
        return $this->preset()->builder;
    }
}
