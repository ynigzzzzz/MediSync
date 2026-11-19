<?php

namespace App\Services;

use App\Models\Medicine;

class StockAlertService
{
    public static function getAlerts(?array $stats = null): array
    {
        // Reuse existing statistics when provided.
        // Otherwise, calculate them normally.
        $stats ??= Medicine::getStats();

        $alerts = [];

        if ($stats['lowstock'] > 0) {
            $alerts[] = [
                'type' => 'warning',
                'icon' => 'fa-triangle-exclamation',
                'message' => "{$stats['lowstock']} medicine(s) low on stock",
                'link' => '/medicine-list?filter=lowstock',
            ];
        }

        if ($stats['outofstock'] > 0) {
            $alerts[] = [
                'type' => 'danger',
                'icon' => 'fa-circle-xmark',
                'message' => "{$stats['outofstock']} medicine(s) out of stock",
                'link' => '/medicine-list?filter=outofstock',
            ];
        }

        if ($stats['expiring'] > 0) {
            $alerts[] = [
                'type' => 'warning',
                'icon' => 'fa-hourglass-half',
                'message' => "{$stats['expiring']} batch(es) expiring within 30 days",
                'link' => '/medicine-list?filter=expiring',
            ];
        }

        if ($stats['expired'] > 0) {
            $alerts[] = [
                'type' => 'danger',
                'icon' => 'fa-ban',
                'message' => "{$stats['expired']} expired batch(es) still in stock",
                'link' => '/medicine-list?filter=expired',
            ];
        }

        return $alerts;
    }
}
