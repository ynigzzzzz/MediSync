<?php

namespace App\Services;

use App\Models\Medicine;
use App\Models\StockIn;

class StockAlertService
{
    public static function getAlerts(): array
    {
        $alerts = [];
        $today = now()->toDateString();

        $lowStockCount = Medicine::whereBetween('current_stock', [1, 49])->count();
        if ($lowStockCount > 0) {
            $alerts[] = [
                'type' => 'warning',
                'icon' => 'fa-triangle-exclamation',
                'message' => "{$lowStockCount} medicine(s) low on stock",
                'link' => '/medicine-list?filter=lowstock',
            ];
        }

        $outOfStockCount = Medicine::where('current_stock', 0)->count();
        if ($outOfStockCount > 0) {
            $alerts[] = [
                'type' => 'danger',
                'icon' => 'fa-circle-xmark',
                'message' => "{$outOfStockCount} medicine(s) out of stock",
                'link' => '/medicine-list?filter=outofstock',
            ];
        }

        $expiringSoonCount = StockIn::where('remaining_quantity', '>', 0)
            ->whereDate('expiry_date', '>=', $today)
            ->whereDate('expiry_date', '<=', now()->addDays(30)->toDateString())
            ->count();
        if ($expiringSoonCount > 0) {
            $alerts[] = [
                'type' => 'warning',
                'icon' => 'fa-hourglass-half',
                'message' => "{$expiringSoonCount} batch(es) expiring within 30 days",
                'link' => '/medicine-list?filter=expiring',
            ];
        }

        $expiredCount = StockIn::where('remaining_quantity', '>', 0)
            ->whereDate('expiry_date', '<', $today)
            ->count();
        if ($expiredCount > 0) {
            $alerts[] = [
                'type' => 'danger',
                'icon' => 'fa-ban',
                'message' => "{$expiredCount} expired batch(es) still in stock",
                'link' => '/medicine-list?filter=expired',
            ];
        }

        return $alerts;
    }
}
