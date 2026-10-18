<?php

namespace App\Services;

use App\Models\Medicine;
use App\Models\StockIn;
use App\Models\User;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class NotificationService
{
    public const LOW_STOCK_THRESHOLD = 50;   // same threshold the pages use
    public const EXPIRING_DAYS = 30;         // same window the pages use

    private const ALERT_TYPES = ['out_of_stock', 'low_stock', 'expiring', 'expired'];

    /**
     * Work out which stock alerts are true right now, give every active user
     * a notification for each one they don't already have, and remove
     * alert notifications whose problem has since been fixed (so the same
     * alert can fire again if the problem comes back).
     */
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
                // ON CONFLICT DO NOTHING — the unique (user_id, dedupe_key)
                // index is what prevents duplicates.
                DB::table('system_notifications')->insertOrIgnore($chunk);
            }

            // Resolved alerts: problem no longer exists → remove the notification.
            $activeKeys = array_column($alerts, 'key');
            $stale = DB::table('system_notifications')->whereIn('type', self::ALERT_TYPES);
            if ($activeKeys) {
                $stale->whereNotIn('dedupe_key', $activeKeys);
            }
            $stale->delete();

            // Housekeeping: read notifications older than 30 days.
            DB::table('system_notifications')
                ->whereNotNull('read_at')
                ->where('read_at', '<', now()->subDays(30))
                ->delete();
        });
    }

    /**
     * Cheap guard for GET requests: re-check at most once every 30 seconds
     * (expiry dates change with the calendar, not just with edits).
     */
    public static function syncThrottled(int $seconds = 30): void
    {
        if (Cache::add('stock-alerts-synced', true, $seconds)) {
            self::syncStockAlerts();
        }
    }

    /** @return array<int, array{key:string,type:string,title:string,message:string,link:string}> */
    private static function currentAlerts(): array
    {
        $alerts = [];
        $today = now()->toDateString();
        $soon = now()->addDays(self::EXPIRING_DAYS)->toDateString();

        Medicine::select('medicine_id', 'generic_name', 'brand_name', 'current_stock')
            ->where('current_stock', '<', self::LOW_STOCK_THRESHOLD)
            ->get()
            ->each(function ($m) use (&$alerts) {
                $name = $m->brand_name ? "{$m->generic_name} ({$m->brand_name})" : $m->generic_name;

                if ($m->current_stock == 0) {
                    $alerts[] = [
                        'key' => "out_of_stock:{$m->medicine_id}",
                        'type' => 'out_of_stock',
                        'title' => 'Out of stock',
                        'message' => "{$name} is out of stock.",
                        'link' => '/medicine-list?filter=outofstock',
                    ];
                } else {
                    $alerts[] = [
                        'key' => "low_stock:{$m->medicine_id}",
                        'type' => 'low_stock',
                        'title' => 'Low stock',
                        'message' => "{$name} is running low on stock.",
                        'link' => '/medicine-list?filter=lowstock',
                    ];
                }
            });

        StockIn::with('medicine:medicine_id,generic_name,brand_name')
            ->where('remaining_quantity', '>', 0)
            ->whereDate('expiry_date', '<=', $soon)
            ->get()
            ->each(function ($b) use (&$alerts, $today) {
                $name = $b->medicine?->generic_name ?? 'A medicine';
                $expired = $b->expiry_date->toDateString() < $today;

                $alerts[] = [
                    'key' => ($expired ? 'expired' : 'expiring') . ":{$b->stock_in_id}",
                    'type' => $expired ? 'expired' : 'expiring',
                    'title' => $expired ? 'Batch expired' : 'Batch expiring soon',
                    'message' => $expired
                        ? "Batch {$b->batch_no} of {$name} has expired."
                        : "Batch {$b->batch_no} of {$name} expires on {$b->expiry_date->format('M d, Y')}.",
                    'link' => '/medicine-list',
                ];
            });

        return $alerts;
    }
}
