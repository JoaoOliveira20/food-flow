<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bun_variants', function (Blueprint $table) {
            $table->id();
            $table->foreignId('builder_id')->constrained()->restrictOnDelete();
            $table->string('slug', 100);
            $table->string('name', 100);
            $table->string('top_image_path');
            $table->unsignedSmallInteger('top_image_width');
            $table->unsignedSmallInteger('top_image_height');
            $table->string('bottom_image_path');
            $table->unsignedSmallInteger('bottom_image_width');
            $table->unsignedSmallInteger('bottom_image_height');
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();

            $table->unique(['builder_id', 'slug']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bun_variants');
    }
};
