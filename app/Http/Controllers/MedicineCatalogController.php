<?php

namespace App\Http\Controllers;

use App\Http\Requests\DeleteMedicineRequest;
use App\Http\Requests\DisposeStockBatchesRequest;
use App\Http\Requests\StoreMedicineRequest;
use App\Http\Requests\UpdateMedicineRequest;
use App\Models\AuditLog;
use App\Models\Medicine;
use App\Models\StockIn;
use App\Services\CatalogService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class MedicineCatalogController extends Controller
{
    public function index(Request $request)
    {
        $filter = $request->query('filter', 'all');
        $search = $request->query('search', '');
        $category = $request->query('category', '');
        $type = $request->query('type', '');

        $data = Medicine::getCatalogData($filter, $search, $category, $type);

        return Inertia::render('MedicineCatalog/Index', [
            'medicines' => $data['medicines'],
            'batches' => $data['batches'],
            'stats' => Medicine::getStats(),
            'attention' => CatalogService::getAttentionAlerts(),
            'activeFilter' => $filter,
            'filters' => compact('search', 'category', 'type'),
        ]);
    }

    public function store(StoreMedicineRequest $request)
    {
        $medicine = Medicine::create([...$request->validated(), 'current_stock' => 0]);
        AuditLog::record($request->user()->user_id, 'CREATE_MEDICINE', "Added medicine: {$medicine->generic_name}");

        return back()->with('success', 'Medicine added successfully.');
    }

    public function update(UpdateMedicineRequest $request, Medicine $medicine)
    {
        $medicine->update($request->validated());
        AuditLog::record($request->user()->user_id, 'UPDATE_MEDICINE', "Updated medicine ID {$medicine->medicine_id}: {$medicine->generic_name}");

        return back()->with('success', 'Medicine updated successfully.');
    }

    public function destroy(DeleteMedicineRequest $request, Medicine $medicine)
    {
        $name = $medicine->generic_name;
        $medicine->delete();

        AuditLog::record($request->user()->user_id, 'DELETE_MEDICINE', "Deleted medicine: {$name}", null, $request->validated('reason'));

        return back()->with('success', 'Medicine deleted successfully.');
    }

    public function disposeBatches(DisposeStockBatchesRequest $request)
    {
        StockIn::disposeBatches($request->validated()['batch_ids'], $request->user()->user_id);

        return back()->with('success', 'Selected batches disposed.');
    }
}
