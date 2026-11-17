<?php

namespace App\Http\Controllers;

use App\Http\Requests\DisposeStockBatchesRequest;
use App\Http\Requests\StoreMedicineRequest;
use App\Http\Requests\UpdateMedicineRequest;
use App\Models\AuditLog;
use App\Models\Medicine;
use App\Models\StockIn;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class MedicineCatalogController extends Controller
{
  public function index(Request $request)
{
    $filter = in_array($request->query('filter'), ['lowstock', 'outofstock', 'expiring', 'expired'], true)
        ? $request->query('filter')
        : 'all';

    $search   = $request->query('search', '');
    $category = $request->query('category', '');
    $type     = $request->query('type', '');

    $stats = Medicine::getStats();
    $data = Medicine::getCatalogData($filter, $search, $category, $type);

    return Inertia::render('MedicineCatalog/Index', [
        'medicines'    => $data['medicines'],
        'batches'      => $data['batches'],
        'stats'        => $stats,
        'attention'    => $this->getAttentionAlerts($stats),
        'activeFilter' => $filter,
        'filters'      => compact('search', 'category', 'type'),
    ]);
}

    public function store(StoreMedicineRequest $request)
    {
        $medicine = Medicine::create([...$request->validated(), 'current_stock' => 0]);

        AuditLog::record(
            $request->user()->user_id,
            'CREATE_MEDICINE',
            "Added medicine: {$medicine->generic_name}"
        );

        return back()->with('success', 'Medicine added successfully.');
    }

    public function update(UpdateMedicineRequest $request, Medicine $medicine)
    {
        $medicine->update($request->validated());

        AuditLog::record(
            $request->user()->user_id,
            'UPDATE_MEDICINE',
            "Updated medicine ID {$medicine->medicine_id}: {$medicine->generic_name}"
        );

        return back()->with('success', 'Medicine updated successfully.');
    }

    public function destroy(Request $request, Medicine $medicine)
    {
        abort_unless($request->user()->role === 'admin', 403, 'Only administrators can delete medicines.');

        $hasHistory = DB::table('stock_out')->where('medicine_id', $medicine->medicine_id)->exists()
            || DB::table('stock_in')->where('medicine_id', $medicine->medicine_id)->exists();

        if ($hasHistory) {
            return back()->withErrors([
                'delete' => "Cannot delete '{$medicine->generic_name}' — it has transaction history. Mark it out of stock instead.",
            ]);
        }

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

    private function getAttentionAlerts(array $stats): array
    {
        $today = now()->toDateString();
        $alerts = [];

        if ($stats['outofstock'] > 0) {
            $alerts[] = [
                'type' => 'danger',
                'icon' => 'fa-circle-xmark',
                'message' => "{$stats['outofstock']} medicine(s) out of stock",
                'link' => '/medicine-list?filter=outofstock',
            ];
        }

        if ($stats['lowstock'] > 0) {
            $alerts[] = [
                'type' => 'warning',
                'icon' => 'fa-triangle-exclamation',
                'message' => "{$stats['lowstock']} medicine(s) low on stock",
                'link' => '/medicine-list?filter=lowstock',
            ];
        }

        $expiringSoon = StockIn::where('remaining_quantity', '>', 0)
            ->whereDate('expiry_date', '>=', $today)
            ->whereDate('expiry_date', '<=', now()->addDays(30)->toDateString())
            ->count();

        if ($expiringSoon > 0) {
            $alerts[] = [
                'type' => 'warning',
                'icon' => 'fa-hourglass-half',
                'message' => "{$expiringSoon} batch(es) expiring within 30 days",
                'link' => '/medicine-list?filter=expiring',
            ];
        }

        $expired = StockIn::where('remaining_quantity', '>', 0)
            ->whereDate('expiry_date', '<', $today)
            ->count();

        if ($expired > 0) {
            $alerts[] = [
                'type' => 'danger',
                'icon' => 'fa-ban',
                'message' => "{$expired} expired batch(es) still in stock",
                'link' => '/medicine-list?filter=expired',
            ];
        }

        return $alerts;
    }
}