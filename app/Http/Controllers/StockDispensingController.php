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
use Inertia\Inertia;

class StockDispensingController extends Controller
{
    public function index(Request $request)
    {
        $data = StockOut::getDispensingData();

        return Inertia::render('StockDispensing/Index', [
            'medicines' => $data['medicines'],
            'stockOutRecords' => $data['stockOutRecords'],
            'alerts' => StockAlertService::getAlerts(),
        ]);
    }

    public function store(StoreDispenseRequest $request)
    {
        $validated = $request->validated();
        $userId = $request->user()->user_id;
        $dispensedItems = [];
        $totalValue = 0;

        try {
            DB::transaction(function () use ($validated, $userId, &$dispensedItems, &$totalValue) {
                foreach ($validated['items'] as $item) {
                    $medicine = Medicine::where('medicine_id', $item['medicine_id'])->lockForUpdate()->first();
                    if (! $medicine) {
                        throw new \Exception('Medicine not found.');
                    }

                    $itemTotal = $medicine->dispense(
                        (int) $item['quantity'],
                        isset($item['price']) ? (float) $item['price'] : null,
                        $item['dosage'] ?? null,
                        $validated['patient_name'] ?? 'Walk-in',
                        $validated['prescription_no'] ?? 'N/A',
                        $userId,
                    );

                    $totalValue += $itemTotal;
                    $dispensedItems[] = "{$item['quantity']} x {$medicine->generic_name}";
                }

                AuditLog::record(
                    $userId,
                    'STOCK_OUT',
                    'Dispensed '.implode(', ', $dispensedItems).' to patient: '.($validated['patient_name'] ?? 'Walk-in'),
                );
            });
        } catch (\Exception $e) {
            return back()->withErrors(['dispense' => $e->getMessage()]);
        }

        return back()->with('success', 'Dispensed successfully! Total: ₱'.number_format($totalValue, 2));
    }

    public function destroy(DeleteStockOutRequest $request, StockOut $stockOut)
    {
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
                "Deleted stock-out record ID {$stockOut->stock_out_id}",
                null,
                $request->validated('reason'),
            );

            $stockOut->delete();
        });

        return back()->with('success', 'Record deleted and stock restored.');
    }

    public function disposeBatches(DisposeStockBatchesRequest $request)
    {
        StockIn::disposeBatches($request->validated()['batch_ids'], $request->user()->user_id);

        return back()->with('success', 'Selected batches disposed.');
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
