<?php

namespace App\Http\Controllers;

use App\Models\Medicine;
use App\Models\StockIn;
use App\Models\StockOut;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        return Inertia::render('Dashboard/Index', [
            'stats' => [
                'totalMedicines' => Medicine::count(),
                'lowStockCount' => Medicine::whereBetween('current_stock', [1, 49])->count(),
                'outOfStockCount' => Medicine::where('current_stock', 0)->count(),
                'expiringSoonCount' => StockIn::whereDate('expiry_date', '<=', now()->addDays(30))
                    ->whereDate('expiry_date', '>=', now())
                    ->where('remaining_quantity', '>', 0)
                    ->count(),
                'dispensedToday' => StockOut::whereDate('dispensed_at', now()->toDateString())->sum('quantity'),
                'receivedToday' => StockIn::whereDate('recorded_at', now()->toDateString())->sum('quantity'),
            ],
            'recentActivity' => StockOut::with(['medicine:medicine_id,generic_name', 'dispensedBy:user_id,full_name'])
                ->orderByDesc('dispensed_at')
                ->limit(10)
                ->get(),
        ]);
    }
}
