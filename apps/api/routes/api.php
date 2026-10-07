<?php

use App\Http\Controllers\Admin\BuilderController as AdminBuilderController;
use App\Http\Controllers\Admin\BunVariantController as AdminBunVariantController;
use App\Http\Controllers\Admin\IngredientController as AdminIngredientController;
use App\Http\Controllers\Admin\PresetController as AdminPresetController;
use App\Http\Controllers\Catalog\ShowBuilderCatalogController;
use Illuminate\Support\Facades\Route;

/*
| Reads are made mostly by the Next.js server on behalf of every visitor, so they
| share one IP and get a high limit that only guards against overload. Writes come
| straight from each browser and get the strict limit (docs/BACKEND_DECISIONS.md BD-18).
*/

/*
| Public, read-only routes consumed by the builder. They expose only visible
| ingredients and available presets (BD-14).
*/
Route::middleware('throttle:api-reads')->group(function () {
    Route::get('builders/{builder:slug}', ShowBuilderCatalogController::class)->name('builders.show');
});

/*
| Management routes used by the admin. Single place to add authentication and
| authorization in the future (BD-20).
*/
Route::prefix('admin')->name('admin.')->group(function () {
    Route::middleware('throttle:api-reads')->group(function () {
        Route::get('builders', [AdminBuilderController::class, 'index'])->name('builders.index');
        Route::get('builders/{builder}/ingredients', [AdminIngredientController::class, 'index'])->name('ingredients.index');
        Route::get('ingredients/{ingredient}', [AdminIngredientController::class, 'show'])->name('ingredients.show');
        Route::get('builders/{builder}/presets', [AdminPresetController::class, 'index'])->name('presets.index');
        Route::get('presets/{preset}', [AdminPresetController::class, 'show'])->name('presets.show');
        Route::get('builders/{builder}/bun-variants', [AdminBunVariantController::class, 'index'])->name('bun-variants.index');
        Route::get('bun-variants/{bunVariant}', [AdminBunVariantController::class, 'show'])->name('bun-variants.show');
    });

    Route::middleware('throttle:admin-writes')->group(function () {
        Route::post('builders/{builder}/ingredients', [AdminIngredientController::class, 'store'])->name('ingredients.store');
        Route::patch('ingredients/{ingredient}', [AdminIngredientController::class, 'update'])->name('ingredients.update');
        Route::delete('ingredients/{ingredient}', [AdminIngredientController::class, 'destroy'])->name('ingredients.destroy');
        Route::post('builders/{builder}/presets', [AdminPresetController::class, 'store'])->name('presets.store');
        Route::patch('presets/{preset}', [AdminPresetController::class, 'update'])->name('presets.update');
        Route::delete('presets/{preset}', [AdminPresetController::class, 'destroy'])->name('presets.destroy');
        Route::post('builders/{builder}/bun-variants', [AdminBunVariantController::class, 'store'])->name('bun-variants.store');
        Route::patch('bun-variants/{bunVariant}', [AdminBunVariantController::class, 'update'])->name('bun-variants.update');
        Route::delete('bun-variants/{bunVariant}', [AdminBunVariantController::class, 'destroy'])->name('bun-variants.destroy');
    });
});
