<?php

use App\Http\Controllers\DashboardController;
use App\Http\Controllers\StockDispensingController;
use App\Http\Controllers\MedicineCatalogController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\StockReceivingController;
use App\Http\Controllers\TransactionHistoryController;
use App\Http\Controllers\UserManagementController;
use App\Http\Controllers\ContactController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\SupplierController;
use App\Http\Controllers\ReportController;
use App\Http\Middleware\SyncStockAlerts;
use App\Http\Middleware\EnsureUserIsActive;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return redirect()->route('login');
});

Route::middleware([
    'auth',
    EnsureUserIsActive::class,
    SyncStockAlerts::class
])->group(function () {

    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

    // Medicine Catalog
    Route::get('/medicine-list', [MedicineCatalogController::class, 'index'])->name('medicine-list.index');
    Route::post('/medicine-list', [MedicineCatalogController::class, 'store']);
    Route::put('/medicine-list/{medicine}', [MedicineCatalogController::class, 'update']);
    Route::delete('/medicine-list/{medicine}', [MedicineCatalogController::class, 'destroy']);
    Route::post('/medicine-list/dispose', [MedicineCatalogController::class, 'disposeBatches']);

    // Stock Receiving
    Route::get('/stock-receiving', [StockReceivingController::class, 'index'])->name('stock-receiving.index');
    Route::post('/stock-receiving', [StockReceivingController::class, 'store'])->name('stock-receiving.store');
    Route::delete('/stock-receiving/{stockIn}', [StockReceivingController::class, 'destroy'])->name('stock-receiving.destroy');
    Route::post('/stock-receiving/dispose', [StockReceivingController::class, 'disposeBatches'])->name('stock-receiving.dispose');

    // Stock Dispensing
    Route::get('/dispensing', [StockDispensingController::class, 'index'])->name('dispensing.index');
    Route::post('/dispensing', [StockDispensingController::class, 'store']);
    Route::delete('/dispensing/{stockOut}', [StockDispensingController::class, 'destroy']);
    Route::post('/dispensing/dispose-batches', [StockDispensingController::class, 'disposeBatches']);
    Route::post('/dispensing/dispose-expired', [StockDispensingController::class, 'disposeExpiredBatch']);
    Route::get('/dispensing/unexpired-stock', [StockDispensingController::class, 'unexpiredStock']);

    // Transaction History
    Route::get('/transaction-history', [TransactionHistoryController::class, 'index'])->name('transaction-history.index');
    Route::get('/transaction-history/export', [TransactionHistoryController::class, 'exportCsv'])->name('transaction-history.export');
    Route::post('/transaction-history/dispose', [TransactionHistoryController::class, 'disposeBatches'])->name('transaction-history.dispose');

    // Notifications
    Route::post('/notifications/read-all', [NotificationController::class, 'readAll'])->name('notifications.read-all');
    Route::post('/notifications/{notification}/read', [NotificationController::class, 'read'])->name('notifications.read');

    // Profile
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    // User Management
    Route::get('/user-management', [UserManagementController::class, 'index'])->name('user-management.index');
    Route::post('/user-management', [UserManagementController::class, 'store']);
    Route::put('/user-management/{user}', [UserManagementController::class, 'update']);
    Route::delete('/user-management/{user}', [UserManagementController::class, 'destroy']);
    Route::post('/user-management/{user}/toggle-status', [UserManagementController::class, 'toggleStatus']);

    // Suppliers
    Route::get('/suppliers', [SupplierController::class, 'index'])->name('suppliers.index');
    Route::post('/suppliers', [SupplierController::class, 'store']);
    Route::put('/suppliers/{supplier}', [SupplierController::class, 'update']);
    Route::delete('/suppliers/{supplier}', [SupplierController::class, 'destroy']);

    // Reports
    Route::get('/reports', [ReportController::class, 'index'])->name('reports.index');
    Route::get('/reports/print', [ReportController::class, 'print'])->name('reports.print');

    // Contact
    Route::get('/contact', [ContactController::class, 'create'])->name('contact.index');
    Route::post('/contact', [ContactController::class, 'store'])->name('contact.store');
});

require __DIR__.'/auth.php';