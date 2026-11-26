<?php

namespace App\Http\Controllers;

use App\Http\Requests\DeleteStockInRequest;
use App\Http\Requests\DisposeStockBatchesRequest;
use App\Http\Requests\StoreStockInRequest;
use App\Models\AuditLog;
use App\Models\Medicine;
use App\Models\StockIn;
use App\Models\StockOut;
use App\Models\Supplier;
use App\Services\StockAlertService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class StockReceivingController extends Controller
{
    public function index(Request $request)
    {
        abort_unless(
            in_array($request->user()?->role, ['admin', 'pharmacist'], true),
            403,
        );

        $filters = $request->only([
            'search',
            'date_from',
            'date_to',
        ]);

        $data = StockIn::getReceivingData($filters);

        $medicineStats = Medicine::getStats();

        return Inertia::render('StockReceiving/Index', [
            'medicines' => Medicine::select(
                'medicine_id',
                'generic_name',
                'brand_name',
                'current_stock',
                'price',
                'dosage',
            )
                ->orderBy('generic_name')
                ->get(),

            'suppliers' => Supplier::where(
                'status',
                'active',
            )
                ->orderBy('name')
                ->get([
                    'supplier_id',
                    'name',
                ]),

            'records' => $data['records'],

            'expiringBatches' => $data['expiringBatches'],

            'alerts' => StockAlertService::getAlerts($medicineStats),

            'stats' => [
                'low_stock' => $medicineStats['lowstock'],
                'out_of_stock' => $medicineStats['outofstock'],
                'expiring' => $medicineStats['expiring'],
            ],

            'filters' => $filters,
        ]);
    }

    public function store(StoreStockInRequest $request)
    {
        $data = $request->validated();

        StockIn::receiveBatch(
            $data,
            $request->user()->user_id,
        );

        return back()->with(
            'success',
            'Stock-In successful!',
        );
    }

    public function destroy(
        DeleteStockInRequest $request,
        StockIn $stockIn,
    ) {

        $batchId = (int) $stockIn->stock_in_id;

        $medicineId = (int) $stockIn->medicine_id;

        DB::transaction(function () use (
            $request,
            $batchId,
            $medicineId
        ) {

            // Use the same lock order as dispensing and disposal.

            $medicine = Medicine::where(
                'medicine_id',
                $medicineId,
            )
                ->lockForUpdate()
                ->firstOrFail();

            $batch = StockIn::where(
                'stock_in_id',
                $batchId,
            )
                ->lockForUpdate()
                ->first();

            if (! $batch) {
                throw ValidationException::withMessages([
                    'delete' => 'The selected receiving batch no longer exists.',
                ]);
            }

            // Only completely untouched batches can be deleted.

            if (
                $batch->disposed_at !== null
                || (int) $batch->disposed_quantity > 0
                || (int) $batch->remaining_quantity !== (int) $batch->quantity
            ) {
                throw ValidationException::withMessages([
                    'delete' => 'This batch has dispensing or disposal history and cannot be deleted. Use Dispose for its remaining stock.',
                ]);
            }

            // Preserve any batch that has dispensing references.

            $hasDispensingHistory = StockOut::where(
                'stock_in_id',
                $batchId,
            )->exists();

            if ($hasDispensingHistory) {
                throw ValidationException::withMessages([
                    'delete' => 'This batch has dispensing history and cannot be deleted.',
                ]);
            }

            $quantity = (int) $batch->remaining_quantity;

            if ((int) $medicine->current_stock < $quantity) {
                throw ValidationException::withMessages([
                    'delete' => 'Inventory mismatch detected. Reconcile the medicine stock before deleting this batch.',
                ]);
            }

            // Remove the received quantity from aggregate stock.

            $medicine->current_stock =
                (int) $medicine->current_stock - $quantity;

            $medicine->save();

            AuditLog::record(
                $request->user()->user_id,
                'DELETE_STOCK_IN',
                "Deleted stock-in record ID {$batch->stock_in_id}",
                $batchId,
                $request->validated('reason'),
            );

            // This deletion is allowed only because the batch
            // has no dispensing or disposal history.

            $batch->delete();

        }, 3);

        return back()->with(
            'success',
            'Record deleted.',
        );
    }

    public function disposeBatches(
        DisposeStockBatchesRequest $request,
    ) {
        StockIn::disposeBatches(
            $request->validated()['batch_ids'],
            $request->user()->user_id,
        );

        return back()->with(
            'success',
            'Selected batches disposed.',
        );
    }
}
