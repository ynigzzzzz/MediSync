<?php

namespace App\Http\Controllers;

use App\Http\Requests\DisposeStockBatchesRequest;
use App\Models\StockIn;
use App\Models\StockOut;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class TransactionHistoryController extends Controller
{
    public function index(Request $request)
    {
        $filters = $request->only(['search', 'type', 'date_from', 'date_to', 'user']);
        $query = StockOut::getTransactionHistory($filters);

        $transactions = (clone $query)->orderByDesc('date_time')->paginate(15)->withQueryString();

        return Inertia::render('TransactionHistory/Index', [
            'transactions' => $transactions,
            'totalFilteredRecords' => (clone $query)->count(),
            'stockInCount' => (clone $query)->where('source_table', 'stock_in')->count(),
            'stockOutCount' => (clone $query)->where('source_table', 'stock_out')->count(),
            'totalTransactions' => StockIn::count() + StockOut::count(),
            'stockInTotal' => (float) StockIn::whereRaw("DATE_TRUNC('month', recorded_at) = DATE_TRUNC('month', CURRENT_DATE)")->sum('quantity'),
            'stockOutTotal' => (float) StockOut::whereRaw("DATE_TRUNC('month', dispensed_at) = DATE_TRUNC('month', CURRENT_DATE)")->sum('quantity'),
            'users' => User::where('role', '!=', 'admin')->orderBy('full_name')->pluck('full_name'),
            'filters' => $filters,
        ]);
    }

    public function exportCsv(Request $request)
    {
        $filters = $request->only(['search', 'type', 'date_from', 'date_to', 'user']);
        $rows = StockOut::getTransactionHistory($filters)->orderByDesc('date_time')->get();

        $filename = 'transaction_history_'.now()->format('Y-m-d').'.csv';

        return response()->streamDownload(function () use ($rows) {
            $out = fopen('php://output', 'w');
            fwrite($out, chr(0xEF).chr(0xBB).chr(0xBF));
            fputcsv($out, ['Date & Time', 'Type', 'Medicine (Generic)', 'Brand Name', 'Dosage', 'Quantity', 'Selling Price', 'Batch #', 'Expiry Date', 'Supplier', 'Invoice No', 'Patient Name', 'Prescription No', 'User']);
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

    public function disposeBatches(DisposeStockBatchesRequest $request)
    {
        StockIn::disposeBatches($request->validated()['batch_ids'], $request->user()->user_id);

        return back()->with('success', 'Selected batches disposed.');
    }
}
