<?php

use App\Http\Controllers\ContactController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\MedicineCatalogController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\StockDispensingController;
use App\Http\Controllers\StockReceivingController;
use App\Http\Controllers\SupplierController;
use App\Http\Controllers\TransactionHistoryController;
use App\Http\Controllers\UserManagementController;
use App\Http\Middleware\EnsureUserIsActive;
use App\Http\Middleware\ForcePasswordChange;
use App\Http\Middleware\SyncStockAlerts;
use Illuminate\Support\Facades\Route;

Route::get('/', fn () => redirect()->route('login'));

Route::middleware([
    'auth',
    EnsureUserIsActive::class,
    SyncStockAlerts::class,
    ForcePasswordChange::class,
])->group(function () {

    // Dashboard
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

    // Medicine Catalog
    Route::resource('medicine-list', MedicineCatalogController::class)
        ->only(['index', 'store', 'update', 'destroy'])
        ->parameters(['medicine-list' => 'medicine']);
    Route::post('/medicine-list/dispose', [MedicineCatalogController::class, 'disposeBatches']);

    // Stock Receiving
    Route::resource('stock-receiving', StockReceivingController::class)
        ->only(['index', 'store', 'destroy'])
        ->parameters(['stock-receiving' => 'stockIn']);
    Route::post('/stock-receiving/dispose', [StockReceivingController::class, 'disposeBatches']);

    // Stock Dispensing
    Route::resource('dispensing', StockDispensingController::class)
        ->only(['index', 'store', 'destroy'])
        ->parameters(['dispensing' => 'stockOut']);
    Route::post('/dispensing/dispose-batches', [StockDispensingController::class, 'disposeBatches']);
    Route::get('/dispensing/unexpired-stock', [StockDispensingController::class, 'unexpiredStock']);

    // Transaction History
    Route::get('/transaction-history', [TransactionHistoryController::class, 'index'])->name('transaction-history.index');
    Route::get('/transaction-history/export', [TransactionHistoryController::class, 'exportCsv'])->name('transaction-history.export');
    Route::post('/transaction-history/dispose', [TransactionHistoryController::class, 'disposeBatches']);

    // Notifications
    Route::post('/notifications/read-all', [NotificationController::class, 'readAll'])->name('notifications.read-all');
    Route::post('/notifications/{notification}/read', [NotificationController::class, 'read'])->name('notifications.read');

    // Profile
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    // User Management
    Route::resource('user-management', UserManagementController::class)
        ->except(['create', 'edit', 'show'])
        ->parameters(['user-management' => 'user']);
    Route::post('/user-management/{user}/toggle-status', [UserManagementController::class, 'toggleStatus']);

    // Suppliers
    Route::resource('suppliers', SupplierController::class)
        ->only(['index', 'store', 'update', 'destroy'])
        ->parameters(['suppliers' => 'supplier']);

    // Reports
    Route::get('/reports', [ReportController::class, 'index'])->name('reports.index');
    Route::get('/reports/print', [ReportController::class, 'print'])->name('reports.print');

    // Contact
    Route::get('/contact', [ContactController::class, 'create'])->name('contact.index');
    Route::post('/contact', [ContactController::class, 'store'])->name('contact.store');
});

require __DIR__.'/auth.php';
