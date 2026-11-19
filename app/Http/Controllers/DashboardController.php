<?php

namespace App\Http\Controllers;

use App\Models\ContactMessage;
use App\Models\Medicine;
use App\Models\StockIn;
use App\Models\StockOut;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $today = now()->toDateString();
        $yesterday = now()->subDay()->toDateString();

        $medicineStats = Medicine::getStats();

        /*
        |--------------------------------------------------------------------------
        | Inventory Health
        |--------------------------------------------------------------------------
        | Total stock includes expired but undisposed stock.
        | Usable stock includes only unexpired, undisposed stock.
        */

        $inventoryTotals = StockIn::query()
            ->whereNull('disposed_at')
            ->where('remaining_quantity', '>', 0)
            ->selectRaw(
                'COALESCE(SUM(remaining_quantity), 0) AS total_stock',
            )
            ->selectRaw(
                'COALESCE(SUM(CASE WHEN expiry_date >= ? THEN remaining_quantity ELSE 0 END), 0) AS usable_stock',
                [$today],
            )
            ->first();

        $totalStock = (int) ($inventoryTotals->total_stock ?? 0);
        $usableStock = (int) ($inventoryTotals->usable_stock ?? 0);

        $inventoryHealth = [
            'percentage' => $totalStock > 0
                ? round(($usableStock / $totalStock) * 100, 1)
                : 0,
            'usableStock' => $usableStock,
            'totalStock' => $totalStock,
        ];

        /*
        |--------------------------------------------------------------------------
        | Category Breakdown
        |--------------------------------------------------------------------------
        | Counts medicine records per category, not individual stock units.
        */

        $categoryCounts = Medicine::query()
            ->select('category')
            ->selectRaw('COUNT(*) AS medicine_count')
            ->whereNotNull('category')
            ->whereRaw("TRIM(category) <> ''")
            ->groupBy('category')
            ->orderBy('category')
            ->get();

        $categorizedMedicineCount = (int) $categoryCounts->sum(
            'medicine_count',
        );

        $categoryColors = [
            '#2E7D64',
            '#FF4D79',
            '#E67E22',
            '#4F46E5',
            '#0EA5E9',
            '#A855F7',
            '#14B8A6',
            '#F59E0B',
        ];

        $categoryBreakdown = $categoryCounts
            ->values()
            ->map(function ($category, $index) use (
                $categoryColors,
                $categorizedMedicineCount
            ) {
                $count = (int) $category->medicine_count;

                return [
                    'name' => $category->category,
                    'value' => $count,
                    'percentage' => $categorizedMedicineCount > 0
                        ? round(
                            ($count / $categorizedMedicineCount) * 100,
                            1,
                        )
                        : 0,
                    'fill' => $categoryColors[
                        $index % count($categoryColors)
                    ],
                ];
            })
            ->all();

        /*
        |--------------------------------------------------------------------------
        | Dashboard Statistics
        |--------------------------------------------------------------------------
        */

        $stats = [
            'totalMedicines' => $medicineStats['total'],
            'lowStockCount' => $medicineStats['lowstock'],
            'outOfStockCount' => $medicineStats['outofstock'],
            'expiringSoonCount' => $medicineStats['expiring'],
            'expiredCount' => $medicineStats['expired'],

            'dispensedToday' => (int) StockOut::whereDate(
                'dispensed_at',
                $today,
            )->sum('quantity'),

            'receivedToday' => (int) StockIn::whereDate(
                'recorded_at',
                $today,
            )->sum('quantity'),

            'totalUsers' => User::where(
                'status',
                'active',
            )->count(),
        ];

        /*
        |--------------------------------------------------------------------------
        | Daily Trends
        |--------------------------------------------------------------------------
        */

        $trends = [
            'dispensed' => [
                'current' => $stats['dispensedToday'],
                'previous' => (int) StockOut::whereDate(
                    'dispensed_at',
                    $yesterday,
                )->sum('quantity'),
            ],

            'received' => [
                'current' => $stats['receivedToday'],
                'previous' => (int) StockIn::whereDate(
                    'recorded_at',
                    $yesterday,
                )->sum('quantity'),
            ],
        ];

        /*
        |--------------------------------------------------------------------------
        | Needs Attention
        |--------------------------------------------------------------------------
        */

        $attention = [];

        if ($stats['outOfStockCount'] > 0) {
            $attention[] = [
                'type' => 'danger',
                'icon' => 'fa-circle-xmark',
                'message' => "{$stats['outOfStockCount']} medicine(s) out of stock",
                'link' => '/medicine-list?filter=outofstock',
            ];
        }

        if ($stats['lowStockCount'] > 0) {
            $attention[] = [
                'type' => 'warning',
                'icon' => 'fa-triangle-exclamation',
                'message' => "{$stats['lowStockCount']} medicine(s) low on stock",
                'link' => '/medicine-list?filter=lowstock',
            ];
        }

        if ($stats['expiringSoonCount'] > 0) {
            $attention[] = [
                'type' => 'warning',
                'icon' => 'fa-hourglass-half',
                'message' => "{$stats['expiringSoonCount']} batch(es) expiring within 30 days",
                'link' => '/medicine-list?filter=expiring',
            ];
        }

        if ($stats['expiredCount'] > 0) {
            $attention[] = [
                'type' => 'danger',
                'icon' => 'fa-ban',
                'message' => "{$stats['expiredCount']} expired batch(es) still in stock",
                'link' => '/medicine-list?filter=expired',
            ];
        }

        if ($request->user()->role === 'admin') {
            $newContacts = ContactMessage::where(
                'submitted_at',
                '>=',
                now()->subDays(7),
            )->count();

            if ($newContacts > 0) {
                $attention[] = [
                    'type' => 'rose',
                    'icon' => 'fa-envelope',
                    'message' => "{$newContacts} new contact message(s) this week",
                    'link' => '/contact',
                ];
            }
        }

        /*
        |--------------------------------------------------------------------------
        | 30-Day Inventory Activity
        |--------------------------------------------------------------------------
        */

        $start = now()->subDays(29)->startOfDay();

        $receivedByDay = StockIn::where(
            'recorded_at',
            '>=',
            $start,
        )
            ->selectRaw('DATE(recorded_at) as d, SUM(quantity) as total')
            ->groupBy('d')
            ->pluck('total', 'd');

        $dispensedByDay = StockOut::where(
            'dispensed_at',
            '>=',
            $start,
        )
            ->selectRaw('DATE(dispensed_at) as d, SUM(quantity) as total')
            ->groupBy('d')
            ->pluck('total', 'd');

        $activity = [];

        for ($i = 29; $i >= 0; $i--) {
            $date = now()->subDays($i);
            $key = $date->toDateString();

            $activity[] = [
                'date' => $key,
                'label' => $date->format('M j'),
                'received' => (int) ($receivedByDay[$key] ?? 0),
                'dispensed' => (int) ($dispensedByDay[$key] ?? 0),
            ];
        }

        /*
        |--------------------------------------------------------------------------
        | Recent Dispensing Activity
        |--------------------------------------------------------------------------
        */

        $recentActivity = StockOut::with([
            'medicine:medicine_id,generic_name',
            'dispensedBy:user_id,full_name',
        ])
            ->orderByDesc('dispensed_at')
            ->limit(5)
            ->get();

        /*
        |--------------------------------------------------------------------------
        | Dashboard Response
        |--------------------------------------------------------------------------
        */

        return Inertia::render('Dashboard/Index', [
            'stats' => $stats,
            'trends' => $trends,
            'attention' => $attention,
            'activity' => $activity,
            'recentActivity' => $recentActivity,
            'categoryBreakdown' => $categoryBreakdown,
            'inventoryHealth' => $inventoryHealth,
        ]);
    }
}
