<?php

namespace App\Http\Controllers;

use App\Models\Medicine;
use App\Models\StockIn;
use App\Models\StockOut;
use App\Models\Supplier;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class ReportController extends Controller
{
    public function index(Request $request)
    {
        abort_unless($request->user()->role === 'admin', 403, 'Only administrators can access Reports.');

        $from = $request->query('from') ?: now()->subDays(29)->toDateString();
        $to = $request->query('to') ?: now()->toDateString();
        $category = $request->query('category', 'all');
        $supplierId = $request->query('supplier_id', 'all');
        $userId = $request->query('user_id', 'all');

        // ── Overall Summary (All-Time) ──
        $totalRevenue = (float) StockOut::select(DB::raw('COALESCE(SUM(total_amount), 0) as v'))->value('v');

        // Calculate COGS (Cost of Goods Sold) safely
        $cogs = (float) DB::table('stock_out')
            ->leftJoin('stock_in', 'stock_out.stock_in_id', '=', 'stock_in.stock_in_id')
            ->join('medicines', 'stock_out.medicine_id', '=', 'medicines.medicine_id')
            ->select(DB::raw('COALESCE(SUM(stock_out.quantity * COALESCE(stock_in.cost_price, (medicines.price * 0.6))), 0) as v'))
            ->value('v');

        $overall = [
            'total_revenue' => $totalRevenue,
            'total_spent' => (float) StockIn::select(DB::raw('COALESCE(SUM(quantity * cost_price), 0) as v'))->value('v'),
            'profit' => $totalRevenue - $cogs,
            'total_received_units' => (int) StockIn::sum('quantity'),
            'total_dispensed_units' => (int) StockOut::sum('quantity'),
        ];

        $overall['top_medicines'] = StockOut::join('medicines as m', 'stock_out.medicine_id', '=', 'm.medicine_id')
            ->select('m.generic_name', DB::raw('SUM(stock_out.quantity) as units'))
            ->groupBy('m.generic_name')
            ->orderByDesc('units')
            ->limit(5)
            ->get()
            ->map(fn ($r) => [
                'name' => $r->generic_name,
                'value' => (int) $r->units,
            ]);

        // ── Inventory ──
        $invQuery = Medicine::query();
        if ($category !== 'all') {
            $invQuery->where('category', $category);
        }

        $inventory = [
            'total_medicines' => (clone $invQuery)->count(),
            'low_stock' => (clone $invQuery)->whereBetween('current_stock', [1, 49])->count(),
            'out_of_stock' => (clone $invQuery)->where('current_stock', 0)->count(),
            'valuation' => (float) (clone $invQuery)->select(DB::raw('COALESCE(SUM(current_stock * price), 0) as v'))->value('v'),
        ];

        $inventory['status_distribution'] = [
            ['name' => 'OK',           'value' => (clone $invQuery)->where('current_stock', '>=', 50)->count()],
            ['name' => 'Low Stock',    'value' => (clone $invQuery)->whereBetween('current_stock', [1, 49])->count()],
            ['name' => 'Out of Stock', 'value' => (clone $invQuery)->where('current_stock', 0)->count()],
        ];

        $inventory['rows'] = (clone $invQuery)->orderBy('generic_name')
            ->get(['medicine_id', 'generic_name', 'brand_name', 'dosage', 'current_stock', 'price', 'category'])
            ->map(fn ($m) => [
                'medicine_id' => $m->medicine_id,
                'generic_name' => $m->generic_name,
                'brand_name' => $m->brand_name,
                'dosage' => $m->dosage,
                'category' => $m->category,
                'current_stock' => (int) $m->current_stock,
                'price' => (float) $m->price,
                'stock_value' => (float) $m->current_stock * (float) $m->price,
                'status' => $m->current_stock === 0 ? 'out' : ($m->current_stock < 50 ? 'low' : 'ok'),
            ]);

        $inventory['categories'] = Medicine::distinct()->pluck('category')->filter()->values();

        // ── Receiving ──
        $recvQuery = StockIn::whereDate('recorded_at', '>=', $from)->whereDate('recorded_at', '<=', $to);
        if ($supplierId !== 'all') {
            $recvQuery->where('supplier_id', $supplierId);
        }

        $receiving = [
            'total_batches' => (clone $recvQuery)->count(),
            'total_units' => (int) (clone $recvQuery)->sum('quantity'),
            'total_cost' => (float) (clone $recvQuery)->select(DB::raw('COALESCE(SUM(quantity * cost_price), 0) as v'))->value('v'),
        ];

        $receiving['by_supplier'] = (clone $recvQuery)
            ->select('supplier', DB::raw('COUNT(*) as batches'), DB::raw('SUM(quantity) as units'), DB::raw('COALESCE(SUM(quantity * cost_price), 0) as cost'))
            ->groupBy('supplier')
            ->orderByDesc('units')
            ->get()
            ->map(fn ($r) => [
                'supplier' => $r->supplier ?: '—',
                'batches' => (int) $r->batches,
                'units' => (int) $r->units,
                'cost' => (float) $r->cost,
            ]);

        $receiving['by_medicine'] = (clone $recvQuery)
            ->join('medicines as m', 'stock_in.medicine_id', '=', 'm.medicine_id')
            ->select('m.generic_name', 'm.brand_name', DB::raw('SUM(stock_in.quantity) as units'))
            ->groupBy('m.generic_name', 'm.brand_name')
            ->orderByDesc('units')
            ->limit(10)
            ->get()
            ->map(fn ($r) => [
                'name' => $r->generic_name.($r->brand_name ? " ({$r->brand_name})" : ''),
                'units' => (int) $r->units,
            ]);

        $receiving['daily'] = $this->dailySeries('stock_in', 'recorded_at', 'quantity', $from, $to);
        $receiving['suppliers_list'] = Supplier::orderBy('name')->get(['supplier_id', 'name']);

        // ── Dispensing ──
        $dispQuery = StockOut::whereDate('dispensed_at', '>=', $from)->whereDate('dispensed_at', '<=', $to);
        if ($userId !== 'all') {
            $dispQuery->where('dispensed_by', $userId);
        }

        $dispensing = [
            'total_records' => (clone $dispQuery)->count(),
            'total_units' => (int) (clone $dispQuery)->sum('quantity'),
            'total_value' => (float) (clone $dispQuery)->select(DB::raw('COALESCE(SUM(total_amount), 0) as v'))->value('v'),
        ];

        $dispensing['by_medicine'] = (clone $dispQuery)
            ->join('medicines as m', 'stock_out.medicine_id', '=', 'm.medicine_id')
            ->select('m.generic_name', 'm.brand_name', DB::raw('SUM(stock_out.quantity) as units'))
            ->groupBy('m.generic_name', 'm.brand_name')
            ->orderByDesc('units')
            ->limit(10)
            ->get()
            ->map(fn ($r) => [
                'name' => $r->generic_name.($r->brand_name ? " ({$r->brand_name})" : ''),
                'units' => (int) $r->units,
            ]);

        $dispensing['by_user'] = (clone $dispQuery)
            ->join('users as u', 'stock_out.dispensed_by', '=', 'u.user_id')
            ->select('u.full_name', DB::raw('COUNT(*) as records'), DB::raw('SUM(stock_out.quantity) as units'))
            ->groupBy('u.full_name')
            ->orderByDesc('units')
            ->get()
            ->map(fn ($r) => [
                'user' => $r->full_name,
                'records' => (int) $r->records,
                'units' => (int) $r->units,
            ]);

        $dispensing['daily'] = $this->dailySeries('stock_out', 'dispensed_at', 'quantity', $from, $to);
        $dispensing['users_list'] = User::where('role', '!=', 'admin')->orderBy('full_name')->get(['user_id', 'full_name']);

        // ── Suppliers ──
        $supplierSummary = Supplier::orderBy('name')->get(['supplier_id', 'name', 'contact_person', 'phone', 'email', 'status'])
            ->map(function ($s) {
                $in = StockIn::where('supplier_id', $s->supplier_id)
                    ->select(DB::raw('COUNT(*) as batches'), DB::raw('COALESCE(SUM(quantity), 0) as units'), DB::raw('COALESCE(SUM(quantity * cost_price), 0) as cost'))
                    ->first();

                return [
                    'supplier_id' => $s->supplier_id,
                    'name' => $s->name,
                    'contact_person' => $s->contact_person,
                    'phone' => $s->phone,
                    'email' => $s->email,
                    'status' => $s->status,
                    'batches' => (int) ($in->batches ?? 0),
                    'units' => (int) ($in->units ?? 0),
                    'cost' => (float) ($in->cost ?? 0),
                ];
            });

        // ── Deletions ──
        $deletionsQuery = DB::table('audit_log')
            ->leftJoin('users as u', 'audit_log.user_id', '=', 'u.user_id')
            ->whereIn('audit_log.action_type', ['DELETE_STOCK_IN', 'DELETE_STOCK_OUT'])
            ->whereDate('audit_log.created_at', '>=', $from)
            ->whereDate('audit_log.created_at', '<=', $to)
            ->select(
                'audit_log.log_id',
                'audit_log.action_type',
                'audit_log.description',
                'audit_log.reason',
                'audit_log.created_at',
                'u.full_name as user_name',
            );

        $deletions = [
            'total' => (clone $deletionsQuery)->count(),
            'rows' => (clone $deletionsQuery)
                ->orderByDesc('audit_log.created_at')
                ->limit(500)
                ->get()
                ->map(fn ($r) => [
                    'log_id' => $r->log_id,
                    'type' => $r->action_type === 'DELETE_STOCK_IN' ? 'Stock-In' : 'Stock-Out',
                    'description' => $r->description,
                    'reason' => $r->reason ?? '—',
                    'user_name' => $r->user_name ?? 'System',
                    'created_at' => $r->created_at,
                ]),
        ];

        return Inertia::render('Reports/Index', [
            'deletions' => $deletions,
            'inventory' => $inventory,
            'receiving' => $receiving,
            'dispensing' => $dispensing,
            'supplierSummary' => $supplierSummary,
            'overall' => $overall,
            'range' => ['from' => $from, 'to' => $to],
            'filters' => [
                'category' => $category,
                'supplier_id' => $supplierId,
                'user_id' => $userId,
            ],
        ]);
    }

    private function dailySeries(string $table, string $dateCol, string $valueCol, string $from, string $to): array
    {
        $rows = DB::table($table)
            ->whereDate($dateCol, '>=', $from)
            ->whereDate($dateCol, '<=', $to)
            ->select(DB::raw("DATE({$dateCol}) as d"), DB::raw("COALESCE(SUM({$valueCol}), 0) as v"))
            ->groupBy('d')
            ->orderBy('d')
            ->get()
            ->keyBy('d');

        $series = [];
        $cursor = Carbon::parse($from)->startOfDay();
        $end = Carbon::parse($to)->startOfDay();
        while ($cursor->lte($end)) {
            $key = $cursor->toDateString();
            $series[] = [
                'date' => $key,
                'label' => $cursor->format('M j'),
                'value' => (int) ($rows[$key]->v ?? 0),
            ];
            $cursor->addDay();
        }

        return $series;
    }

    public function print(Request $request)
    {
        abort_unless($request->user()->role === 'admin', 403);

        $from = $request->query('from') ?: now()->subDays(29)->toDateString();
        $to = $request->query('to') ?: now()->toDateString();
        $tab = $request->query('tab', 'inventory');

        $medicines = Medicine::orderBy('generic_name')->get(['generic_name', 'brand_name', 'dosage', 'current_stock', 'price']);
        $receivingRows = StockIn::whereDate('recorded_at', '>=', $from)->whereDate('recorded_at', '<=', $to)
            ->select('supplier', DB::raw('COUNT(*) as batches'), DB::raw('SUM(quantity) as units'), DB::raw('COALESCE(SUM(quantity * cost_price), 0) as cost'))
            ->groupBy('supplier')->orderByDesc('units')->get();
        $dispensingRows = StockOut::whereDate('dispensed_at', '>=', $from)->whereDate('dispensed_at', '<=', $to)
            ->join('medicines as m', 'stock_out.medicine_id', '=', 'm.medicine_id')
            ->select('m.generic_name', 'm.brand_name', DB::raw('SUM(stock_out.quantity) as units'))
            ->groupBy('m.generic_name', 'm.brand_name')->orderByDesc('units')->get();
        $suppliers = Supplier::orderBy('name')->get(['name', 'contact_person', 'phone', 'email', 'status']);

        $deletions = DB::table('audit_log')
            ->leftJoin('users as u', 'audit_log.user_id', '=', 'u.user_id')
            ->whereIn('audit_log.action_type', ['DELETE_STOCK_IN', 'DELETE_STOCK_OUT'])
            ->whereDate('audit_log.created_at', '>=', $from)
            ->whereDate('audit_log.created_at', '<=', $to)
            ->select('audit_log.action_type', 'audit_log.description', 'audit_log.reason', 'audit_log.created_at', 'u.full_name as user_name')
            ->orderByDesc('audit_log.created_at')
            ->get();

        return view('reports.print', compact('tab', 'from', 'to', 'medicines', 'receivingRows', 'dispensingRows', 'suppliers', 'deletions'));
    }
}
