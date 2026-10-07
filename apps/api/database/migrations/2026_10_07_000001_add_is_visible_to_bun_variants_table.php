<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bun_variants', function (Blueprint $table) {
            $table->boolean('is_visible')->default(false)->after('bottom_image_height');
            $table->index(['builder_id', 'is_visible', 'sort_order']);
        });

        DB::table('bun_variants')->update(['is_visible' => true]);
    }

    public function down(): void
    {
        Schema::table('bun_variants', function (Blueprint $table) {
            $table->dropIndex(['builder_id', 'is_visible', 'sort_order']);
            $table->dropColumn('is_visible');
        });
    }
};
