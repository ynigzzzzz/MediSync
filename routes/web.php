<?php

use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DispensingController;
use App\Http\Controllers\MedicineListController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\StockInController;
use App\Http\Controllers\TransactionHistoryController;
use App\Http\Controllers\UserManagementController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ContactController;
use App\Http\Controllers\NotificationController;
use App\Http\Middleware\SyncStockAlerts;
use App\Http\Controllers\SupplierController;
use App\Http\Controllers\ReportController;

Route::get('/', function () {
    return redirect()->route('login');
});

Route::middleware(['auth', SyncStockAlerts::class])->group(function () {

    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

    // Medicine Catalog — literal paths, matching MedicineList/Index.jsx's
    // hardcoded fetch URLs ('/medicine-list', '/medicine-list/${id}').
    Route::get('/medicine-list', [MedicineListController::class, 'index'])->name('medicine-list.index');
    Route::post('/medicine-list', [MedicineListController::class, 'store']);
    Route::put('/medicine-list/{medicine}', [MedicineListController::class, 'update']);
    Route::delete('/medicine-list/{medicine}', [MedicineListController::class, 'destroy']);
    Route::post('/medicine-list/dispose', [MedicineListController::class, 'disposeBatches']);

    // Stock Receiving — named routes, matching route('stock-receiving.*')
    // calls already in StockReceiving/Index.jsx.
    Route::get('/stock-receiving', [StockInController::class, 'index'])->name('stock-receiving.index');
    Route::post('/stock-receiving', [StockInController::class, 'store'])->name('stock-receiving.store');
    Route::delete('/stock-receiving/{stockIn}', [StockInController::class, 'destroy'])->name('stock-receiving.destroy');
    Route::post('/stock-receiving/dispose', [StockInController::class, 'disposeBatches'])->name('stock-receiving.dispose');

    // Stock Dispensing — literal paths, matching Dispensing/Index.jsx.
    Route::get('/dispensing', [DispensingController::class, 'index'])->name('dispensing.index');
    Route::post('/dispensing', [DispensingController::class, 'store']);
    Route::delete('/dispensing/{stockOut}', [DispensingController::class, 'destroy']);
    Route::post('/dispensing/dispose-batches', [DispensingController::class, 'disposeBatches']);
    Route::post('/dispensing/dispose-expired', [DispensingController::class, 'disposeExpiredBatch']);
    Route::get('/dispensing/unexpired-stock', [DispensingController::class, 'unexpiredStock']);

    // Transaction History — named routes, matching TransactionHistory/Index.jsx.
    Route::get('/transaction-history', [TransactionHistoryController::class, 'index'])->name('transaction-history.index');
    Route::get('/transaction-history/export', [TransactionHistoryController::class, 'exportCsv'])->name('transaction-history.export');
    Route::post('/transaction-history/dispose', [TransactionHistoryController::class, 'disposeBatches'])->name('transaction-history.dispose');

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

    // Contact
    Route::get('/contact', [ContactController::class, 'create'])->name('contact.index');
    Route::post('/contact', [ContactController::class, 'store'])->name('contact.store');

    // Notifications
    Route::post('/notifications/read-all', [NotificationController::class, 'readAll'])->name('notifications.read-all');
    Route::post('/notifications/{notification}/read', [NotificationController::class, 'read'])->name('notifications.read');
        // Suppliers
    Route::get('/suppliers', [SupplierController::class, 'index'])->name('suppliers.index');
    Route::post('/suppliers', [SupplierController::class, 'store']);
    Route::put('/suppliers/{supplier}', [SupplierController::class, 'update']);
    Route::delete('/suppliers/{supplier}', [SupplierController::class, 'destroy']);
     // Reports
    Route::get('/reports', [ReportController::class, 'index'])->name('reports.index');

});

require __DIR__.'/auth.php';