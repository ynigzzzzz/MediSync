<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\Supplier;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class SupplierController extends Controller
{
    public function index(Request $request)
    {
        $search = trim((string) $request->query('search', ''));
        $status = $request->query('status', 'all');

        $suppliers = Supplier::query()
            ->when($search !== '', function ($q) use ($search) {
                $q->where(function ($sub) use ($search) {
                    $sub->where('name', 'ILIKE', "%{$search}%")
                        ->orWhere('contact_person', 'ILIKE', "%{$search}%")
                        ->orWhere('email', 'ILIKE', "%{$search}%")
                        ->orWhere('phone', 'ILIKE', "%{$search}%");
                });
            })
            ->when($status !== 'all' && $status !== '', fn ($q) => $q->where('status', $status))
            ->orderBy('name')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Suppliers/Index', [
            'suppliers' => $suppliers,
            'stats' => [
                'total'    => Supplier::count(),
                'active'   => Supplier::where('status', 'active')->count(),
                'inactive' => Supplier::where('status', 'inactive')->count(),
            ],
            'filters' => [
                'search' => $search,
                'status' => $status ?: 'all',
            ],
        ]);
    }

    public function store(Request $request)
    {
        abort_if($request->user()->role === 'assistant', 403, 'Assistants cannot add suppliers.');

        $validated = $request->validate([
            'name'           => ['required', 'string', 'max:100'],
            'contact_person' => ['nullable', 'string', 'max:100'],
            'phone'          => ['nullable', 'string', 'max:30'],
            'email'          => ['nullable', 'email', 'max:100'],
            'address'        => ['nullable', 'string', 'max:255'],
            'status'         => ['required', Rule::in(['active', 'inactive'])],
        ]);

        $supplier = Supplier::create($validated);

        AuditLog::record(
            $request->user()->user_id,
            'CREATE_SUPPLIER',
            "Added supplier: {$supplier->name}",
            $supplier->supplier_id
        );

        return back()->with('success', "Supplier \"{$supplier->name}\" has been added.");
    }

    public function update(Request $request, Supplier $supplier)
    {
        abort_if($request->user()->role === 'assistant', 403, 'Assistants cannot edit suppliers.');

        $validated = $request->validate([
            'name'           => ['required', 'string', 'max:100'],
            'contact_person' => ['nullable', 'string', 'max:100'],
            'phone'          => ['nullable', 'string', 'max:30'],
            'email'          => ['nullable', 'email', 'max:100'],
            'address'        => ['nullable', 'string', 'max:255'],
            'status'         => ['required', Rule::in(['active', 'inactive'])],
        ]);

        $supplier->update($validated);

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