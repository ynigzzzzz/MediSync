<?php

namespace App\Http\Controllers;

use App\Http\Requests\DisposeStockBatchesRequest;
use App\Http\Requests\StoreDispenseRequest;
use App\Models\AuditLog;
use App\Models\Medicine;
use App\Models\StockIn;
use App\Models\StockOut;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class StockDispensingController extends Controller
{
    public function index(Request $request)
    {
        $stockOutRecords = StockOut::with([
            'medicine:medicine_id,generic_name,brand_name,dosage',
            'dispensedBy:user_id,full_name',
            'stockIn:stock_in_id,batch_no,expiry_date',
        ])
            ->orderByDesc('dispensed_at')
            ->paginate(15)
            ->withQueryString();

        $today = now()->toDateString();

        $expiredBatches = StockIn::with('medicine:medicine_id,generic_name,brand_name')
            ->where('expiry_date', '<', $today)
            ->where('remaining_quantity', '>', 0)
            ->orderBy('expiry_date')
            ->get();

        $expiringBatches = StockIn::with('medicine:medicine_id,generic_name,brand_name')
            ->where('expiry_date', '>=', $today)
            ->where('expiry_date', '<=', now()->addDays(30)->toDateString())
            ->where('remaining_quantity', '>', 0)
            ->orderBy('expiry_date')
            ->get();

        $alerts = [];

        $lowStockCount = Medicine::whereBetween('current_stock', [1, 49])->count();
        if ($lowStockCount > 0) {
            $alerts[] = [
                'type' => 'warning',
                'icon' => 'fa-triangle-exclamation',
                'message' => "{$lowStockCount} medicine(s) low on stock",
                'link' => '/medicine-list?filter=lowstock',
            ];
        }

        $outOfStockCount = Medicine::where('current_stock', 0)->count();
        if ($outOfStockCount > 0) {
            $alerts[] = [
                'type' => 'danger',
                'icon' => 'fa-circle-xmark',
                'message' => "{$outOfStockCount} medicine(s) out of stock",
                'link' => '/medicine-list?filter=outofstock',
            ];
        }

        if ($expiringBatches->isNotEmpty()) {
            $alerts[] = [
                'type' => 'warning',
                'icon' => 'fa-hourglass-half',
                'message' => "{$expiringBatches->count()} batch(es) expiring within 30 days",
                'link' => '/medicine-list?filter=expiring',
            ];
        }

        if ($expiredBatches->isNotEmpty()) {
            $alerts[] = [
                'type' => 'danger',
                'icon' => 'fa-ban',
                'message' => "{$expiredBatches->count()} expired batch(es) still in stock",
                'link' => '/medicine-list?filter=expiring',
            ];
        }

        return Inertia::render('StockDispensing/Index', [
            'medicines' => Medicine::where('current_stock', '>', 0)
                ->orderBy('generic_name')
                ->get(['medicine_id', 'generic_name', 'brand_name', 'dosage', 'current_stock', 'price']),
            'stockOutRecords' => $stockOutRecords,
            'expiredBatches' => $expiredBatches,
            'expiringBatches' => $expiringBatches,
            'hasExpired' => $expiredBatches->isNotEmpty(),
            'hasExpiringSoon' => $expiringBatches->isNotEmpty(),
            'alerts' => $alerts,
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

    public function destroy(Request $request, StockOut $stockOut)
    {
        abort_unless($request->user()->role === 'admin', 403, 'Only administrators can delete records.');

        $validated = $request->validate([
            'reason' => ['required', 'string', 'min:5', 'max:500'],
        ]);

        DB::transaction(function () use ($request, $stockOut, $validated) {
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
                $validated['reason'],
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
