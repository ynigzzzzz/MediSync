<?php

use App\Services\NotificationService;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Safety net: keep stock alerts current even if no one loads a page for days.
// The SyncStockAlerts middleware covers normal usage; this catches idle periods.
Schedule::call(fn () => NotificationService::syncStockAlerts())
    ->hourly()
    ->name('sync-stock-alerts')
    ->withoutOverlapping();
