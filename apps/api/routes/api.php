<?php

use App\Http\Controllers\Admin\BuilderController as AdminBuilderController;
use Illuminate\Support\Facades\Route;

/*
| Public, read-only routes consumed by the builder. They expose only visible
| ingredients and available presets (docs/BACKEND_DECISIONS.md, BD-14).
*/
Route::middleware('throttle:public-api')->group(function () {
    //
});

/*
| Management routes used by the admin. Single place to add authentication and
| authorization in the future (BD-20).
*/
Route::prefix('admin')->name('admin.')->middleware('throttle:admin-api')->group(function () {
    Route::get('builders', [AdminBuilderController::class, 'index'])->name('builders.index');
});
