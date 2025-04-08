<?php


use App\Http\Controllers\Api\InvoiceController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

Route::prefix('admin')->middleware(['auth', 'isAdmin'])->group(function () {
    // Admin routes for managing users, dropdowns, settings
   
});

Route::prefix('user')->middleware(['auth', 'isUser'])->group(function () {
    // User routes for invoices, print, view
    Route::middleware('auth')->group(function () {
       
        Route::resource('invoices',InvoiceController::class);
        Route::get('invoices/{invoice}/print', [InvoiceController::class, 'print'])->name('invoices.print');
        Route::get('invoices/{invoice}/download', [InvoiceController::class, 'download'])->name('invoices.download');

    });
});




