<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\Medicine;
use App\Models\StockIn;
use App\Models\StockOut;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class StockInController extends Controller
{
    /**
     * GET /stock-receiving
     * Assistants are blocked — same rule as the legacy page.
     */
    public function index(Request $request)
    {
        abort_if($request->user()->role === 'assistant', 403);

        $medicines = Medicine::select('medicine_id', 'generic_name', 'brand_name', 'current_stock', 'price')
            ->orderBy('generic_name')
            ->get();

        $records = StockIn::with(['medicine:medicine_id,generic_name,price', 'receivedBy:user_id,full_name'])
            ->orderByDesc('recorded_at')
            ->limit(50)
            ->get();

        $expiringBatches = StockIn::with('medicine:medicine_id,generic_name,brand_name')
            ->whereDate('expiry_date', '<=', now()->addDays(30))
            ->orderBy('expiry_date')
            ->get()
            ->map(fn ($b) => [
                'stock_in_id' => $b->stock_in_id,
                'generic_name' => $b->medicine->generic_name,
                'brand_name' => $b->medicine->brand_name,
                'batch_no' => $b->batch_no,
                'expiry_date' => $b->expiry_date,
                'days_left' => now()->diffInDays($b->expiry_date, false),
                'remaining_quantity' => $b->remaining_quantity,
            ]);

        return Inertia::render('StockReceiving/Index', [
            'medicines' => $medicines,
            'records' => $records,
            'expiringBatches' => $expiringBatches,
            'alerts' => [
                'lowStock' => Medicine::whereBetween('current_stock', [1, 49])->count(),
                'outOfStock' => Medicine::where('current_stock', 0)->count(),
                'expiringSoon' => StockIn::whereDate('expiry_date', '<=', now()->addDays(30))
                    ->whereDate('expiry_date', '>=', now())
                    ->distinct('medicine_id')
                    ->count('medicine_id'),
                'hasExpired' => StockIn::where('remaining_quantity', '>', 0)
                    ->whereDate('expiry_date', '<', now())
                    ->exists(),
            ],
        ]);
    }

    /**
     * POST /stock-receiving — record a new stock-in batch.
     */
    public function store(Request $request)
    {
        abort_if($request->user()->role === 'assistant', 403);

        $data = $request->validate([
            'medicine_id' => ['required', 'exists:medicines,medicine_id'],
            'quantity' => ['required', 'integer', 'min:1'],
            'cost_price' => ['required', 'numeric', 'min:0.01'],
            'sell_price' => ['nullable', 'numeric', 'min:0'],
            'batch_no' => ['required', 'string', 'max:50'],
            'expiry_date' => ['required', 'date', 'after:today'],
            'supplier' => ['required', 'string', 'max:100'],
            'invoice_no' => ['required', 'string', 'max:50'],
            'delivery_date' => ['nullable', 'date'],
        ]);

        DB::transaction(function () use ($data, $request) {
            $medicine = Medicine::where('medicine_id', $data['medicine_id'])->lockForUpdate()->first();
            $medicine->increment('current_stock', $data['quantity']);

            if (!empty($data['sell_price']) && $data['sell_price'] != $medicine->price) {
                $medicine->update(['price' => $data['sell_price']]);
            }

            $stockIn = StockIn::create([
                'medicine_id' => $data['medicine_id'],
                'quantity' => $data['quantity'],
                'remaining_quantity' => $data['quantity'],
                'batch_no' => $data['batch_no'],
                'expiry_date' => $data['expiry_date'],
                'supplier' => $data['supplier'],
                'received_by' => $request->user()->user_id,
                'delivery_date' => $data['delivery_date'] ?? now()->toDateString(),
                'invoice_no' => $data['invoice_no'],
                'cost_price' => $data['cost_price'],
                'selling_price' => $data['sell_price'] ?? 0,
            ]);

            AuditLog::record(
                $request->user()->user_id,
                'STOCK_IN',
                "Added {$data['quantity']} units of medicine ID {$data['medicine_id']} "
                    . "(cost: ₱{$data['cost_price']}, selling: ₱" . ($data['sell_price'] ?? 0) . ')',
                $data['medicine_id']
            );
        });

        return back()->with('success', "Stock-In successful! Added {$data['quantity']} units.");
    }

    /**
     * DELETE /stock-receiving/{stockIn} — admin only, reverses the stock-in.
     */
    public function destroy(Request $request, StockIn $stockIn)
    {
        abort_unless($request->user()->role === 'admin', 403, 'Only administrators can delete records.');

        DB::transaction(function () use ($stockIn, $request) {
            Medicine::where('medicine_id', $stockIn->medicine_id)
                ->decrement('current_stock', $stockIn->quantity);

            AuditLog::record(
                $request->user()->user_id,
                'DELETE_STOCK_IN',
                "Deleted stock-in record ID {$stockIn->stock_in_id} and removed {$stockIn->quantity} units from inventory"
            );

            $stockIn->delete();
        });

        return back()->with('success', 'Record deleted.');
    }

    /**
     * POST /stock-receiving/dispose — admin/pharmacist only, disposes selected batches.
     */
    public function disposeBatches(Request $request)
    {
        abort_unless(
            in_array($request->user()->role, ['admin', 'pharmacist']),
            403,
            'Only administrators and pharmacists can dispose batches.'
        );

        $data = $request->validate([
            'batch_ids' => ['required', 'array', 'min:1'],
            'batch_ids.*' => ['integer', 'exists:stock_in,stock_in_id'],
        ]);

        DB::transaction(function () use ($data, $request) {
            $batches = StockIn::whereIn('stock_in_id', $data['batch_ids'])->lockForUpdate()->get();

            foreach ($batches as $batch) {
                Medicine::where('medicine_id', $batch->medicine_id)
                    ->decrement('current_stock', $batch->remaining_quantity);

                // Remove dependent stock_out rows first to avoid FK violation.
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
}