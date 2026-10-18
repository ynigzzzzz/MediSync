<?php

namespace App\Http\Controllers;

use App\Models\ContactMessage;
use App\Models\Medicine;
use App\Models\StockIn;
use App\Models\StockOut;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $today     = now()->toDateString();
        $yesterday = now()->subDay()->toDateString();

        // ── Stat cards ──
        $stats = [
            'totalMedicines'    => Medicine::count(),
            'lowStockCount'     => Medicine::whereBetween('current_stock', [1, 49])->count(),
            'outOfStockCount'   => Medicine::where('current_stock', 0)->count(),
            'expiringSoonCount' => StockIn::where('remaining_quantity', '>', 0)
                ->whereDate('expiry_date', '>=', $today)
                ->whereDate('expiry_date', '<=', now()->addDays(30)->toDateString())
                ->count(),
            'dispensedToday'    => (int) StockOut::whereDate('dispensed_at', $today)->sum('quantity'),
            'receivedToday'     => (int) StockIn::whereDate('recorded_at', $today)->sum('quantity'),
        ];

        // ── Today vs yesterday, for the two daily cards only ──
        $trends = [
            'dispensed' => [
                'current'  => $stats['dispensedToday'],
                'previous' => (int) StockOut::whereDate('dispensed_at', $yesterday)->sum('quantity'),
            ],
            'received' => [
                'current'  => $stats['receivedToday'],
                'previous' => (int) StockIn::whereDate('recorded_at', $yesterday)->sum('quantity'),
            ],
        ];

        // ── Needs Attention rows ──
        $attention = [];

        if ($stats['outOfStockCount'] > 0) {
            $attention[] = [
                'type'    => 'danger',
                'icon'    => 'fa-circle-xmark',
                'message' => "{$stats['outOfStockCount']} medicine(s) out of stock",
                'link'    => '/medicine-list?filter=outofstock',
            ];
        }

        if ($stats['lowStockCount'] > 0) {
            $attention[] = [
                'type'    => 'warning',
                'icon'    => 'fa-triangle-exclamation',
                'message' => "{$stats['lowStockCount']} medicine(s) low on stock",
                'link'    => '/medicine-list?filter=lowstock',
            ];
        }

        $expiringBatches = StockIn::where('remaining_quantity', '>', 0)
            ->whereDate('expiry_date', '>=', $today)
            ->whereDate('expiry_date', '<=', now()->addDays(30)->toDateString())
            ->count();

        if ($expiringBatches > 0) {
            $attention[] = [
                'type'    => 'warning',
                'icon'    => 'fa-hourglass-half',
                'message' => "{$expiringBatches} batch(es) expiring within 30 days",
                'link'    => '/stock-receiving',
            ];
        }

        $expiredBatches = StockIn::where('remaining_quantity', '>', 0)
            ->whereDate('expiry_date', '<', $today)
            ->count();

        if ($expiredBatches > 0) {
            $attention[] = [
                'type'    => 'danger',
                'icon'    => 'fa-ban',
                'message' => "{$expiredBatches} expired batch(es) still in stock",
                'link'    => '/stock-receiving',
            ];
        }

        if ($request->user()->role === 'admin') {
            $newContacts = ContactMessage::where('submitted_at', '>=', now()->subDays(7))->count();
            if ($newContacts > 0) {
                $attention[] = [
                    'type'    => 'rose',
                    'icon'    => 'fa-envelope',
                    'message' => "{$newContacts} new contact message(s) this week",
                    'link'    => '/contact',
                ];
            }
        }

        // ── 14-day activity series (units received vs dispensed per day) ──
        $start = now()->subDays(13)->startOfDay();

        $receivedByDay = StockIn::where('recorded_at', '>=', $start)
            ->selectRaw('DATE(recorded_at) as d, SUM(quantity) as total')
            ->groupBy('d')
            ->pluck('total', 'd');

        $dispensedByDay = StockOut::where('dispensed_at', '>=', $start)
            ->selectRaw('DATE(dispensed_at) as d, SUM(quantity) as total')
            ->groupBy('d')
            ->pluck('total', 'd');

        $activity = [];
        for ($i = 13; $i >= 0; $i--) {
            $date  = now()->subDays($i);
            $key   = $date->toDateString();
            $activity[] = [
                'date'      => $key,
                'label'     => $date->format('M j'),
                'received'  => (int) ($receivedByDay[$key] ?? 0),
                'dispensed' => (int) ($dispensedByDay[$key] ?? 0),
            ];
        }

        // ── Recent dispensing (5 rows) ──
        $recentActivity = StockOut::with([
                'medicine:medicine_id,generic_name',
                'dispensedBy:user_id,full_name',
            ])
            ->orderByDesc('dispensed_at')
            ->limit(5)
            ->get();

        return Inertia::render('Dashboard/Index', [
            'stats'          => $stats,
            'trends'         => $trends,
            'attention'      => $attention,
            'activity'       => $activity,
            'recentActivity' => $recentActivity,
        ]);
    }
}