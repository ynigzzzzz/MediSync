<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\Medicine;
use App\Models\StockIn;
use App\Models\StockOut;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class TransactionHistoryController extends Controller
{
    private function baseUnion()
    {
        $stockIn = DB::table('stock_in as si')
            ->join('medicines as m', 'si.medicine_id', '=', 'm.medicine_id')
            ->leftJoin('users as u', 'si.received_by', '=', 'u.user_id')
            ->selectRaw("
                'Stock-In' as transaction_type,
                si.recorded_at as date_time,
                si.quantity,
                si.batch_no,
                si.expiry_date,
                si.supplier,
                si.invoice_no,
                si.cost_price,
                si.selling_price,
                m.generic_name,
                m.brand_name,
                m.dosage,
                NULL::varchar as patient_name,
                NULL::varchar as prescription_no,
                u.full_name as user_name,
                'stock_in' as source_table,
                si.stock_in_id as record_id,
                si.batch_no as batch_reference
            ");

        $stockOut = DB::table('stock_out as so')
            ->join('medicines as m', 'so.medicine_id', '=', 'm.medicine_id')
            ->leftJoin('users as u', 'so.dispensed_by', '=', 'u.user_id')
            ->leftJoin('stock_in as si', 'so.stock_in_id', '=', 'si.stock_in_id')
            ->selectRaw("
                'Stock-Out' as transaction_type,
                so.dispensed_at as date_time,
                so.quantity,
                si.batch_no,
                si.expiry_date,
                si.supplier,
                ''::varchar as invoice_no,
                NULL::numeric as cost_price,
                so.price as selling_price,
                m.generic_name,
                m.brand_name,
                m.dosage,
                so.patient_name,
                so.prescription_no,
                u.full_name as user_name,
                'stock_out' as source_table,
                so.stock_out_id as record_id,
                si.batch_no as batch_reference
            ");

        return $stockIn->unionAll($stockOut);
    }

    private function applyFilters($query, Request $request)
    {
        $search     = trim((string) $request->query('search', ''));
        $type       = $request->query('type', '');
        $dateFrom   = $request->query('date_from', '');
        $dateTo     = $request->query('date_to', '');
        $userFilter = $request->query('user', '');

        if ($search !== '') {
            $like = "%{$search}%";
            $query->where(function ($q) use ($like) {
                $q->where('generic_name', 'ILIKE', $like)
                  ->orWhere('brand_name', 'ILIKE', $like)
                  ->orWhere('patient_name', 'ILIKE', $like)
                  ->orWhere('supplier', 'ILIKE', $like);
            });
        }

        if ($type !== '' && $type !== 'all') {
            if ($type === 'Stock-In')  $query->where('source_table', 'stock_in');
            if ($type === 'Stock-Out') $query->where('source_table', 'stock_out');
        }

        if ($dateFrom !== '') $query->whereRaw('DATE(date_time) >= ?', [$dateFrom]);
        if ($dateTo !== '')   $query->whereRaw('DATE(date_time) <= ?', [$dateTo]);

        if ($userFilter !== '' && $userFilter !== 'all') {
            $query->where('user_name', $userFilter);
        }

        return $query;
    }

    public function index(Request $request)
    {
        $filtered = fn () => $this->applyFilters(DB::query()->fromSub($this->baseUnion(), 't'), $request);

        // Paginated view — 15 rows per page.
        $transactions = $filtered()
            ->orderByDesc('date_time')
            ->paginate(15)
            ->withQueryString();

        // Stat-card counts stay on the FULL filtered dataset.
        $totalFilteredRecords = $filtered()->count();
        $typeCounts = $filtered()
            ->select('transaction_type', DB::raw('COUNT(*) as count'))
            ->groupBy('transaction_type')
            ->pluck('count', 'transaction_type');

        $totalTransactions = StockIn::count() + StockOut::count();
        $stockInTotal  = (float) StockIn::whereRaw("DATE_TRUNC('month', recorded_at) = DATE_TRUNC('month', CURRENT_DATE)")->sum('quantity');
        $stockOutTotal = (float) StockOut::whereRaw("DATE_TRUNC('month', dispensed_at) = DATE_TRUNC('month', CURRENT_DATE)")->sum('quantity');

        $users = User::where('role', '!=', 'admin')->orderBy('full_name')->pluck('full_name');

        $allExpiringBatches = DB::table('stock_in as si')
            ->join('medicines as m', 'si.medicine_id', '=', 'm.medicine_id')
            ->whereRaw("si.expiry_date <= CURRENT_DATE + INTERVAL '30 days'")
            ->orderBy('si.expiry_date')
            ->selectRaw("
                m.generic_name,
                m.brand_name,
                si.batch_no,
                si.expiry_date,
                (si.expiry_date - CURRENT_DATE) as days_left,
                si.remaining_quantity,
                si.stock_in_id
            ")
            ->get();

        return Inertia::render('TransactionHistory/Index', [
            'transactions'         => $transactions,
            'totalFilteredRecords' => $totalFilteredRecords,
            'stockInCount'         => $typeCounts['Stock-In'] ?? 0,
            'stockOutCount'        => $typeCounts['Stock-Out'] ?? 0,
            'totalTransactions'    => $totalTransactions,
            'stockInTotal'         => $stockInTotal,
            'stockOutTotal'        => $stockOutTotal,
            'users'                => $users,
            'allExpiringBatches'   => $allExpiringBatches,
            'filters'              => $request->only(['search', 'type', 'date_from', 'date_to', 'user']),
        ]);
    }

    public function exportCsv(Request $request)
    {
        // NOTE: exports ALL filtered rows — never paginated.
        $rows = $this->applyFilters(
            DB::query()->fromSub($this->baseUnion(), 't'),
            $request
        )->orderByDesc('date_time')->get();

        $filename = 'transaction_history_' . now()->format('Y-m-d') . '.csv';

        return response()->streamDownload(function () use ($rows) {
            $out = fopen('php://output', 'w');
            fwrite($out, chr(0xEF) . chr(0xBB) . chr(0xBF));
            fputcsv($out, [
                'Date & Time', 'Type', 'Medicine (Generic)', 'Brand Name', 'Dosage',
                'Quantity', 'Selling Price', 'Batch #', 'Expiry Date',
                'Supplier', 'Invoice No', 'Patient Name', 'Prescription No', 'User',
            ]);
            foreach ($rows as $row) {
                fputcsv($out, [
                    $row->date_time, $row->transaction_type, $row->generic_name, $row->brand_name,
                    $row->dosage, $row->quantity, $row->selling_price, $row->batch_reference ?? '',
                    $row->expiry_date ?? '', $row->supplier ?? '', $row->invoice_no ?? '',
                    $row->patient_name ?? '', $row->prescription_no ?? '', $row->user_name ?? 'System',
                ]);
            }
            fclose($out);
        }, $filename, ['Content-Type' => 'text/csv; charset=utf-8']);
    }

    public function disposeBatches(Request $request)
    {
        abort_unless(
            in_array($request->user()->role, ['admin', 'pharmacist']),
            403,
            'Only administrators and pharmacists can dispose batches.'
        );

        $batchIds = $request->input('batch_ids', []);
        if (empty($batchIds)) {
            return back()->withErrors(['batch_ids' => 'No batches selected.']);
        }

        try {
            DB::transaction(function () use ($batchIds, $request) {
                foreach ($batchIds as $sid) {
                    $batch = StockIn::where('stock_in_id', (int) $sid)->lockForUpdate()->first();
                    if (! $batch) continue;

                    Medicine::where('medicine_id', $batch->medicine_id)
                        ->decrement('current_stock', $batch->remaining_quantity);

                    StockOut::where('stock_in_id', $batch->stock_in_id)->delete();
                    $batch->delete();

                    AuditLog::record(
                        $request->user()->user_id,
                        'DISPOSE_BATCH',
                        "Disposed batch {$batch->batch_no} (ID {$batch->stock_in_id}), removed {$batch->remaining_quantity} units",
                        $batch->medicine_id
                    );
                }
            });
        } catch (\Exception $e) {
            return back()->withErrors(['dispose' => $e->getMessage()]);
        }

        return back()->with('success', 'Selected batches disposed.');
    }
}