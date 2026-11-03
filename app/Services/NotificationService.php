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

    private const ALERT_TYPES = ['out_of_stock', 'low_stock', 'expiring', 'expired'];

    public static function syncStockAlerts(): void
    {
        $alerts = self::currentAlerts();
        $userIds = User::where('status', 'active')->pluck('user_id');

        if ($userIds->isEmpty()) {
            return;
        }

        $now = now();
        $rows = [];

        foreach ($userIds as $userId) {
            foreach ($alerts as $a) {
                $rows[] = [
                    'user_id' => $userId,
                    'type' => $a['type'],
                    'title' => $a['title'],
                    'message' => $a['message'],
                    'link' => $a['link'],
                    'dedupe_key' => $a['key'],
                    'read_at' => null,
                    'created_at' => $now,
                ];
            }
        }

        DB::transaction(function () use ($rows, $alerts) {
            foreach (array_chunk($rows, 500) as $chunk) {
                DB::table('system_notifications')->insertOrIgnore($chunk);
            }

            $activeKeys = array_column($alerts, 'key');
            $state = DB::table('system_notifications')->whereIn('type', self::ALERT_TYPES);
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

        // Out of stock
        Medicine::where('current_stock', 0)
            ->orderBy('generic_name')
            ->get(['medicine_id', 'generic_name', 'brand_name'])
            ->each(function ($m) use (&$alerts) {
                $alerts[] = [
                    'type' => 'out_of_stock',
                    'key' => 'out_of_stock:'.$m->medicine_id,
                    'title' => 'Out of stock: '.$m->generic_name,
                    'message' => ($m->brand_name ? $m->brand_name.' — ' : '').'0 units remaining.',
                    'link' => '/medicine-list?filter=outofstock', // Correct link
                ];
            });

        // Low stock
        Medicine::whereBetween('current_stock', [1, self::LOW_STOCK_THRESHOLD - 1])
            ->orderBy('generic_name')
            ->get(['medicine_id', 'generic_name', 'brand_name', 'current_stock'])
            ->each(function ($m) use (&$alerts) {
                $alerts[] = [
                    'type' => 'low_stock',
                    'key' => 'low_stock:'.$m->medicine_id,
                    'title' => 'Low stock: '.$m->generic_name,
                    'message' => ($m->brand_name ? $m->brand_name.' — ' : '').$m->current_stock.' units remaining.',
                    'link' => '/medicine-list?filter=lowstock', // Correct link
                ];
            });

        // Expiring within 30 days
        StockIn::where('remaining_quantity', '>', 0)
            ->whereDate('expiry_date', '>=', now()->toDateString())
            ->whereDate('expiry_date', '<=', now()->addDays(self::EXPIRING_DAYS)->toDateString())
            ->with('medicine:medicine_id,generic_name,brand_name')
            ->get()
            ->each(function ($b) use (&$alerts) {
                $alerts[] = [
                    'type' => 'expiring',
                    'key' => 'expiring:'.$b->stock_in_id,
                    'title' => 'Expiring soon: '.($b->medicine->generic_name ?? 'Unknown'),
                    'message' => 'Batch '.$b->batch_no.' expires '.$b->expiry_date.'.',
                    'link' => '/medicine-list?filter=expiring', // Correct link
                ];
            });

        // Already expired
        StockIn::where('remaining_quantity', '>', 0)
            ->whereDate('expiry_date', '<', now()->toDateString())
            ->with('medicine:medicine_id,generic_name,brand_name')
            ->get()
            ->each(function ($b) use (&$alerts) {
                $alerts[] = [
                    'type' => 'expired',
                    'key' => 'expired:'.$b->stock_in_id,
                    'title' => 'Expired: '.($b->medicine->generic_name ?? 'Unknown'),
                    'message' => 'Batch '.$b->batch_no.' expired on '.$b->expiry_date.'.',
                    'link' => '/medicine-list?filter=expiring', // Points to expiring view which shows expired ones too
                ];
            });

        return $alerts;
    }
}
