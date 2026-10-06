<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ingredients', function (Blueprint $table) {
            $table->id();
            $table->foreignId('builder_id')->constrained()->restrictOnDelete();
            $table->string('slug', 100);
            $table->string('name', 100);
            $table->string('image_path');
            $table->unsignedSmallInteger('image_width');
            $table->unsignedSmallInteger('image_height');
            $table->unsignedSmallInteger('display_width');
            $table->decimal('resting_surface_ratio', 4, 3);
            $table->decimal('sink_ratio', 4, 3);
            $table->boolean('is_visible')->default(false);
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();

            $table->unique(['builder_id', 'slug']);
            $table->index(['builder_id', 'is_visible', 'sort_order']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ingredients');
    }
};
