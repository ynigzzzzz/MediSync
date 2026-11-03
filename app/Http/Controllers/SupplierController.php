<?php

namespace App\Http\Controllers;

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
        $suppliers = Supplier::query()
            ->filter($request->only('search', 'status'))
            ->orderBy('name')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Suppliers/Index', [
            'suppliers' => $suppliers,
            'stats' => [
                'total' => Supplier::count(),
                'active' => Supplier::where('status', 'active')->count(),
                'inactive' => Supplier::where('status', 'inactive')->count(),
            ],
            'filters' => [
                'search' => $request->query('search', ''),
                'status' => $request->query('status', 'all'),
            ],
        ]);
    }

    public function store(StoreSupplierRequest $request)
    {
        // Validation is handled automatically by StoreSupplierRequest
        $supplier = Supplier::create($request->validated());

        AuditLog::record(
            $request->user()->user_id,
            'CREATE_SUPPLIER',
            "Added supplier: {$supplier->name}",
            $supplier->supplier_id
        );

        return back()->with('success', "Supplier \"{$supplier->name}\" has been added.");
    }

    public function update(UpdateSupplierRequest $request, Supplier $supplier)
    {
        // Validation is handled automatically by UpdateSupplierRequest
        $supplier->update($request->validated());

        AuditLog::record(
            $request->user()->user_id,
            'UPDATE_SUPPLIER',
            "Updated supplier ID {$supplier->supplier_id}: {$supplier->name}",
            $supplier->supplier_id
        );

        return back()->with('success', 'Supplier updated successfully.');
    }

    public function destroy(Request $request, Supplier $supplier)
    {
        abort_unless($request->user()->role === 'admin', 403, 'Only administrators can delete suppliers.');

        $name = $supplier->name;
        $supplier->delete();

        AuditLog::record(
            $request->user()->user_id,
            'DELETE_SUPPLIER',
            "Deleted supplier: {$name}"
        );

        return back()->with('success', 'Supplier deleted successfully.');
    }
}
