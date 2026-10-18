<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\Medicine;
use App\Models\StockIn;
use App\Models\StockOut;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class DispensingController extends Controller
{
    public function index(Request $request)
    {
        $medicines = Medicine::where('current_stock', '>', 0)
            ->orderBy('generic_name')
            ->get(['medicine_id', 'generic_name', 'brand_name', 'dosage', 'current_stock', 'price']);

        $stockOutRecords = StockOut::with([
                'medicine:medicine_id,generic_name,brand_name,dosage',
                'dispensedBy:user_id,full_name',
                'stockIn:stock_in_id,batch_no,expiry_date',
            ])
            ->orderByDesc('dispensed_at')
            ->paginate(15)
            ->withQueryString();

        $expiredBatches = StockIn::with('medicine:medicine_id,generic_name,brand_name')
            ->where('expiry_date', '<', now()->toDateString())
            ->where('remaining_quantity', '>', 0)
            ->orderBy('expiry_date')
            ->get();

        $expiringBatches = StockIn::with('medicine:medicine_id,generic_name,brand_name')
            ->where('expiry_date', '<=', now()->addDays(30)->toDateString())
            ->where('expiry_date', '>=', now()->toDateString())
            ->where('remaining_quantity', '>', 0)
            ->orderBy('expiry_date')
            ->get();

        return Inertia::render('Dispensing/Index', [
            'medicines'        => $medicines,
            'stockOutRecords'  => $stockOutRecords,
            'expiredBatches'   => $expiredBatches,
            'expiringBatches'  => $expiringBatches,
            'hasExpired'       => $expiredBatches->isNotEmpty(),
            'hasExpiringSoon'  => $expiringBatches->isNotEmpty(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'patient_name'    => ['nullable', 'string', 'max:255'],
            'prescription_no' => ['nullable', 'string', 'max:255'],
            'items'           => ['required', 'array', 'min:1'],
            'items.*.medicine_id' => ['required', 'integer'],
            'items.*.quantity'    => ['required', 'integer', 'min:1'],
            'items.*.price'       => ['nullable', 'numeric'],
            'items.*.dosage'      => ['nullable', 'string'],
        ]);

        $userId = $request->user()->user_id;
        $dispensedItems = [];
        $totalValue = 0;

        try {
            DB::transaction(function () use ($validated, $userId, &$dispensedItems, &$totalValue) {
                foreach ($validated['items'] as $item) {
                    $medicine = Medicine::where('medicine_id', $item['medicine_id'])->lockForUpdate()->first();
                    if (! $medicine) throw new \Exception('Medicine not found.');

                    $quantityNeeded = (int) $item['quantity'];

                    $unexpiredTotal = StockIn::where('medicine_id', $medicine->medicine_id)
                        ->where('expiry_date', '>=', now()->toDateString())
                        ->where('remaining_quantity', '>', 0)
                        ->sum('remaining_quantity');

                    if ($unexpiredTotal < $quantityNeeded) {
                        $expiredOnly = $medicine->current_stock - $unexpiredTotal;
                        throw new \Exception("Cannot dispense {$quantityNeeded} units of '{$medicine->generic_name}'. Unexpired available: {$unexpiredTotal}. Expired (unusable): {$expiredOnly}.");
                    }

                    if ($medicine->current_stock < $quantityNeeded) {
                        throw new \Exception("Insufficient total stock for '{$medicine->generic_name}'. Requested {$quantityNeeded}, available {$medicine->current_stock}.");
                    }

                    $finalPrice = ((float) ($item['price'] ?? 0)) > 0 ? $item['price'] : $medicine->price;
                    $remaining = $quantityNeeded;
                    $itemTotal = 0;

                    while ($remaining > 0) {
                        $batch = StockIn::where('medicine_id', $medicine->medicine_id)
                            ->where('remaining_quantity', '>', 0)
                            ->where('expiry_date', '>=', now()->toDateString())
                            ->orderBy('expiry_date')
                            ->lockForUpdate()
                            ->first();

                        if (! $batch) throw new \Exception("No available unexpired stock for '{$medicine->generic_name}'.");

                        $take = min($remaining, $batch->remaining_quantity);
                        $batch->decrement('remaining_quantity', $take);

                        StockOut::create([
                            'medicine_id'     => $medicine->medicine_id,
                            'quantity'        => $take,
                            'dosage'          => $item['dosage'] ?? '',
                            'price'           => $finalPrice,
                            'patient_name'    => $validated['patient_name'] ?? 'Walk-in',
                            'prescription_no' => $validated['prescription_no'] ?? 'N/A',
                            'dispensed_by'    => $userId,
                            'stock_in_id'     => $batch->stock_in_id,
                        ]);

                        $itemTotal += $take * $finalPrice;
                        $remaining -= $take;
                    }

                    $medicine->decrement('current_stock', $quantityNeeded);
                    $totalValue += $itemTotal;
                    $dispensedItems[] = "{$quantityNeeded} x {$medicine->generic_name}";
                }

                AuditLog::record(
                    $userId,
                    'STOCK_OUT',
                    'Dispensed ' . implode(', ', $dispensedItems) . ' to patient: ' . ($validated['patient_name'] ?? 'Walk-in')
                );
            });
        } catch (\Exception $e) {
            return back()->withErrors(['dispense' => $e->getMessage()]);
        }

        return back()->with('success', 'Dispensed successfully! Total: ₱' . number_format($totalValue, 2));
    }

    public function destroy(Request $request, StockOut $stockOut)
    {
        abort_unless($request->user()->role === 'admin', 403, 'Only administrators can delete records.');

        DB::transaction(function () use ($request, $stockOut) {
            if ($stockOut->stock_in_id) {
                StockIn::where('stock_in_id', $stockOut->stock_in_id)
                    ->increment('remaining_quantity', $stockOut->quantity);
            }

            Medicine::where('medicine_id', $stockOut->medicine_id)
                ->increment('current_stock', $stockOut->quantity);

            AuditLog::record(
                $request->user()->user_id,
                'DELETE_STOCK_OUT',
                "Deleted stock-out record ID {$stockOut->stock_out_id} and restored stock"
            );

            $stockOut->delete();
        });

        return back()->with('success', 'Record deleted and stock restored.');
    }

    public function disposeBatches(Request $request)
    {
        abort_unless(
            in_array($request->user()->role, ['admin', 'pharmacist']),
            403,
            'Only administrators and pharmacists can dispose batches.'
        );

        $data = $request->validate([
            'batch_ids'   => ['required', 'array', 'min:1'],
            'batch_ids.*' => ['integer', 'exists:stock_in,stock_in_id'],
        ]);

        DB::transaction(function () use ($data, $request) {
            foreach ($data['batch_ids'] as $stockInId) {
                $batch = StockIn::where('stock_in_id', (int) $stockInId)->lockForUpdate()->first();
                if (! $batch) continue;

                Medicine::where('medicine_id', $batch->medicine_id)
                    ->decrement('current_stock', $batch->remaining_quantity);

                StockOut::where('stock_in_id', $batch->stock_in_id)->delete();

                AuditLog::record(
                    $request->user()->user_id,
                    'DISPOSE_BATCH',
                    "Disposed batch {$batch->batch_no} (ID {$batch->stock_in_id}), removed {$batch->remaining_quantity} units",
                    $batch->medicine_id
                );

                $batch->delete();
            }
        });

        return back()->with('success', 'Selected batches disposed.');
    }

    public function disposeExpiredBatch(Request $request)
    {
        abort_unless(
            in_array($request->user()->role, ['admin', 'pharmacist']),
            403,
            'Only administrators and pharmacists can dispose batches.'
        );

        $data = $request->validate([
            'stock_in_id' => ['required', 'integer', 'exists:stock_in,stock_in_id'],
        ]);

        DB::transaction(function () use ($data, $request) {
            $batch = StockIn::where('stock_in_id', $data['stock_in_id'])->lockForUpdate()->firstOrFail();

            Medicine::where('medicine_id', $batch->medicine_id)
                ->decrement('current_stock', $batch->remaining_quantity);

            StockOut::where('stock_in_id', $batch->stock_in_id)->delete();

            AuditLog::record(
                $request->user()->user_id,
                'DISPOSE_EXPIRED',
                "Disposed expired batch {$batch->batch_no} (ID {$batch->stock_in_id}), removed {$batch->remaining_quantity} units",
                $batch->medicine_id
            );

            $batch->delete();
        });

        return back()->with('success', 'Expired batch disposed.');
    }

    public function unexpiredStock(Request $request)
    {
        $medicineId = (int) $request->query('medicine_id');

        $total = StockIn::where('medicine_id', $medicineId)
            ->where('expiry_date', '>=', now()->toDateString())
            ->where('remaining_quantity', '>', 0)
            ->sum('remaining_quantity');

        return response()->json(['unexpiredStock' => $total]);
    }
}