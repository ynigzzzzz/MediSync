<?php

namespace App\Http\Controllers;

use App\Http\Requests\DeleteStockInRequest;
use App\Http\Requests\DisposeStockBatchesRequest;
use App\Http\Requests\StoreStockInRequest;
use App\Models\AuditLog;
use App\Models\Medicine;
use App\Models\StockIn;
use App\Models\Supplier;
use App\Services\StockAlertService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class StockReceivingController extends Controller
{
    public function index(Request $request)
    {
        abort_if($request->user()->role === 'assistant', 403);

        $data = StockIn::getReceivingData();

        return Inertia::render('StockReceiving/Index', [
            'medicines' => Medicine::select('medicine_id', 'generic_name', 'brand_name', 'current_stock', 'price', 'dosage')->orderBy('generic_name')->get(),
            'suppliers' => Supplier::where('status', 'active')->orderBy('name')->get(['supplier_id', 'name']),
            'records' => $data['records'],
            'expiringBatches' => $data['expiringBatches'],
            'alerts' => StockAlertService::getAlerts(),
        ]);
    }

    public function store(StoreStockInRequest $request)
    {
        $data = $request->validated();

        $supplier = Supplier::find($data['supplier_id']);
        if (! $supplier || $supplier->status !== 'active') {
            return back()->withErrors(['supplier_id' => 'The selected supplier is not active.']);
        }

        $data['supplier'] = $supplier->name;

        $batch = StockIn::receiveBatch($data, $request->user()->user_id);

        AuditLog::record(
            $request->user()->user_id,
            'STOCK_IN',
            "Added {$data['quantity']} units of {$batch->medicine->generic_name} (supplier: {$supplier->name})",
            $data['medicine_id'],
        );

        return back()->with('success', 'Stock-In successful!');
    }

    public function destroy(DeleteStockInRequest $request, StockIn $stockIn)
    {
        if ($stockIn->remaining_quantity < $stockIn->quantity) {
            return back()->withErrors([
                'delete' => 'This batch has already been partially dispensed and cannot be deleted. Use Dispose instead.',
            ]);
        }

        DB::transaction(function () use ($request, $stockIn) {
            Medicine::where('medicine_id', $stockIn->medicine_id)
                ->decrement('current_stock', $stockIn->remaining_quantity);

            AuditLog::record(
                $request->user()->user_id,
                'DELETE_STOCK_IN',
                "Deleted stock-in record ID {$stockIn->stock_in_id}",
                null,
                $request->validated('reason'),
            );

            $stockIn->delete();
        });

        return back()->with('success', 'Record deleted.');
    }

    public function disposeBatches(DisposeStockBatchesRequest $request)
    {
        StockIn::disposeBatches($request->validated()['batch_ids'], $request->user()->user_id);

        return back()->with('success', 'Selected batches disposed.');
    }
}
