<?php

namespace App\Http\Controllers;

use App\Models\Medicine;
use App\Models\StockIn;
use App\Models\StockOut;
use App\Models\Supplier;
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
        $to   = $request->query('to')   ?: now()->toDateString();

        // ---- Inventory (current snapshot) ----
        $inventory = [
            'total_medicines' => Medicine::count(),
            'in_stock'        => Medicine::where('current_stock', '>', 0)->count(),
            'low_stock'       => Medicine::whereBetween('current_stock', [1, 49])->count(),
            'out_of_stock'    => Medicine::where('current_stock', 0)->count(),
            'expiring_soon'   => StockIn::where('remaining_quantity', '>', 0)
                ->whereDate('expiry_date', '>=', now()->toDateString())
                ->whereDate('expiry_date', '<=', now()->addDays(30)->toDateString())
                ->distinct('medicine_id')
                ->count('medicine_id'),
            'expired'         => StockIn::where('remaining_quantity', '>', 0)
                ->whereDate('expiry_date', '<', now()->toDateString())
                ->distinct('medicine_id')
                ->count('medicine_id'),
            'valuation'       => (float) Medicine::select(DB::raw('COALESCE(SUM(current_stock * price), 0) as v'))->value('v'),
        ];

        $inventory['rows'] = Medicine::orderBy('generic_name')
            ->get(['medicine_id', 'generic_name', 'brand_name', 'dosage', 'current_stock', 'price'])
            ->map(fn ($m) => [
                'medicine_id'   => $m->medicine_id,
                'generic_name'  => $m->generic_name,
                'brand_name'    => $m->brand_name,
                'dosage'        => $m->dosage,
                'current_stock' => (int) $m->current_stock,
                'price'         => (float) $m->price,
                'stock_value'   => (float) $m->current_stock * (float) $m->price,
                'status'        => $m->current_stock === 0 ? 'out' : ($m->current_stock < 50 ? 'low' : 'ok'),
            ]);

        $inventory['top_stock'] = $inventory['rows']
            ->sortByDesc('current_stock')
            ->take(10)
            ->values()
            ->map(fn ($r) => [
                'name'  => $r['generic_name'],
                'stock' => $r['current_stock'],
            ]);

        // ---- Receiving ----
        $receiving = [
            'total_units'   => (int) StockIn::whereDate('recorded_at', '>=', $from)->whereDate('recorded_at', '<=', $to)->sum('quantity'),
            'total_batches' => (int) StockIn::whereDate('recorded_at', '>=', $from)->whereDate('recorded_at', '<=', $to)->count(),
            'total_cost'    => (float) StockIn::whereDate('recorded_at', '>=', $from)->whereDate('recorded_at', '<=', $to)
                ->select(DB::raw('COALESCE(SUM(quantity * cost_price), 0) as v'))->value('v'),
        ];

        $receiving['by_supplier'] = StockIn::whereDate('recorded_at', '>=', $from)
            ->whereDate('recorded_at', '<=', $to)
            ->select(
                'supplier',
                DB::raw('COUNT(*) as batches'),
                DB::raw('SUM(quantity) as units'),
                DB::raw('COALESCE(SUM(quantity * cost_price), 0) as cost')
            )
            ->groupBy('supplier')
            ->orderByDesc('units')
            ->get()
            ->map(fn ($r) => [
                'supplier' => $r->supplier ?: '—',
                'batches'  => (int) $r->batches,
                'units'    => (int) $r->units,
                'cost'     => (float) $r->cost,
            ]);

        $receiving['by_medicine'] = StockIn::whereDate('recorded_at', '>=', $from)
            ->whereDate('recorded_at', '<=', $to)
            ->join('medicines as m', 'stock_in.medicine_id', '=', 'm.medicine_id')
            ->select('m.generic_name', 'm.brand_name', DB::raw('SUM(stock_in.quantity) as units'))
            ->groupBy('m.generic_name', 'm.brand_name')
            ->orderByDesc('units')
            ->limit(20)
            ->get()
            ->map(fn ($r) => [
                'generic_name' => $r->generic_name,
                'brand_name'   => $r->brand_name,
                'units'        => (int) $r->units,
            ]);

        $receiving['daily'] = $this->dailySeries('stock_in', 'recorded_at', 'quantity', $from, $to);

        // ---- Dispensing ----
        $dispensing = [
            'total_units'   => (int) StockOut::whereDate('dispensed_at', '>=', $from)->whereDate('dispensed_at', '<=', $to)->sum('quantity'),
            'total_value'   => (float) StockOut::whereDate('dispensed_at', '>=', $from)->whereDate('dispensed_at', '<=', $to)
                ->select(DB::raw('COALESCE(SUM(total_amount), 0) as v'))->value('v'),
            'total_records' => (int) StockOut::whereDate('dispensed_at', '>=', $from)->whereDate('dispensed_at', '<=', $to)->count(),
        ];

        $dispensing['by_medicine'] = StockOut::whereDate('dispensed_at', '>=', $from)
            ->whereDate('dispensed_at', '<=', $to)
            ->join('medicines as m', 'stock_out.medicine_id', '=', 'm.medicine_id')
            ->select('m.generic_name', 'm.brand_name', DB::raw('SUM(stock_out.quantity) as units'))
            ->groupBy('m.generic_name', 'm.brand_name')
            ->orderByDesc('units')
            ->limit(20)
            ->get()
            ->map(fn ($r) => [
                'generic_name' => $r->generic_name,
                'brand_name'   => $r->brand_name,
                'units'        => (int) $r->units,
            ]);

        $dispensing['by_user'] = StockOut::whereDate('dispensed_at', '>=', $from)
            ->whereDate('dispensed_at', '<=', $to)
            ->join('users as u', 'stock_out.dispensed_by', '=', 'u.user_id')
            ->select('u.full_name', DB::raw('COUNT(*) as records'), DB::raw('SUM(stock_out.quantity) as units'))
            ->groupBy('u.full_name')
            ->orderByDesc('units')
            ->get()
            ->map(fn ($r) => [
                'user'    => $r->full_name,
                'records' => (int) $r->records,
                'units'   => (int) $r->units,
            ]);

        $dispensing['daily'] = $this->dailySeries('stock_out', 'dispensed_at', 'quantity', $from, $to);

        // ---- Supplier summary (all-time) ----
        $supplierSummary = Supplier::orderBy('name')->get(['supplier_id', 'name', 'contact_person', 'phone', 'email', 'status'])
            ->map(function ($s) {
                $in = StockIn::where('supplier_id', $s->supplier_id)
                    ->select(DB::raw('COUNT(*) as batches'), DB::raw('COALESCE(SUM(quantity), 0) as units'), DB::raw('COALESCE(SUM(quantity * cost_price), 0) as cost'))
                    ->first();
                return [
                    'supplier_id'    => $s->supplier_id,
                    'name'           => $s->name,
                    'contact_person' => $s->contact_person,
                    'phone'          => $s->phone,
                    'email'          => $s->email,
                    'status'         => $s->status,
                    'batches'        => (int) ($in->batches ?? 0),
                    'units'          => (int) ($in->units ?? 0),
                    'cost'           => (float) ($in->cost ?? 0),
                ];
            });

        return Inertia::render('Reports/Index', [
            'inventory'       => $inventory,
            'receiving'       => $receiving,
            'dispensing'      => $dispensing,
            'supplierSummary' => $supplierSummary,
            'range'           => ['from' => $from, 'to' => $to],
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
        $end    = Carbon::parse($to)->startOfDay();
        while ($cursor->lte($end)) {
            $key = $cursor->toDateString();
            $series[] = [
                'date'  => $key,
                'label' => $cursor->format('M j'),
                'value' => (int) ($rows[$key]->v ?? 0),
            ];
            $cursor->addDay();
        }
        return $series;
    }
    public function print(Request $request)
    {
        abort_unless($request->user()->role === 'admin', 403, 'Only administrators can access Reports.');

        $from = $request->query('from') ?: now()->subDays(29)->toDateString();
        $to   = $request->query('to')   ?: now()->toDateString();
        $tab  = $request->query('tab', 'inventory');

        // Reuse the same queries — for simplicity we call index()'s payload builder
        // by hitting the same page logic. For the print view we only need the rows
        // for the requested tab.
        $medicines = Medicine::orderBy('generic_name')->get(['generic_name', 'brand_name', 'dosage', 'current_stock', 'price']);
        $receivingRows = StockIn::whereDate('recorded_at', '>=', $from)
            ->whereDate('recorded_at', '<=', $to)
            ->select('supplier', DB::raw('COUNT(*) as batches'), DB::raw('SUM(quantity) as units'), DB::raw('COALESCE(SUM(quantity * cost_price), 0) as cost'))
            ->groupBy('supplier')
            ->orderByDesc('units')
            ->get();
        $dispensingRows = StockOut::whereDate('dispensed_at', '>=', $from)
            ->whereDate('dispensed_at', '<=', $to)
            ->join('medicines as m', 'stock_out.medicine_id', '=', 'm.medicine_id')
            ->select('m.generic_name', 'm.brand_name', DB::raw('SUM(stock_out.quantity) as units'))
            ->groupBy('m.generic_name', 'm.brand_name')
            ->orderByDesc('units')
            ->get();
        $suppliers = Supplier::orderBy('name')->get(['name', 'contact_person', 'phone', 'email', 'status']);

        return view('reports.print', compact('tab', 'from', 'to', 'medicines', 'receivingRows', 'dispensingRows', 'suppliers'));
    }
}