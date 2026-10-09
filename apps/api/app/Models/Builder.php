<?php

namespace App\Models;

use Database\Factories\BuilderFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['slug', 'name', 'max_layers'])]
class Builder extends Model
{
    /** @use HasFactory<BuilderFactory> */
    use HasFactory;

    protected function casts(): array
    {
        return [
            'max_layers' => 'integer',
        ];
    }

    public function bunVariants(): HasMany
    {
        return $this->hasMany(BunVariant::class)->orderBy('sort_order')->orderBy('id');
    }

    public function ingredients(): HasMany
    {
        return $this->hasMany(Ingredient::class)->orderBy('sort_order')->orderBy('id');
    }

    public function presets(): HasMany
    {
        return $this->hasMany(Preset::class)->orderBy('sort_order')->orderBy('id');
    }

    public function initialPreset(): BelongsTo
    {
        return $this->belongsTo(Preset::class, 'initial_preset_id');
    }
}
