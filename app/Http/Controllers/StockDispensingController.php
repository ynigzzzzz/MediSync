<?php

namespace App\Http\Controllers;

use App\Http\Requests\DeleteStockOutRequest;
use App\Http\Requests\DisposeStockBatchesRequest;
use App\Http\Requests\StoreDispenseRequest;
use App\Models\AuditLog;
use App\Models\Medicine;
use App\Models\StockIn;
use App\Models\StockOut;
use App\Services\StockAlertService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class StockDispensingController extends Controller
{
    public function index(Request $request)
    {
        abort_unless(
            in_array(
                $request->user()?->role,
                ['admin', 'pharmacist', 'assistant'],
                true,
            ),
            403,
        );

        $filters = $request->only([
            'search',
            'date_from',
            'date_to',
        ]);

        $data = StockOut::getDispensingData($filters);

        // Calculate statistics only once.
        $medicineStats = Medicine::getStats();

        return Inertia::render('StockDispensing/Index', [
            'medicines' => $data['medicines'],
            'stockOutRecords' => $data['stockOutRecords'],

            // Reuse the already calculated statistics.
            'alerts' => StockAlertService::getAlerts($medicineStats),

            'stats' => [
                'low_stock' => $medicineStats['lowstock'],
                'out_of_stock' => $medicineStats['outofstock'],
                'expiring' => $medicineStats['expiring'],
            ],

            'filters' => $filters,
        ]);
    }

    public function store(StoreDispenseRequest $request)
    {
        $validated = $request->validated();

        // Lock medicines in a consistent order to reduce deadlocks.
        usort(
            $validated['items'],
            static fn (array $left, array $right): int => (int) $left['medicine_id'] <=> (int) $right['medicine_id'],
        );

        $userId = $request->user()->user_id;

        try {
            $result = DB::transaction(function () use (
                $validated,
                $userId,
            ) {
                // Keep retry-sensitive values inside the callback. Laravel may
                // execute this closure more than once after a deadlock retry.
                $dispensedItems = [];
                $totalValue = 0;

                foreach ($validated['items'] as $item) {
                    $medicine = Medicine::where(
                        'medicine_id',
                        $item['medicine_id'],
                    )
                        ->lockForUpdate()
                        ->first();

                    if (! $medicine) {
                        throw new \Exception('Medicine not found.');
                    }

                    $itemTotal = $medicine->dispense(
                        (int) $item['quantity'],
                        $item['dosage'] ?? null,
                        $validated['patient_name'] ?? 'Walk-in',
                        $validated['prescription_no'] ?? 'N/A',
                        $userId,
                    );

                    $totalValue += $itemTotal;
                    $dispensedItems[] =
                        "{$item['quantity']} x {$medicine->generic_name}";
                }

                AuditLog::record(
                    $userId,
                    'STOCK_OUT',
                    'Dispensed '.implode(', ', $dispensedItems).
                    ' to patient: '.
                    ($validated['patient_name'] ?? 'Walk-in'),
                );

                return [
                    'total_value' => $totalValue,
                ];
            }, 3);
        } catch (\Exception $e) {
            return back()->withErrors([
                'dispense' => $e->getMessage(),
            ]);
        }

        return back()->with(
            'success',
            'Dispensed successfully! Total: '.
            "\u{20B1}".number_format($result['total_value'], 2),
        );
    }

    public function destroy(
        DeleteStockOutRequest $request,
        StockOut $stockOut,
    ) {
        $stockOutId = (int) $stockOut->stock_out_id;

        $medicineId = (int) $stockOut->medicine_id;

        $batchId = $stockOut->stock_in_id
            ? (int) $stockOut->stock_in_id
            : null;

        // Old records without batch references cannot be safely restored.
        if (! $batchId) {
            return back()->withErrors([
                'delete' => 'This dispensing record no longer has its original batch reference. Stock cannot be safely restored. Manual inventory reconciliation is required.',
            ]);
        }

        DB::transaction(function () use (
            $request,
            $stockOutId,
            $medicineId,
            $batchId
        ) {
            // Consistent lock order:
            // Medicine -> Stock-In Batch -> Stock-Out Record.

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
                    'delete' => 'The original stock batch could not be found. Stock cannot be safely restored.',
                ]);
            }

            $record = StockOut::where(
                'stock_out_id',
                $stockOutId,
            )
                ->lockForUpdate()
                ->first();

            if (! $record) {
                throw ValidationException::withMessages([
                    'delete' => 'This dispensing record has already been reversed or deleted.',
                ]);
            }

            if (
                (int) $record->medicine_id !== $medicineId
                || (int) $record->stock_in_id !== $batchId
                || (int) $batch->medicine_id !== $medicineId
            ) {
                throw ValidationException::withMessages([
                    'delete' => 'The dispensing record and original batch do not match. Stock restoration was cancelled.',
                ]);
            }

            // Never restore inventory from a disposed batch.
            if (
                $batch->disposed_at !== null
                || (int) $batch->disposed_quantity > 0
            ) {
                throw ValidationException::withMessages([
                    'delete' => 'This batch has already been disposed. The dispensing record cannot be reversed through normal stock restoration.',
                ]);
            }

            $quantity = (int) $record->quantity;

            if ($quantity <= 0) {
                throw ValidationException::withMessages([
                    'delete' => 'Invalid dispensing quantity. Stock restoration was cancelled.',
                ]);
            }

            $nextRemainingQuantity =
                (int) $batch->remaining_quantity + $quantity;

            if ($nextRemainingQuantity > (int) $batch->quantity) {
                throw ValidationException::withMessages([
                    'delete' => 'Restoring this transaction would exceed the original batch quantity. Inventory reconciliation is required.',
                ]);
            }

            // Restore original batch quantity.
            $batch->remaining_quantity = $nextRemainingQuantity;

            $batch->save();

            // Restore aggregate medicine quantity.
            $medicine->current_stock =
                (int) $medicine->current_stock + $quantity;

            $medicine->save();

            AuditLog::record(
                $request->user()->user_id,
                'DELETE_STOCK_OUT',
                "Deleted stock-out record ID {$record->stock_out_id}",
                $stockOutId,
                $request->validated('reason'),
            );

            // Delete only after successful stock restoration.
            $record->delete();
        }, 3);

        return back()->with(
            'success',
            'Record deleted and stock restored.',
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

    public function unexpiredStock(Request $request)
    {
        abort_unless(
            in_array(
                $request->user()?->role,
                ['admin', 'pharmacist', 'assistant'],
                true,
            ),
            403,
        );

        $validated = $request->validate([
            'medicine_id' => [
                'required',
                'integer',
                'exists:medicines,medicine_id',
            ],
        ]);

        $total = StockIn::where(
            'medicine_id',
            $validated['medicine_id'],
        )
            ->where('remaining_quantity', '>', 0)
            ->where('expiry_date', '>=', now()->toDateString())
            ->whereNull('disposed_at')
            ->sum('remaining_quantity');

        return response()->json([
            'unexpiredStock' => (int) $total,
        ]);
    }
}
