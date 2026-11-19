<?php

namespace App\Services;

use App\Models\Medicine;
use App\Models\StockIn;
use App\Models\User;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class NotificationService
{
    public const LOW_STOCK_THRESHOLD = 50;

    public const EXPIRING_DAYS = 30;

    private const ALERT_TYPES = [
        'out_of_stock',
        'low_stock',
        'expiring',
        'expired',
    ];

    public static function syncStockAlerts(): void
    {
        $alerts = self::currentAlerts();

        $userIds = User::where('status', 'active')
            ->pluck('user_id');

        if ($userIds->isEmpty()) {
            return;
        }

        $now = now();
        $rows = [];

        foreach ($userIds as $userId) {
            foreach ($alerts as $alert) {
                $rows[] = [
                    'user_id' => $userId,
                    'type' => $alert['type'],
                    'title' => $alert['title'],
                    'message' => $alert['message'],
                    'link' => $alert['link'],
                    'dedupe_key' => $alert['key'],
                    'read_at' => null,
                    'created_at' => $now,
                ];
            }
        }

        DB::transaction(function () use ($rows, $alerts) {
            foreach (array_chunk($rows, 500) as $chunk) {
                DB::table('system_notifications')
                    ->insertOrIgnore($chunk);
            }

            $activeKeys = array_column($alerts, 'key');

            $state = DB::table('system_notifications')
                ->whereIn('type', self::ALERT_TYPES);

            if ($activeKeys) {
                $state->whereNotIn('dedupe_key', $activeKeys);
            }

            $state->delete();

            DB::table('system_notifications')
                ->whereNotNull('read_at')
                ->where('read_at', '<', now()->subDays(30))
                ->delete();
        });
    }

    public static function syncThrottled(): void
    {
        $key = 'stock-alerts-synced';

        if (! Cache::has($key)) {
            self::syncStockAlerts();

            Cache::put($key, true, 30);
        }
    }

    private static function currentAlerts(): array
    {
        $alerts = [];

        $medicineQuery = Medicine::queryWithAvailableStock();

        // Out of stock: no eligible batch stock.

        (clone $medicineQuery)
            ->whereNull('available_batches.medicine_id')
            ->orderBy('medicines.generic_name')
            ->get()
            ->each(function ($medicine) use (&$alerts) {
                $alerts[] = [
                    'type' => 'out_of_stock',
                    'key' => 'out_of_stock:'.$medicine->medicine_id,
                    'title' => 'Out of stock: '.$medicine->generic_name,
                    'message' => (
                        $medicine->brand_name
                            ? $medicine->brand_name.' — '
                            : ''
                    ).'0 units available.',
                    'link' => '/medicine-list?filter=outofstock',
                ];
            });

        // Low stock: 1 to 49 eligible units.

        (clone $medicineQuery)
            ->whereBetween(
                'available_batches.available_stock',
                [1, self::LOW_STOCK_THRESHOLD - 1],
            )
            ->orderBy('medicines.generic_name')
            ->get()
            ->each(function ($medicine) use (&$alerts) {
                $availableStock = (int) $medicine->available_stock;

                $alerts[] = [
                    'type' => 'low_stock',
                    'key' => 'low_stock:'.$medicine->medicine_id,
                    'title' => 'Low stock: '.$medicine->generic_name,
                    'message' => (
                        $medicine->brand_name
                            ? $medicine->brand_name.' — '
                            : ''
                    ).$availableStock.' units available.',
                    'link' => '/medicine-list?filter=lowstock',
                ];
            });

        // Expiring batches.

        StockIn::where('remaining_quantity', '>', 0)
            ->whereNull('disposed_at')
            ->whereDate('expiry_date', '>=', now()->toDateString())
            ->whereDate(
                'expiry_date',
                '<=',
                now()->addDays(self::EXPIRING_DAYS)->toDateString(),
            )
            ->with('medicine:medicine_id,generic_name,brand_name')
            ->orderBy('expiry_date')
            ->get()
            ->each(function ($batch) use (&$alerts) {
                $alerts[] = [
                    'type' => 'expiring',
                    'key' => 'expiring:'.$batch->stock_in_id,
                    'title' => 'Expiring soon: '.(
                        $batch->medicine->generic_name ?? 'Unknown'
                    ),
                    'message' => 'Batch '.$batch->batch_no.
                        ' expires '.$batch->expiry_date.'.',
                    'link' => '/medicine-list?filter=expiring',
                ];
            });

        // Already expired batches.

        StockIn::where('remaining_quantity', '>', 0)
            ->whereNull('disposed_at')
            ->whereDate('expiry_date', '<', now()->toDateString())
            ->with('medicine:medicine_id,generic_name,brand_name')
            ->orderBy('expiry_date')
            ->get()
            ->each(function ($batch) use (&$alerts) {
                $alerts[] = [
                    'type' => 'expired',
                    'key' => 'expired:'.$batch->stock_in_id,
                    'title' => 'Expired: '.(
                        $batch->medicine->generic_name ?? 'Unknown'
                    ),
                    'message' => 'Batch '.$batch->batch_no.
                        ' expired on '.$batch->expiry_date.'.',
                    'link' => '/medicine-list?filter=expired',
                ];
            });

        return $alerts;
    }
}
