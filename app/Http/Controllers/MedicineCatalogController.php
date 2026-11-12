<?php

namespace App\Http\Controllers;

use App\Http\Requests\DisposeStockBatchesRequest;
use App\Http\Requests\StoreMedicineRequest;
use App\Http\Requests\UpdateMedicineRequest;
use App\Models\AuditLog;
use App\Models\Medicine;
use App\Models\StockIn;
use Illuminate\Http\Request;
use Inertia\Inertia;

class MedicineCatalogController extends Controller
{
    public function index(Request $request)
    {
        $filter = in_array($request->query('filter'), ['lowstock', 'outofstock', 'expiring'], true)
            ? $request->query('filter')
            : 'all';

        if ($filter === 'expiring') {
            $medicines = collect();
            $expiringBatches = StockIn::with('medicine:medicine_id,generic_name,brand_name')
                ->where('remaining_quantity', '>', 0)
                ->whereDate('expiry_date', '<=', now()->addDays(30)->toDateString())
                ->orderBy('expiry_date')
                ->paginate(15)
                ->withQueryString();
        } else {
            $expiringBatches = null;
            $medicines = Medicine::query()
                ->filterStatus($filter)
                ->orderBy('generic_name')
                ->paginate(15)
                ->withQueryString();
        }

        $stats = Medicine::getStats();
        $today = now()->toDateString();
        $attention = [];

        if ($stats['outofstock'] > 0) {
            $attention[] = [
                'type' => 'danger',
                'icon' => 'fa-circle-xmark',
                'message' => "{$stats['outofstock']} medicine(s) out of stock",
                'link' => '/medicine-list?filter=outofstock',
            ];
        }

        if ($stats['lowstock'] > 0) {
            $attention[] = [
                'type' => 'warning',
                'icon' => 'fa-triangle-exclamation',
                'message' => "{$stats['lowstock']} medicine(s) low on stock",
                'link' => '/medicine-list?filter=lowstock',
            ];
        }

        $expiringSoonCount = StockIn::where('remaining_quantity', '>', 0)
            ->whereDate('expiry_date', '>=', $today)
            ->whereDate('expiry_date', '<=', now()->addDays(30)->toDateString())
            ->count();

        if ($expiringSoonCount > 0) {
            $attention[] = [
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
            $attention[] = [
                'type' => 'danger',
                'icon' => 'fa-ban',
                'message' => "{$expiredCount} expired batch(es) still in stock",
                'link' => '/medicine-list?filter=expiring',
            ];
        }

        return Inertia::render('MedicineCatalog/Index', [
            'medicines' => $medicines,
            'expiringBatches' => $expiringBatches,
            'stats' => $stats,
            'attention' => $attention,
            'activeFilter' => $filter,
        ]);
    }

    public function store(StoreMedicineRequest $request)
    {
        $medicine = Medicine::create([...$request->validated(), 'current_stock' => 0]);

        AuditLog::record(
            $request->user()->user_id,
            'CREATE_MEDICINE',
            "Added medicine: {$medicine->generic_name}",
        );

        return back()->with('success', 'Medicine added successfully.');
    }

    public function update(UpdateMedicineRequest $request, Medicine $medicine)
    {
        $medicine->update($request->validated());

        AuditLog::record(
            $request->user()->user_id,
            'UPDATE_MEDICINE',
            "Updated medicine ID {$medicine->medicine_id}: {$medicine->generic_name}",
        );

        return back()->with('success', 'Medicine updated successfully.');
    }

    public function destroy(Request $request, Medicine $medicine)
    {
        abort_unless($request->user()->role === 'admin', 403, 'Only administrators can delete medicines.');

        $name = $medicine->generic_name;
        $medicine->delete();

        AuditLog::record($request->user()->user_id, 'DELETE_MEDICINE', "Deleted medicine: {$name}");

        return back()->with('success', 'Medicine deleted successfully.');
    }

    public function disposeBatches(DisposeStockBatchesRequest $request)
    {
        StockIn::disposeBatches($request->validated()['batch_ids'], $request->user()->user_id);

        return back()->with('success', 'Selected batches disposed.');
    }
}
