<?php

namespace App\Http\Controllers;

use App\Http\Requests\DisposeStockBatchesRequest;
use App\Http\Requests\StoreStockInRequest;
use App\Models\AuditLog;
use App\Models\Medicine;
use App\Models\StockIn;
use App\Models\Supplier;
use Illuminate\Http\Request;
use Inertia\Inertia;

class StockReceivingController extends Controller
{
    public function index(Request $request)
    {
        abort_if($request->user()->role === 'assistant', 403);

        $records = StockIn::with([
            'medicine:medicine_id,generic_name,price',
            'receivedBy:user_id,full_name',
            'supplier:supplier_id,name',
        ])
            ->orderByDesc('recorded_at')
            ->paginate(15)
            ->withQueryString();

        $expiringBatches = StockIn::with('medicine:medicine_id,generic_name,brand_name')
            ->where('remaining_quantity', '>', 0)
            ->whereDate('expiry_date', '>=', now()->toDateString())
            ->whereDate('expiry_date', '<=', now()->addDays(30)->toDateString())
            ->orderBy('expiry_date')
            ->get()
            ->map(fn ($b) => [
                'stock_in_id' => $b->stock_in_id,
                'generic_name' => $b->medicine->generic_name ?? '—',
                'brand_name' => $b->medicine->brand_name ?? '',
                'batch_no' => $b->batch_no,
                'expiry_date' => $b->expiry_date,
                'remaining_quantity' => $b->remaining_quantity,
                'days_left' => (int) now()->diffInDays($b->expiry_date, false),
            ]);

        return Inertia::render('StockReceiving/Index', [
            'medicines' => Medicine::select('medicine_id', 'generic_name', 'brand_name', 'current_stock', 'price', 'dosage')->orderBy('generic_name')->get(),
            'suppliers' => Supplier::where('status', 'active')->orderBy('name')->get(['supplier_id', 'name']),
            'records' => $records,
            'expiringBatches' => $expiringBatches,
            'alerts' => $this->getAlerts(),
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

    public function destroy(Request $request, StockIn $stockIn)
    {
        abort_unless($request->user()->role === 'admin', 403, 'Only administrators can delete records.');

        $validated = $request->validate([
            'reason' => ['required', 'string', 'min:5', 'max:500'],
        ]);

        if ($stockIn->remaining_quantity < $stockIn->quantity) {
            return back()->withErrors([
                'delete' => 'This batch has already been partially dispensed and cannot be deleted. Use Dispose instead.',
            ]);
        }

        Medicine::where('medicine_id', $stockIn->medicine_id)
            ->decrement('current_stock', $stockIn->remaining_quantity);

        AuditLog::record(
            $request->user()->user_id,
            'DELETE_STOCK_IN',
            "Deleted stock-in record ID {$stockIn->stock_in_id}",
            null,
            $validated['reason'],
        );

        $stockIn->delete();

        return back()->with('success', 'Record deleted.');
    }

    public function disposeBatches(DisposeStockBatchesRequest $request)
    {
        StockIn::disposeBatches($request->validated()['batch_ids'], $request->user()->user_id);

        return back()->with('success', 'Selected batches disposed.');
    }

    private function getAlerts(): array
    {
        $alerts = [];
        $today = now()->toDateString();

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

        $expiringSoonCount = StockIn::where('remaining_quantity', '>', 0)
            ->whereDate('expiry_date', '>=', $today)
            ->whereDate('expiry_date', '<=', now()->addDays(30)->toDateString())
            ->count();
        if ($expiringSoonCount > 0) {
            $alerts[] = [
                'type' => 'warning',
                'icon' => 'fa-hourglass-half',
                'message' => "{$expiringSoonCount} batch(es) expiring within 30 days",
                'link' => '/medicine-list?filter=expiring',
            ];
        }

        $expiredCount = StockIn::where('remaining_quantity', '>', 0)
            ->whereDate('expiry_date', '<', $today)
            ->count();
        if ($expiredCount > 0) {
            $alerts[] = [
                'type' => 'danger',
                'icon' => 'fa-ban',
                'message' => "{$expiredCount} expired batch(es) still in stock",
                'link' => '/medicine-list?filter=expiring',
            ];
        }

        return $alerts;
    }
}
