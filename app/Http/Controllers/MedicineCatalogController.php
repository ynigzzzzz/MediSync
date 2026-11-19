<?php

namespace App\Http\Controllers;

use App\Http\Requests\DeleteMedicineRequest;
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
        $filter = in_array(
            $request->query('filter'),
            ['lowstock', 'outofstock', 'expiring', 'expired'],
            true,
        )
            ? $request->query('filter')
            : 'all';

        $search = $request->query('search', '');
        $category = $request->query('category', '');
        $type = $request->query('type', '');

        $stats = Medicine::getStats();

        $data = Medicine::getCatalogData(
            $filter,
            $search,
            $category,
            $type,
        );

        return Inertia::render('MedicineCatalog/Index', [
            'medicines' => $data['medicines'],
            'batches' => $data['batches'],
            'stats' => $stats,
            'attention' => $this->getAttentionAlerts($stats),
            'activeFilter' => $filter,
            'filters' => compact('search', 'category', 'type'),
        ]);
    }

    public function store(StoreMedicineRequest $request)
    {
        $medicine = Medicine::create([
            ...$request->validated(),
            'current_stock' => 0,
        ]);

        AuditLog::record(
            $request->user()->user_id,
            'CREATE_MEDICINE',
            "Added medicine: {$medicine->generic_name}",
            (int) $medicine->medicine_id,
        );

        return back()->with(
            'success',
            'Medicine added successfully.',
        );
    }

    public function update(
        UpdateMedicineRequest $request,
        Medicine $medicine,
    ) {
        $medicine->update($request->validated());

        AuditLog::record(
            $request->user()->user_id,
            'UPDATE_MEDICINE',
            "Updated medicine ID {$medicine->medicine_id}: {$medicine->generic_name}",
            (int) $medicine->medicine_id,
        );

        return back()->with(
            'success',
            'Medicine updated successfully.',
        );
    }

    public function destroy(
        DeleteMedicineRequest $request,
        Medicine $medicine,
    ) {
        $reason = $request->validated('reason');

        $deleted = DB::transaction(function () use (
            $request,
            $medicine,
            $reason,
        ) {
            $lockedMedicine = Medicine::query()
                ->whereKey($medicine->getKey())
                ->lockForUpdate()
                ->firstOrFail();

            // Never hide inventory that still has physical stock.
            $hasRemainingStock =
                (int) $lockedMedicine->current_stock > 0
                || StockIn::query()
                    ->where(
                        'medicine_id',
                        $lockedMedicine->medicine_id,
                    )
                    ->where('remaining_quantity', '>', 0)
                    ->exists();

            if ($hasRemainingStock) {
                return false;
            }

            $medicineId = (int) $lockedMedicine->medicine_id;
            $medicineName = $lockedMedicine->generic_name;

            // Soft delete: historical transactions remain intact.
            $lockedMedicine->delete();

            AuditLog::record(
                $request->user()->user_id,
                'DELETE_MEDICINE',
                "Deleted medicine: {$medicineName}",
                $medicineId,
                $reason,
            );

            return true;
        }, 3);

        if (! $deleted) {
            return back()->withErrors([
                'delete' => "Cannot delete '{$medicine->generic_name}' because it still has remaining stock. Dispense or dispose of all remaining batches first.",
            ]);
        }

        return back()->with(
            'success',
            'Medicine deleted successfully. Historical transactions have been preserved.',
        );
    }

    public function restore(Request $request, int $medicineId)
    {
        abort_unless(
            $request->user()->role === 'admin',
            403,
            'Only administrators can restore medicines.',
        );

        $medicineName = DB::transaction(function () use (
            $request,
            $medicineId,
        ) {
            $medicine = Medicine::onlyTrashed()
                ->whereKey($medicineId)
                ->lockForUpdate()
                ->firstOrFail();

            $medicine->restore();

            AuditLog::record(
                $request->user()->user_id,
                'RESTORE_MEDICINE',
                "Restored medicine ID {$medicine->medicine_id}: {$medicine->generic_name}",
                (int) $medicine->medicine_id,
            );

            return $medicine->generic_name;
        }, 3);

        return back()->with(
            'success',
            "{$medicineName} has been successfully restored.",
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

    private function getAttentionAlerts(array $stats): array
    {
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

        $expiringSoon = (int) ($stats['expiring'] ?? 0);

        if ($expiringSoon > 0) {
            $alerts[] = [
                'type' => 'warning',
                'icon' => 'fa-hourglass-half',
                'message' => "{$expiringSoon} batch(es) expiring within 30 days",
                'link' => '/medicine-list?filter=expiring',
            ];
        }

        $expired = (int) ($stats['expired'] ?? 0);

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
