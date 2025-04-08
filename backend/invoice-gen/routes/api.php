<?php
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\InvoiceController;
use App\Http\Controllers\Api\Admin\UserController;
use App\Http\Controllers\Api\DropdownController;
use App\Http\Middleware\IsAdmin;

Route::post('/login', [AuthController::class, 'login']);
Route::post('/register', [AuthController::class, 'register']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);



    Route::prefix('admin')->middleware(['auth:sanctum','isAdmin'])->group(function () {
        Route::post('/users/{user}', [UserController::class, 'destroy']);


        Route::get('dropdowns/{type}', [DropdownController::class, 'index']);
        Route::post('dropdowns/{type}', [DropdownController::class, 'store']);
        Route::put('dropdowns/{id}', [DropdownController::class, 'update']);
        Route::delete('dropdowns/{id}', [DropdownController::class, 'destroy']);

    });


    Route::apiResource('invoices', InvoiceController::class);
    Route::get('invoices/{invoice}/print', [InvoiceController::class, 'print']);
    Route::get('invoices/{invoice}/download', [InvoiceController::class, 'download']);
});
