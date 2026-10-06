<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('presets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('builder_id')->constrained()->restrictOnDelete();
            $table->foreignId('bun_variant_id')->constrained()->restrictOnDelete();
            $table->string('name', 100);
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();

            $table->unique(['builder_id', 'name']);
        });

        Schema::create('preset_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('preset_id')->constrained()->cascadeOnDelete();
            $table->foreignId('ingredient_id')->constrained()->restrictOnDelete();
            $table->unsignedTinyInteger('position');

            $table->unique(['preset_id', 'position']);
        });

        Schema::table('builders', function (Blueprint $table) {
            $table->foreign('initial_preset_id')->references('id')->on('presets')->restrictOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('builders', function (Blueprint $table) {
            $table->dropForeign(['initial_preset_id']);
        });

        Schema::dropIfExists('preset_items');
        Schema::dropIfExists('presets');
    }
};
