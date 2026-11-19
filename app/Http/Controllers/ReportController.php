<?php

namespace App\Http\Controllers;

use App\Models\Medicine;
use App\Models\StockIn;
use App\Models\StockOut;
use App\Models\Supplier;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class ReportController extends Controller
{
    private function authorizeAdmin(Request $request): void
    {
        abort_unless(
            $request->user()?->role === 'admin',
            403,
            'Only administrators can access Reports.',
        );
    }

    private function reportFilters(Request $request): array
    {
        $validated = $request->validate([
            'from' => ['nullable', 'date_format:Y-m-d'],
            'to' => ['nullable', 'date_format:Y-m-d'],
            'category' => ['nullable', 'string', 'max:100'],
            'supplier_id' => ['nullable', 'string', 'max:20'],
            'user_id' => ['nullable', 'string', 'max:20'],
            'tab' => [
                'nullable',
                'in:inventory,receiving,dispensing,suppliers,deletions',
            ],
        ]);

        $from = $validated['from'] ?? now()->subDays(29)->toDateString();
        $to = $validated['to'] ?? now()->toDateString();

        if ($from > $to) {
            throw ValidationException::withMessages([
                'to' => 'The ending date must not be earlier than the starting date.',
            ]);
        }

        $category = trim($validated['category'] ?? 'all') ?: 'all';
        $supplierId = $validated['supplier_id'] ?? 'all';
        $userId = $validated['user_id'] ?? 'all';

        if (
            $supplierId !== 'all'
            && ! Supplier::where('supplier_id', $supplierId)->exists()
        ) {
            throw ValidationException::withMessages([
                'supplier_id' => 'The selected supplier is invalid.',
            ]);
        }

        if (
            $userId !== 'all'
            && ! User::where('user_id', $userId)
                ->where('role', '!=', 'admin')
                ->exists()
        ) {
            throw ValidationException::withMessages([
                'user_id' => 'The selected dispensing user is invalid.',
            ]);
        }

        return [
            'from' => $from,
            'to' => $to,
            'category' => $category,
            'supplier_id' => $supplierId,
            'user_id' => $userId,
            'tab' => $validated['tab'] ?? 'inventory',
        ];
    }

    private function inventoryQuery(array $filters): Builder
    {
        $query = Medicine::queryWithAvailableStock();

        if ($filters['category'] !== 'all') {
            $query->where(
                'medicines.category',
                $filters['category'],
            );
        }

        return $query;
    }

    private function receivingQuery(array $filters): Builder
    {
        $query = StockIn::query()
            ->whereDate('stock_in.recorded_at', '>=', $filters['from'])
            ->whereDate('stock_in.recorded_at', '<=', $filters['to']);

        if ($filters['supplier_id'] !== 'all') {
            $supplier = Supplier::find($filters['supplier_id']);

            $query->where(function ($where) use ($filters, $supplier) {
                $where->where(
                    'stock_in.supplier_id',
                    $filters['supplier_id'],
                );

                // Include legacy receiving records that used the
                // free-text supplier column before supplier_id existed.
                if ($supplier) {
                    $where->orWhere(function ($legacy) use ($supplier) {
                        $legacy
                            ->whereNull('stock_in.supplier_id')
                            ->where('stock_in.supplier', $supplier->name);
                    });
                }
            });
        }

        return $query;
    }

    private function dispensingQuery(array $filters): Builder
    {
        $query = StockOut::query()
            ->whereDate('stock_out.dispensed_at', '>=', $filters['from'])
            ->whereDate('stock_out.dispensed_at', '<=', $filters['to']);

        if ($filters['user_id'] !== 'all') {
            $query->where(
                'stock_out.dispensed_by',
                $filters['user_id'],
            );
        }

        return $query;
    }

    private function receivingBySupplier(Builder $query)
    {
        return (clone $query)
            ->leftJoin(
                'suppliers as s',
                'stock_in.supplier_id',
                '=',
                's.supplier_id',
            )
            ->selectRaw(
                "COALESCE(NULLIF(TRIM(s.name), ''), NULLIF(TRIM(stock_in.supplier), ''), 'Unspecified') AS supplier",
            )
            ->selectRaw('COUNT(*) AS batches')
            ->selectRaw('COALESCE(SUM(stock_in.quantity), 0) AS units')
            ->selectRaw(
                'COALESCE(SUM(stock_in.quantity * stock_in.cost_price), 0) AS cost',
            )
            ->groupBy('s.name', 'stock_in.supplier')
            ->orderByDesc('units')
            ->get();
    }

    private function dispensingByMedicine(Builder $query)
    {
        return (clone $query)
            ->join(
                'medicines as m',
                'stock_out.medicine_id',
                '=',
                'm.medicine_id',
            )
            ->select('m.generic_name', 'm.brand_name')
            ->selectRaw('SUM(stock_out.quantity) AS units')
            ->groupBy('m.generic_name', 'm.brand_name')
            ->orderByDesc('units')
            ->limit(10)
            ->get()
            ->map(fn ($row) => [
                'name' => $row->generic_name
                    .($row->brand_name ? " ({$row->brand_name})" : ''),
                'units' => (int) $row->units,
            ]);
    }

    private function supplierSummary()
    {
        $totals = DB::table('stock_in')
            ->select('supplier_id')
            ->selectRaw('COUNT(*) AS batches')
            ->selectRaw('COALESCE(SUM(quantity), 0) AS units')
            ->selectRaw(
                'COALESCE(SUM(quantity * cost_price), 0) AS cost',
            )
            ->whereNotNull('supplier_id')
            ->groupBy('supplier_id');

        return Supplier::query()
            ->leftJoinSub(
                $totals,
                'stock_totals',
                function ($join) {
                    $join->on(
                        'suppliers.supplier_id',
                        '=',
                        'stock_totals.supplier_id',
                    );
                },
            )
            ->select(
                'suppliers.supplier_id',
                'suppliers.name',
                'suppliers.contact_person',
                'suppliers.phone',
                'suppliers.email',
                'suppliers.status',
            )
            ->selectRaw('COALESCE(stock_totals.batches, 0) AS batches')
            ->selectRaw('COALESCE(stock_totals.units, 0) AS units')
            ->selectRaw('COALESCE(stock_totals.cost, 0) AS cost')
            ->orderBy('suppliers.name')
            ->get()
            ->map(fn ($supplier) => [
                'supplier_id' => $supplier->supplier_id,
                'name' => $supplier->name,
                'contact_person' => $supplier->contact_person,
                'phone' => $supplier->phone,
                'email' => $supplier->email,
                'status' => $supplier->status,
                'batches' => (int) $supplier->batches,
                'units' => (int) $supplier->units,
                'cost' => (float) $supplier->cost,
            ]);
    }

    private function deletionsQuery(array $filters)
    {
        return DB::table('audit_log')
            ->leftJoin(
                'users as u',
                'audit_log.user_id',
                '=',
                'u.user_id',
            )
            ->whereIn('audit_log.action_type', [
                'DELETE_STOCK_IN',
                'DELETE_STOCK_OUT',
                'DELETE_MEDICINE',
                'DELETE_SUPPLIER',
                'DELETE_USER',
            ])
            ->whereDate('audit_log.created_at', '>=', $filters['from'])
            ->whereDate('audit_log.created_at', '<=', $filters['to'])
            ->select(
                'audit_log.log_id',
                'audit_log.action_type',
                'audit_log.description',
                'audit_log.reason',
                'audit_log.created_at',
                'u.full_name as user_name',
            );
    }

    private function deletedMedicines()
    {
        // Find the latest deletion audit record for each medicine.
        $latestDeletionLogs = DB::table('audit_log as deletion_logs')
            ->select('deletion_logs.reference_id')
            ->selectRaw('MAX(deletion_logs.log_id) AS log_id')
            ->where('deletion_logs.action_type', 'DELETE_MEDICINE')
            ->whereNotNull('deletion_logs.reference_id')
            ->groupBy('deletion_logs.reference_id');

        return Medicine::onlyTrashed()
            ->leftJoinSub(
                $latestDeletionLogs,
                'latest_deletion',
                function ($join) {
                    $join->on(
                        'medicines.medicine_id',
                        '=',
                        'latest_deletion.reference_id',
                    );
                },
            )
            ->leftJoin(
                'audit_log as deletion_log',
                'deletion_log.log_id',
                '=',
                'latest_deletion.log_id',
            )
            ->leftJoin(
                'users as deleted_user',
                'deletion_log.user_id',
                '=',
                'deleted_user.user_id',
            )
            ->select(
                'medicines.medicine_id',
                'medicines.generic_name',
                'medicines.brand_name',
                'medicines.category',
                'medicines.dosage',
                'medicines.type',
                'medicines.price',
                'medicines.current_stock',
                'medicines.deleted_at',
                'deletion_log.reason as deletion_reason',
                'deleted_user.full_name as deleted_by',
            )
            ->orderByDesc('medicines.deleted_at')
            ->get()
            ->map(fn ($medicine) => [
                'medicine_id' => (int) $medicine->medicine_id,
                'generic_name' => $medicine->generic_name,
                'brand_name' => $medicine->brand_name,
                'category' => $medicine->category,
                'dosage' => $medicine->dosage,
                'type' => $medicine->type,
                'price' => (float) $medicine->price,
                'current_stock' => (int) $medicine->current_stock,
                'deleted_at' => $medicine->deleted_at,
                'deleted_by' => $medicine->deleted_by ?? 'Unknown',
                'reason' => $medicine->deletion_reason ?? '—',
            ])
            ->values();
    }

    private function dailySeries(
        Builder $query,
        string $dateColumn,
        string $valueColumn,
        string $from,
        string $to,
    ): array {
        $rows = (clone $query)
            ->selectRaw(
                "DATE({$dateColumn}) AS report_date, COALESCE(SUM({$valueColumn}), 0) AS total",
            )
            ->groupBy('report_date')
            ->orderBy('report_date')
            ->get()
            ->keyBy('report_date');

        $series = [];

        $cursor = Carbon::parse($from)->startOfDay();
        $end = Carbon::parse($to)->startOfDay();

        while ($cursor->lte($end)) {
            $key = $cursor->toDateString();

            $series[] = [
                'date' => $key,
                'label' => $cursor->format('M j'),
                'value' => (int) ($rows[$key]->total ?? 0),
            ];

            $cursor->addDay();
        }

        return $series;
    }

    public function index(Request $request)
    {
        $this->authorizeAdmin($request);

        $filters = $this->reportFilters($request);

        /*
        |--------------------------------------------------------------------------
        | Overall Summary - All Time
        |--------------------------------------------------------------------------
        */

        $totalRevenue = (float) StockOut::sum('total_amount');

        // Only use the actual cost of the batch linked to a dispensing record.
        // Do not invent a cost using a percentage of the selling price.
        $costedDispensing = DB::table('stock_out')
            ->join(
                'stock_in',
                function ($join) {
                    $join->on(
                        'stock_out.stock_in_id',
                        '=',
                        'stock_in.stock_in_id',
                    )->on(
                        'stock_out.medicine_id',
                        '=',
                        'stock_in.medicine_id',
                    );
                },
            );

        $cogs = (float) (clone $costedDispensing)
            ->selectRaw(
                'COALESCE(SUM(stock_out.quantity * stock_in.cost_price), 0) AS total',
            )
            ->value('total');

        $costedDispensedUnits = (int) (clone $costedDispensing)
            ->sum('stock_out.quantity');

        $totalDispensedUnits = (int) StockOut::sum('quantity');

        $uncostedDispensedUnits = max(
            0,
            $totalDispensedUnits - $costedDispensedUnits,
        );

        $overall = [
            'total_revenue' => $totalRevenue,

            'total_spent' => (float) StockIn::query()
                ->selectRaw(
                    'COALESCE(SUM(quantity * cost_price), 0) AS total',
                )
                ->value('total'),

            'profit' => $totalRevenue - $cogs,

            'cogs' => $cogs,

            'costed_dispensed_units' => $costedDispensedUnits,

            'uncosted_dispensed_units' => $uncostedDispensedUnits,

            'cogs_coverage_percentage' => $totalDispensedUnits > 0
                ? round(
                    ($costedDispensedUnits / $totalDispensedUnits) * 100,
                    1,
                )
                : 100,

            'total_received_units' => (int) StockIn::sum('quantity'),

            'total_dispensed_units' => $totalDispensedUnits,
        ];

        $overall['top_medicines'] = StockOut::query()
            ->join(
                'medicines as m',
                'stock_out.medicine_id',
                '=',
                'm.medicine_id',
            )
            ->select('m.generic_name')
            ->selectRaw('SUM(stock_out.quantity) AS units')
            ->groupBy('m.generic_name')
            ->orderByDesc('units')
            ->limit(5)
            ->get()
            ->map(fn ($row) => [
                'name' => $row->generic_name,
                'value' => (int) $row->units,
            ]);

        /*
        |--------------------------------------------------------------------------
        | Inventory - Usable Stock
        |--------------------------------------------------------------------------
        */

        $inventoryQuery = $this->inventoryQuery($filters);

        // Aggregate through a subquery so the computed available_stock
        // column can safely be used in the outer query.
        $inventoryStats = DB::query()
            ->fromSub(
                (clone $inventoryQuery)->toBase(),
                'inventory_report',
            )
            ->selectRaw('COUNT(*) AS total_medicines')
            ->selectRaw(
                'COALESCE(SUM(CASE WHEN available_stock BETWEEN 1 AND 49 THEN 1 ELSE 0 END), 0) AS low_stock',
            )
            ->selectRaw(
                'COALESCE(SUM(CASE WHEN available_stock <= 0 THEN 1 ELSE 0 END), 0) AS out_of_stock',
            )
            ->selectRaw(
                'COALESCE(SUM(available_stock), 0) AS usable_units',
            )
            ->selectRaw(
                'COALESCE(SUM(current_stock), 0) AS physical_units',
            )
            ->selectRaw(
                'COALESCE(SUM(available_stock * price), 0) AS valuation',
            )
            ->first();

        $inventoryRows = (clone $inventoryQuery)
            ->orderBy('medicines.generic_name')
            ->get()
            ->map(function ($medicine) {
                $availableStock = (int) $medicine->available_stock;

                return [
                    'medicine_id' => $medicine->medicine_id,
                    'generic_name' => $medicine->generic_name,
                    'brand_name' => $medicine->brand_name,
                    'dosage' => $medicine->dosage,
                    'category' => $medicine->category,
                    'available_stock' => $availableStock,
                    'physical_stock' => (int) $medicine->current_stock,
                    'price' => (float) $medicine->price,
                    'stock_value' => $availableStock
                        * (float) $medicine->price,
                    'status' => $availableStock <= 0
                        ? 'out'
                        : ($availableStock < 50 ? 'low' : 'ok'),
                ];
            });

        $totalMedicines = (int) ($inventoryStats->total_medicines ?? 0);
        $lowStock = (int) ($inventoryStats->low_stock ?? 0);
        $outOfStock = (int) ($inventoryStats->out_of_stock ?? 0);

        $inventory = [
            'total_medicines' => $totalMedicines,
            'low_stock' => $lowStock,
            'out_of_stock' => $outOfStock,
            'usable_units' => (int) ($inventoryStats->usable_units ?? 0),
            'physical_units' => (int) ($inventoryStats->physical_units ?? 0),
            'valuation' => (float) ($inventoryStats->valuation ?? 0),

            'status_distribution' => [
                [
                    'name' => 'OK',
                    'value' => max(
                        0,
                        $totalMedicines - $lowStock - $outOfStock,
                    ),
                ],
                [
                    'name' => 'Low Stock',
                    'value' => $lowStock,
                ],
                [
                    'name' => 'Out of Stock',
                    'value' => $outOfStock,
                ],
            ],

            'rows' => $inventoryRows,

            'categories' => Medicine::query()
                ->whereNotNull('category')
                ->whereRaw("TRIM(category) <> ''")
                ->distinct()
                ->orderBy('category')
                ->pluck('category'),
        ];

        /*
        |--------------------------------------------------------------------------
        | Receiving
        |--------------------------------------------------------------------------
        */

        $recvQuery = $this->receivingQuery($filters);

        $receiving = [
            'total_batches' => (clone $recvQuery)->count(),
            'total_units' => (int) (clone $recvQuery)->sum('quantity'),
            'total_cost' => (float) (clone $recvQuery)
                ->sum(DB::raw('quantity * cost_price')),

            'by_supplier' => $this->receivingBySupplier($recvQuery),

            'by_medicine' => (clone $recvQuery)
                ->join(
                    'medicines as m',
                    'stock_in.medicine_id',
                    '=',
                    'm.medicine_id',
                )
                ->select('m.generic_name', 'm.brand_name')
                ->selectRaw('SUM(stock_in.quantity) AS units')
                ->groupBy('m.generic_name', 'm.brand_name')
                ->orderByDesc('units')
                ->limit(10)
                ->get()
                ->map(fn ($row) => [
                    'name' => $row->generic_name
                        .($row->brand_name ? " ({$row->brand_name})" : ''),
                    'units' => (int) $row->units,
                ]),

            'daily' => $this->dailySeries(
                $recvQuery,
                'stock_in.recorded_at',
                'stock_in.quantity',
                $filters['from'],
                $filters['to'],
            ),

            'suppliers_list' => Supplier::orderBy('name')
                ->get(['supplier_id', 'name']),
        ];

        /*
        |--------------------------------------------------------------------------
        | Dispensing
        |--------------------------------------------------------------------------
        */

        $dispQuery = $this->dispensingQuery($filters);

        $dispensing = [
            'total_records' => (clone $dispQuery)->count(),

            'total_units' => (int) (clone $dispQuery)->sum('quantity'),

            'total_value' => (float) (clone $dispQuery)
                ->sum('total_amount'),

            'by_medicine' => $this->dispensingByMedicine($dispQuery),

            'by_user' => (clone $dispQuery)
                ->join(
                    'users as u',
                    'stock_out.dispensed_by',
                    '=',
                    'u.user_id',
                )
                ->select('u.user_id', 'u.full_name')
                ->selectRaw('COUNT(stock_out.stock_out_id) AS records')
                ->selectRaw('SUM(stock_out.quantity) AS units')
                ->groupBy('u.user_id', 'u.full_name')
                ->orderByDesc('units')
                ->get()
                ->map(fn ($row) => [
                    'user_id' => $row->user_id,
                    'user' => $row->full_name,
                    'records' => (int) $row->records,
                    'units' => (int) $row->units,
                ]),

            'daily' => $this->dailySeries(
                $dispQuery,
                'stock_out.dispensed_at',
                'stock_out.quantity',
                $filters['from'],
                $filters['to'],
            ),

            'users_list' => User::where('role', '!=', 'admin')
                ->orderBy('full_name')
                ->get(['user_id', 'full_name']),
        ];

        /*
        |--------------------------------------------------------------------------
        | Suppliers
        |--------------------------------------------------------------------------
        */

        $supplierSummary = $this->supplierSummary();

        /*
        |--------------------------------------------------------------------------
        | Deletion History
        |--------------------------------------------------------------------------
        */

        $typeMap = [
            'DELETE_STOCK_IN' => 'Stock-In',
            'DELETE_STOCK_OUT' => 'Stock-Out',
            'DELETE_MEDICINE' => 'Medicine',
            'DELETE_SUPPLIER' => 'Supplier',
            'DELETE_USER' => 'User',
        ];

        $deletionsQuery = $this->deletionsQuery($filters);

        $deletions = [
            'total' => (clone $deletionsQuery)->count(),

            'rows' => (clone $deletionsQuery)
                ->orderByDesc('audit_log.created_at')
                ->limit(500)
                ->get()
                ->map(fn ($row) => [
                    'log_id' => $row->log_id,
                    'type' => $typeMap[$row->action_type]
                        ?? $row->action_type,
                    'description' => $row->description,
                    'reason' => $row->reason ?? '—',
                    'user_name' => $row->user_name ?? 'System',
                    'created_at' => $row->created_at,
                ]),
        ];

        $typeMap = [
            'DELETE_STOCK_IN' => 'Stock-In',
            'DELETE_STOCK_OUT' => 'Stock-Out',
            'DELETE_MEDICINE' => 'Medicine',
            'DELETE_SUPPLIER' => 'Supplier',
            'DELETE_USER' => 'User',
        ];

        $deletionsQuery = $this->deletionsQuery($filters);

        $deletions = [
            'total' => (clone $deletionsQuery)->count(),

            'rows' => (clone $deletionsQuery)
                ->orderByDesc('audit_log.created_at')
                ->limit(500)
                ->get()
                ->map(fn ($row) => [
                    'log_id' => $row->log_id,
                    'type' => $typeMap[$row->action_type]
                        ?? $row->action_type,
                    'description' => $row->description,
                    'reason' => $row->reason ?? '—',
                    'user_name' => $row->user_name ?? 'System',
                    'created_at' => $row->created_at,
                ]),
        ];

        $deletedMedicines = $this->deletedMedicines();

        return Inertia::render('Reports/Index', [
            'deletions' => $deletions,
            'deletedMedicines' => $deletedMedicines,
            'inventory' => $inventory,
            'receiving' => $receiving,
            'dispensing' => $dispensing,
            'supplierSummary' => $supplierSummary,
            'overall' => $overall,

            'range' => [
                'from' => $filters['from'],
                'to' => $filters['to'],
            ],

            'filters' => [
                'category' => $filters['category'],
                'supplier_id' => $filters['supplier_id'],
                'user_id' => $filters['user_id'],
            ],
        ]);
    }

    public function print(Request $request)
    {
        $this->authorizeAdmin($request);

        $filters = $this->reportFilters($request);
        $tab = $filters['tab'];

        $medicines = $this->inventoryQuery($filters)
            ->orderBy('medicines.generic_name')
            ->get();

        $receivingRows = $this->receivingBySupplier(
            $this->receivingQuery($filters),
        );

        $dispensingRows = (clone $this->dispensingQuery($filters))
            ->join(
                'medicines as m',
                'stock_out.medicine_id',
                '=',
                'm.medicine_id',
            )
            ->select('m.generic_name', 'm.brand_name')
            ->selectRaw('SUM(stock_out.quantity) AS units')
            ->groupBy('m.generic_name', 'm.brand_name')
            ->orderByDesc('units')
            ->get();

        $suppliers = Supplier::orderBy('name')
            ->get([
                'name',
                'contact_person',
                'phone',
                'email',
                'status',
            ]);

        $deletions = $this->deletionsQuery($filters)
            ->orderByDesc('audit_log.created_at')
            ->get();

        return view('reports.print', compact(
            'tab',
            'filters',
            'medicines',
            'receivingRows',
            'dispensingRows',
            'suppliers',
            'deletions',
        ) + [
            'from' => $filters['from'],
            'to' => $filters['to'],
        ]);
    }

    private function csvValue(mixed $value): mixed
    {
        if ($value instanceof \DateTimeInterface) {
            return $value->format('Y-m-d H:i:s');
        }

        if (! is_string($value)) {
            return $value ?? '';
        }

        // Prevent spreadsheet formula injection from text fields.
        if (preg_match('/^[\s]*[=+\-@]/u', $value)) {
            return "'".$value;
        }

        return $value;
    }

    private function writeCsvRow($stream, array $values): void
    {
        fputcsv(
            $stream,
            array_map(
                fn ($value) => $this->csvValue($value),
                $values,
            ),
        );
    }

    public function exportCsv(Request $request)
    {
        $this->authorizeAdmin($request);

        $filters = $this->reportFilters($request);
        $tab = $filters['tab'];

        $filename = "medisync_{$tab}_{$filters['from']}_to_{$filters['to']}.csv";

        return response()->streamDownload(
            function () use ($tab, $filters) {
                $out = fopen('php://output', 'w');

                if ($out === false) {
                    return;
                }

                // UTF-8 BOM for proper Excel compatibility.
                fwrite($out, "\xEF\xBB\xBF");

                $this->writeCsvRow($out, [
                    'MediSync Report',
                    ucfirst($tab),
                ]);

                $this->writeCsvRow($out, [
                    'Date From',
                    $filters['from'],
                    'Date To',
                    $filters['to'],
                    'Generated At',
                    now()->toDateTimeString(),
                ]);

                $this->writeCsvRow($out, []);

                if ($tab === 'inventory') {
                    $this->writeCsvRow($out, [
                        'Medicine ID',
                        'Generic Name',
                        'Brand Name',
                        'Dosage',
                        'Category',
                        'Available Stock',
                        'Physical Stock',
                        'Unit Price',
                        'Stock Value',
                        'Status',
                    ]);

                    foreach (
                        $this->inventoryQuery($filters)
                            ->orderBy('medicines.generic_name')
                            ->cursor() as $medicine
                    ) {
                        $available = (int) $medicine->available_stock;

                        $status = $available <= 0
                            ? 'Out of Stock'
                            : ($available < 50 ? 'Low Stock' : 'OK');

                        $this->writeCsvRow($out, [
                            $medicine->medicine_id,
                            $medicine->generic_name,
                            $medicine->brand_name,
                            $medicine->dosage,
                            $medicine->category,
                            $available,
                            $medicine->current_stock,
                            $medicine->price,
                            $available * (float) $medicine->price,
                            $status,
                        ]);
                    }
                } elseif ($tab === 'receiving') {
                    $this->writeCsvRow($out, [
                        'Stock-In ID',
                        'Date Received',
                        'Batch Number',
                        'Medicine',
                        'Brand',
                        'Supplier',
                        'Quantity Received',
                        'Remaining Quantity',
                        'Expiry Date',
                        'Unit Cost',
                        'Total Cost',
                        'Received By',
                    ]);

                    $rows = $this->receivingQuery($filters)
                        ->leftJoin(
                            'suppliers as s',
                            'stock_in.supplier_id',
                            '=',
                            's.supplier_id',
                        )
                        ->join(
                            'medicines as m',
                            'stock_in.medicine_id',
                            '=',
                            'm.medicine_id',
                        )
                        ->leftJoin(
                            'users as u',
                            'stock_in.received_by',
                            '=',
                            'u.user_id',
                        )
                        ->select(
                            'stock_in.stock_in_id',
                            'stock_in.recorded_at',
                            'stock_in.batch_no',
                            'm.generic_name',
                            'm.brand_name',
                            'stock_in.quantity',
                            'stock_in.remaining_quantity',
                            'stock_in.expiry_date',
                            'stock_in.cost_price',
                            'u.full_name as received_by',
                        )
                        ->selectRaw(
                            "COALESCE(NULLIF(TRIM(s.name), ''), NULLIF(TRIM(stock_in.supplier), ''), 'Unspecified') AS supplier_name",
                        )
                        ->orderBy('stock_in.recorded_at')
                        ->cursor();

                    foreach ($rows as $row) {
                        $this->writeCsvRow($out, [
                            $row->stock_in_id,
                            $row->recorded_at,
                            $row->batch_no,
                            $row->generic_name,
                            $row->brand_name,
                            $row->supplier_name,
                            $row->quantity,
                            $row->remaining_quantity,
                            $row->expiry_date,
                            $row->cost_price,
                            (float) $row->quantity * (float) $row->cost_price,
                            $row->received_by,
                        ]);
                    }
                } elseif ($tab === 'dispensing') {
                    $this->writeCsvRow($out, [
                        'Stock-Out ID',
                        'Date Dispensed',
                        'Medicine',
                        'Brand',
                        'Patient',
                        'Prescription Number',
                        'Quantity',
                        'Selling Price',
                        'Total Amount',
                        'Batch Cost Per Unit',
                        'Cost of Goods Sold',
                        'Dispensed By',
                    ]);

                    $rows = $this->dispensingQuery($filters)
                        ->join(
                            'medicines as m',
                            'stock_out.medicine_id',
                            '=',
                            'm.medicine_id',
                        )
                        ->leftJoin(
                            'users as u',
                            'stock_out.dispensed_by',
                            '=',
                            'u.user_id',
                        )
                        ->leftJoin(
                            'stock_in as si',
                            function ($join) {
                                $join->on(
                                    'stock_out.stock_in_id',
                                    '=',
                                    'si.stock_in_id',
                                )->on(
                                    'stock_out.medicine_id',
                                    '=',
                                    'si.medicine_id',
                                );
                            },
                        )
                        ->select(
                            'stock_out.stock_out_id',
                            'stock_out.dispensed_at',
                            'm.generic_name',
                            'm.brand_name',
                            'stock_out.patient_name',
                            'stock_out.prescription_no',
                            'stock_out.quantity',
                            'stock_out.price',
                            'stock_out.total_amount',
                            'si.cost_price as batch_cost',
                            'u.full_name as dispensed_by',
                        )
                        ->orderBy('stock_out.dispensed_at')
                        ->cursor();

                    foreach ($rows as $row) {
                        $batchCost = $row->batch_cost;

                        $this->writeCsvRow($out, [
                            $row->stock_out_id,
                            $row->dispensed_at,
                            $row->generic_name,
                            $row->brand_name,
                            $row->patient_name,
                            $row->prescription_no,
                            $row->quantity,
                            $row->price,
                            $row->total_amount,
                            $batchCost,
                            $batchCost !== null
                                ? (float) $row->quantity * (float) $batchCost
                                : '',
                            $row->dispensed_by,
                        ]);
                    }
                } elseif ($tab === 'suppliers') {
                    $this->writeCsvRow($out, [
                        'Supplier ID',
                        'Supplier Name',
                        'Contact Person',
                        'Phone',
                        'Email',
                        'Status',
                        'Total Batches',
                        'Total Units Received',
                        'Total Receiving Cost',
                    ]);

                    foreach ($this->supplierSummary() as $supplier) {
                        $this->writeCsvRow($out, [
                            $supplier['supplier_id'],
                            $supplier['name'],
                            $supplier['contact_person'],
                            $supplier['phone'],
                            $supplier['email'],
                            $supplier['status'],
                            $supplier['batches'],
                            $supplier['units'],
                            $supplier['cost'],
                        ]);
                    }
                } elseif ($tab === 'deletions') {
                    $this->writeCsvRow($out, [
                        'Log ID',
                        'Date',
                        'Type',
                        'Description',
                        'Reason',
                        'Deleted By',
                    ]);

                    $typeMap = [
                        'DELETE_STOCK_IN' => 'Stock-In',
                        'DELETE_STOCK_OUT' => 'Stock-Out',
                        'DELETE_MEDICINE' => 'Medicine',
                        'DELETE_SUPPLIER' => 'Supplier',
                        'DELETE_USER' => 'User',
                    ];

                    foreach (
                        $this->deletionsQuery($filters)
                            ->orderByDesc('audit_log.created_at')
                            ->cursor() as $row
                    ) {
                        $this->writeCsvRow($out, [
                            $row->log_id,
                            $row->created_at,
                            $typeMap[$row->action_type] ?? $row->action_type,
                            $row->description,
                            $row->reason,
                            $row->user_name ?? 'System',
                        ]);
                    }
                }

                fclose($out);
            },
            $filename,
            [
                'Content-Type' => 'text/csv; charset=UTF-8',
            ],
        );
    }
}
