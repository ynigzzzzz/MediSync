<?php

namespace App\Http\Controllers;

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
        $filter = in_array($request->query('filter'), ['lowstock', 'outofstock', 'expiring'], true)
            ? $request->query('filter')
            : 'all';

        if ($filter === 'expiring') {
            $medicines = collect();
            $expiringBatches = StockIn::with('medicine:medicine_id,generic_name,brand_name')
                ->where('remaining_quantity', '>', 0)
                ->whereDate('expiry_date', '<=', now()->addDays(30)->toDateString())
                ->orderBy('expiry_date')
                ->paginate(15)->withQueryString();
        } else {
            $expiringBatches = null;
            $medicines = Medicine::query()
                ->filterStatus($filter)
                ->orderBy('generic_name')
                ->paginate(15)
                ->withQueryString();
        }

        return Inertia::render('MedicineCatalog/Index', [
            'medicines' => $medicines,
            'expiringBatches' => $expiringBatches,
            'stats' => Medicine::getStats(),
            'activeFilter' => $filter,
        ]);
    }

    public function store(StoreMedicineRequest $request)
    {
        $validated = $request->validated();

        $exists = Medicine::where('generic_name', $validated['generic_name'])
            ->where('brand_name', $validated['brand_name'])
            ->where('dosage', $validated['dosage'])
            ->exists();

        if ($exists) {
            return back()->withErrors([
                'generic_name' => 'This medicine already exists. To add more stock, please go to Stock Receiving.',
            ]);
        }

        $medicine = Medicine::create([...$validated, 'current_stock' => 0]);

        AuditLog::record(
            $request->user()->user_id,
            'CREATE_MEDICINE',
            "Added medicine: {$medicine->generic_name}"
        );

        return back()->with('message', 'Medicine added successfully.');
    }

    public function update(UpdateMedicineRequest $request, Medicine $medicine)
    {
        $medicine->update($request->validated());

        AuditLog::record(
            $request->user()->user_id,
            'UPDATE_MEDICINE',
            "Updated medicine ID {$medicine->medicine_id}: {$medicine->generic_name}"
        );

        return back()->with('message', 'Medicine updated successfully.');
    }

    public function destroy(Request $request, Medicine $medicine)
    {
        abort_unless($request->user()->role === 'admin', 403, 'Only administrators can delete medicines.');

        $name = $medicine->generic_name;
        $medicine->delete();

        AuditLog::record($request->user()->user_id, 'DELETE_MEDICINE', "Deleted medicine: {$name}");

        return back()->with('message', 'Medicine deleted successfully.');
    }

    public function disposeBatches(Request $request)
    {
        abort_unless(in_array($request->user()->role, ['admin', 'pharmacist']), 403);

        $data = $request->validate([
            'batch_ids' => ['required', 'array', 'min:1'],
            'batch_ids.*' => ['integer', 'exists:stock_in,stock_in_id'],
        ]);

        DB::transaction(function () use ($data, $request) {
            foreach ($data['batch_ids'] as $stockInId) {
                $batch = StockIn::where('stock_in_id', (int) $stockInId)->lockForUpdate()->first();
                if (! $batch) {
                    continue;
                }

                Medicine::where('medicine_id', $batch->medicine_id)
                    ->decrement('current_stock', $batch->remaining_quantity);

                DB::table('stock_out')->where('stock_in_id', $batch->stock_in_id)->delete();

                AuditLog::record(
                    $request->user()->user_id,
                    'DISPOSE_BATCH',
                    "Disposed batch {$batch->batch_no} (ID {$batch->stock_in_id}), removed {$batch->remaining_quantity} units",
                    $batch->medicine_id
                );

                $batch->delete();
            }
        });

        return back()->with('message', 'Selected batches disposed.');
    }
}
