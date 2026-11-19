<?php

namespace App\Http\Controllers;

use App\Http\Requests\DisposeStockBatchesRequest;
use App\Http\Requests\TransactionHistoryFilterRequest;
use App\Models\StockIn;
use App\Models\StockOut;
use App\Models\User;
use App\Services\TransactionHistoryCsvExporter;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;

class TransactionHistoryController extends Controller
{
    public function index(TransactionHistoryFilterRequest $request)
    {
        $filters = $request->validated();
        $query = StockOut::getTransactionHistory($filters);

        return Inertia::render('TransactionHistory/Index', [
            'transactions' => (clone $query)
                ->orderByDesc('date_time')
                ->orderByDesc('record_id')
                ->paginate(15)
                ->withQueryString(),
            'totalFilteredRecords' => (clone $query)->count(),
            'totalTransactions' => StockIn::count() + StockOut::count(),
            'stockInTotal' => StockIn::query()
                ->whereMonth('recorded_at', now()->month)
                ->whereYear('recorded_at', now()->year)
                ->sum('quantity'),
            'stockOutTotal' => StockOut::query()
                ->whereMonth('dispensed_at', now()->month)
                ->whereYear('dispensed_at', now()->year)
                ->sum('quantity'),
            'users' => User::query()
                ->orderBy('full_name')
                ->get(['user_id', 'full_name']),
            'filters' => $filters,
            'canPrint' => $request->user()->can('print-transaction-history'),
            'canExport' => $request->user()->can('export-transaction-history'),
        ]);
    }

    public function print(TransactionHistoryFilterRequest $request)
    {
        Gate::authorize('print-transaction-history');

        $filters = $request->validated();

        $transactions = StockOut::getTransactionHistory($filters)
            ->orderByDesc('date_time')
            ->orderByDesc('record_id')
            ->get();

        return Inertia::render('TransactionHistory/Print', [
            'transactions' => $transactions,
            'filters' => $filters,
            'generatedAt' => now()->toDateTimeString(),
        ]);
    }

    public function exportCsv(
        TransactionHistoryFilterRequest $request,
        TransactionHistoryCsvExporter $exporter,
    ) {
        Gate::authorize('export-transaction-history');

        return $exporter->download($request->validated());
    }

    public function disposeBatches(DisposeStockBatchesRequest $request)
    {
        StockIn::disposeBatches(
            $request->validated()['batch_ids'],
            $request->user()->user_id,
        );

        return back()->with('success', 'Selected batches disposed.');
    }
}
