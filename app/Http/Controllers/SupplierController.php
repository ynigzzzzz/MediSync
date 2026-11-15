<?php

namespace App\Http\Controllers;

use App\Http\Requests\DeleteSupplierRequest;
use App\Http\Requests\StoreSupplierRequest;
use App\Http\Requests\UpdateSupplierRequest;
use App\Models\AuditLog;
use App\Models\Supplier;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SupplierController extends Controller
{
    public function index(Request $request)
    {
        return Inertia::render('Suppliers/Index', [
            'suppliers' => Supplier::getIndexData($request->only('search', 'status')),
            'stats' => Supplier::getStats(),
            'filters' => [
                'search' => $request->query('search', ''),
                'status' => $request->query('status', 'all'),
            ],
        ]);
    }

    public function store(StoreSupplierRequest $request)
    {
        $supplier = Supplier::create($request->validated());

        AuditLog::record(
            $request->user()->user_id,
            'CREATE_SUPPLIER',
            "Added supplier: {$supplier->name}",
            $supplier->supplier_id,
        );

        return back()->with('success', "Supplier \"{$supplier->name}\" has been added.");
    }

    public function update(UpdateSupplierRequest $request, Supplier $supplier)
    {
        $supplier->update($request->validated());

        AuditLog::record(
            $request->user()->user_id,
            'UPDATE_SUPPLIER',
            "Updated supplier ID {$supplier->supplier_id}: {$supplier->name}",
            $supplier->supplier_id,
        );

        return back()->with('success', 'Supplier updated successfully.');
    }

    public function destroy(DeleteSupplierRequest $request, Supplier $supplier)
    {
        $name = $supplier->name;
        $supplier->delete();

        AuditLog::record(
            $request->user()->user_id,
            'DELETE_SUPPLIER',
            "Deleted supplier: {$name}",
            null,
            $request->validated('reason'),
        );

        return back()->with('success', 'Supplier deleted successfully.');
    }
}
