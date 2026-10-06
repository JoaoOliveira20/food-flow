<?php

use App\Http\Controllers\Admin\BuilderController as AdminBuilderController;
use App\Http\Controllers\Admin\IngredientController as AdminIngredientController;
use App\Http\Controllers\Catalog\ShowBuilderCatalogController;
use Illuminate\Support\Facades\Route;

/*
| Public, read-only routes consumed by the builder. They expose only visible
| ingredients and available presets (docs/BACKEND_DECISIONS.md, BD-14).
*/
Route::middleware('throttle:public-api')->group(function () {
    Route::get('builders/{builder:slug}', ShowBuilderCatalogController::class)->name('builders.show');
});

/*
| Management routes used by the admin. Single place to add authentication and
| authorization in the future (BD-20).
*/
Route::prefix('admin')->name('admin.')->middleware('throttle:admin-api')->group(function () {
    Route::get('builders', [AdminBuilderController::class, 'index'])->name('builders.index');

    Route::get('builders/{builder}/ingredients', [AdminIngredientController::class, 'index'])->name('ingredients.index');
    Route::post('builders/{builder}/ingredients', [AdminIngredientController::class, 'store'])->name('ingredients.store');
    Route::get('ingredients/{ingredient}', [AdminIngredientController::class, 'show'])->name('ingredients.show');
    Route::patch('ingredients/{ingredient}', [AdminIngredientController::class, 'update'])->name('ingredients.update');
    Route::delete('ingredients/{ingredient}', [AdminIngredientController::class, 'destroy'])->name('ingredients.destroy');
});
