<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\Medicine;
use App\Models\StockIn;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class MedicineListController extends Controller
{
    public function index(Request $request)
    {
        $filter = in_array($request->query('filter'), ['lowstock', 'outofstock'], true)
            ? $request->query('filter')
            : 'all';

        $query = Medicine::orderBy('generic_name');

        if ($filter === 'lowstock') {
            $query->whereBetween('current_stock', [1, 49]);
        } elseif ($filter === 'outofstock') {
            $query->where('current_stock', 0);
        }

        $medicines = $query->paginate(15)->withQueryString();

        // Stat-card counts are always on the FULL dataset, never the page.
        $totalMedicines  = Medicine::count();
        $lowStockCount   = Medicine::whereBetween('current_stock', [1, 49])->count();
        $outOfStockCount = Medicine::where('current_stock', 0)->count();

        return Inertia::render('MedicineList/Index', [
            'medicines'       => $medicines,
            'totalMedicines'  => $totalMedicines,
            'lowStockCount'   => $lowStockCount,
            'outOfStockCount' => $outOfStockCount,
            'activeFilter'    => $filter,
        ]);
    }

    public function store(Request $request)
    {
        abort_if($request->user()->role === 'assistant', 403, 'You do not have permission to add medicines.');

        $validated = $request->validate([
            'generic_name' => ['required', 'string', 'max:255'],
            'brand_name'   => ['nullable', 'string', 'max:255'],
            'type'         => ['nullable', 'string', 'max:255'],
            'category'     => ['nullable', 'string', 'max:255'],
            'dosage'       => ['nullable', 'string', 'max:255'],
            'price'        => ['required', 'numeric', 'min:0'],
        ]);

        $exists = Medicine::where('generic_name', $validated['generic_name'])
            ->where('brand_name', $validated['brand_name'] ?? '')
            ->where('dosage', $validated['dosage'] ?? '')
            ->exists();

        if ($exists) {
            return back()->withErrors([
                'generic_name' => 'This medicine already exists. To add more stock, please go to Stock Receiving.',
            ]);
        }

        Medicine::create([...$validated, 'current_stock' => 0]);

        AuditLog::record(
            $request->user()->user_id,
            'CREATE_MEDICINE',
            "Added medicine: {$validated['generic_name']}"
        );

        return back()->with('message', 'Medicine added successfully.');
    }

    public function update(Request $request, Medicine $medicine)
    {
        abort_if($request->user()->role === 'assistant', 403, 'You do not have permission to edit medicines.');

        $validated = $request->validate([
            'generic_name' => ['required', 'string', 'max:255'],
            'brand_name'   => ['nullable', 'string', 'max:255'],
            'type'         => ['nullable', 'string', 'max:255'],
            'category'     => ['nullable', 'string', 'max:255'],
            'dosage'       => ['nullable', 'string', 'max:255'],
            'price'        => ['required', 'numeric', 'min:0'],
        ]);

        $medicine->update($validated);

        AuditLog::record(
            $request->user()->user_id,
            'UPDATE_MEDICINE',
            "Updated medicine ID {$medicine->medicine_id}: {$medicine->generic_name}"
        );

        return back()->with('message', 'Medicine updated successfully.');
    }

    public function destroy(Request $request, Medicine $medicine)
    {
        abort_if($request->user()->role === 'assistant', 403, 'You do not have permission to delete medicines.');

        $name = $medicine->generic_name;
        $medicine->delete();

        AuditLog::record($request->user()->user_id, 'DELETE_MEDICINE', "Deleted medicine: {$name}");

        return back()->with('message', 'Medicine deleted successfully.');
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