<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\Medicine;
use App\Models\StockIn;
use App\Models\StockOut;
use App\Models\Supplier;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class StockInController extends Controller
{
    public function index(Request $request)
    {
        abort_if($request->user()->role === 'assistant', 403);

        $medicines = Medicine::select('medicine_id', 'generic_name', 'brand_name', 'current_stock', 'price')
            ->orderBy('generic_name')
            ->get();

        // Dropdown source for the Supplier field — active suppliers only.
        $suppliers = Supplier::where('status', 'active')
            ->orderBy('name')
            ->get(['supplier_id', 'name']);

        $records = StockIn::with([
                'medicine:medicine_id,generic_name,price',
                'receivedBy:user_id,full_name',
                'supplier:supplier_id,name',
            ])
            ->orderByDesc('recorded_at')
            ->paginate(15)
            ->withQueryString();

        $expiringBatches = StockIn::with('medicine:medicine_id,generic_name,brand_name')
            ->whereDate('expiry_date', '<=', now()->addDays(30))
            ->orderBy('expiry_date')
            ->get()
            ->map(fn ($b) => [
                'stock_in_id'        => $b->stock_in_id,
                'generic_name'       => $b->medicine->generic_name ?? '—',
                'brand_name'         => $b->medicine->brand_name ?? '',
                'batch_no'           => $b->batch_no,
                'expiry_date'        => $b->expiry_date,
                'remaining_quantity' => $b->remaining_quantity,
                'days_left'          => now()->diffInDays($b->expiry_date, false),
            ]);

        return Inertia::render('StockReceiving/Index', [
            'medicines'       => $medicines,
            'suppliers'       => $suppliers,
            'records'         => $records,
            'expiringBatches' => $expiringBatches,
            'alerts' => [
                'lowStock'     => Medicine::whereBetween('current_stock', [1, 49])->count(),
                'outOfStock'   => Medicine::where('current_stock', 0)->count(),
                'expiringSoon' => StockIn::whereDate('expiry_date', '<=', now()->addDays(30))
                    ->whereDate('expiry_date', '>=', now())
                    ->distinct('medicine_id')
                    ->count('medicine_id'),
                'hasExpired'   => StockIn::where('remaining_quantity', '>', 0)
                    ->whereDate('expiry_date', '<', now())
                    ->exists(),
            ],
        ]);
    }

    public function store(Request $request)
    {
        abort_if($request->user()->role === 'assistant', 403);

        $data = $request->validate([
            'medicine_id'   => ['required', 'integer', 'exists:medicines,medicine_id'],
            'quantity'      => ['required', 'integer', 'min:1'],
            'batch_no'      => ['required', 'string', 'max:50'],
            'expiry_date'   => ['required', 'date', 'after:today'],
            'supplier_id'   => ['nullable', 'integer', Rule::exists('suppliers', 'supplier_id')],
            'supplier'      => ['required_without:supplier_id', 'nullable', 'string', 'max:100'],
            'invoice_no'    => ['required', 'string', 'max:50'],
            'delivery_date' => ['required', 'date'],
            'cost_price'    => ['required', 'numeric', 'min:0.01'],
            'sell_price'    => ['nullable', 'numeric', 'min:0'],
        ], [
            'supplier.required_without' => 'Please pick a supplier or type one in.',
        ]);

        // If a supplier record was chosen, keep the free-text column in sync
        // with the supplier's name so Transaction History (which reads the
        // free-text field) still shows the correct label.
        if (! empty($data['supplier_id'])) {
            $supplier = Supplier::find($data['supplier_id']);
            if ($supplier) {
                $data['supplier'] = $supplier->name;
            }
        }

        DB::transaction(function () use ($data, $request) {
            $medicine = Medicine::where('medicine_id', $data['medicine_id'])->lockForUpdate()->firstOrFail();

            $medicine->increment('current_stock', $data['quantity']);

            if (($data['sell_price'] ?? 0) > 0 && (float) $medicine->price !== (float) $data['sell_price']) {
                $medicine->update(['price' => $data['sell_price']]);
            }

            StockIn::create([
                'medicine_id'        => $data['medicine_id'],
                'quantity'           => $data['quantity'],
                'batch_no'           => $data['batch_no'],
                'expiry_date'        => $data['expiry_date'],
                'supplier'           => $data['supplier'] ?? null,
                'supplier_id'        => $data['supplier_id'] ?? null,
                'received_by'        => $request->user()->user_id,
                'delivery_date'      => $data['delivery_date'],
                'invoice_no'         => $data['invoice_no'],
                'cost_price'         => $data['cost_price'],
                'selling_price'      => $data['sell_price'] ?? 0,
                'remaining_quantity' => $data['quantity'],
            ]);

            AuditLog::record(
                $request->user()->user_id,
                'STOCK_IN',
                "Added {$data['quantity']} units of medicine ID {$data['medicine_id']} (cost: ₱{$data['cost_price']}, selling: ₱" . ($data['sell_price'] ?? 0) . ", supplier: " . ($data['supplier'] ?? '—') . ")",
                $data['medicine_id']
            );
        });

        return back()->with('success', 'Stock-In successful!');
    }

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
            $batches = StockIn::whereIn('stock_in_id', $data['batch_ids'])->lockForUpdate()->get();

            foreach ($batches as $batch) {
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
}