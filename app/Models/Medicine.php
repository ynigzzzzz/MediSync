<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Medicine extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'medicines';

    protected $primaryKey = 'medicine_id';

    public $timestamps = false;

    protected $fillable = [
        'generic_name',
        'brand_name',
        'category',
        'dosage',
        'price',
        'current_stock',
        'type',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'current_stock' => 'integer',
        'created_at' => 'datetime',
    ];

    // Relationships

    public function stockIn()
    {
        return $this->hasMany(
            StockIn::class,
            'medicine_id',
            'medicine_id',
        );
    }

    public function stockOut()
    {
        return $this->hasMany(
            StockOut::class,
            'medicine_id',
            'medicine_id',
        );
    }

    // Available Stock Query

    protected static function availableStockByMedicineQuery(
        string $today,
    ) {
        return StockIn::query()
            ->select('medicine_id')
            ->selectRaw(
                'SUM(remaining_quantity) AS available_stock',
            )
            ->where('remaining_quantity', '>', 0)
            ->where('expiry_date', '>=', $today)
            ->whereNull('disposed_at')
            ->groupBy('medicine_id');
    }

    /**
     * Returns medicines joined with their calculated available stock.
     *
     * current_stock remains the physical inventory balance.
     * available_stock is the unexpired, undisposed balance.
     */
    public static function queryWithAvailableStock(
        ?string $today = null,
    ) {
        $today ??= now()->toDateString();

        return self::query()
            ->leftJoinSub(
                self::availableStockByMedicineQuery($today),
                'available_batches',
                function ($join) {
                    $join->on(
                        'medicines.medicine_id',
                        '=',
                        'available_batches.medicine_id',
                    );
                },
            )
            ->select('medicines.*')
            ->selectRaw(
                'COALESCE(available_batches.available_stock, 0) AS available_stock',
            );
    }

    // Query Scopes

    public function scopeFilterStatus($query, string $filter)
    {
        $today = now()->toDateString();

        $availableMedicineIds = StockIn::query()
            ->select('medicine_id')
            ->where('remaining_quantity', '>', 0)
            ->where('expiry_date', '>=', $today)
            ->whereNull('disposed_at')
            ->groupBy('medicine_id');

        if ($filter === 'lowstock') {
            $query->whereIn(
                'medicines.medicine_id',
                (clone $availableMedicineIds)->havingRaw(
                    'SUM(remaining_quantity) BETWEEN ? AND ?',
                    [1, 49],
                ),
            );
        } elseif ($filter === 'outofstock') {
            $query->whereNotIn(
                'medicines.medicine_id',
                $availableMedicineIds,
            );
        }

        return $query;
    }

    // Statistics

    public static function getStats(): array
    {
        $today = now()->toDateString();
        $thirtyDaysFromNow = now()->addDays(30)->toDateString();

        $stockQuery = self::query()
            ->leftJoinSub(
                self::availableStockByMedicineQuery($today),
                'available_batches',
                function ($join) {
                    $join->on(
                        'medicines.medicine_id',
                        '=',
                        'available_batches.medicine_id',
                    );
                },
            );

        $lowStockCount = (clone $stockQuery)
            ->whereBetween(
                'available_batches.available_stock',
                [1, 49],
            )
            ->count('medicines.medicine_id');

        $outOfStockCount = (clone $stockQuery)
            ->whereNull('available_batches.medicine_id')
            ->count('medicines.medicine_id');

        return [
            'total' => self::count(),

            'lowstock' => $lowStockCount,

            'outofstock' => $outOfStockCount,

            'expiring' => StockIn::where(
                'remaining_quantity',
                '>',
                0,
            )
                ->whereNull('disposed_at')
                ->where('expiry_date', '>=', $today)
                ->where('expiry_date', '<=', $thirtyDaysFromNow)
                ->count(),

            'expired' => StockIn::where(
                'remaining_quantity',
                '>',
                0,
            )
                ->whereNull('disposed_at')
                ->where('expiry_date', '<', $today)
                ->count(),

            'categories' => self::whereNotNull('category')
                ->where('category', '!=', '')
                ->distinct()
                ->pluck('category'),

            'types' => self::whereNotNull('type')
                ->where('type', '!=', '')
                ->distinct()
                ->pluck('type'),
        ];
    }

    // Medicine Catalog

    public static function getCatalogData(
        string $filter,
        string $search = '',
        string $category = '',
        string $type = '',
    ) {
        $today = now()->toDateString();
        $thirtyDaysFromNow = now()->addDays(30)->toDateString();

        $allowedFilters = [
            'lowstock',
            'outofstock',
            'expiring',
            'expired',
        ];

        if (! in_array($filter, $allowedFilters, true)) {
            $filter = 'all';
        }

        $query = self::queryWithAvailableStock($today);

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where(
                    'medicines.generic_name',
                    'ILIKE',
                    "%{$search}%",
                )
                    ->orWhere(
                        'medicines.brand_name',
                        'ILIKE',
                        "%{$search}%",
                    );
            });
        }

        if ($category) {
            $query->where('medicines.category', $category);
        }

        if ($type) {
            $query->where('medicines.type', $type);
        }

        // Medicine views

        if (in_array($filter, [
            'all',
            'lowstock',
            'outofstock',
        ], true)) {

            if ($filter === 'lowstock') {
                $query->whereBetween(
                    'available_batches.available_stock',
                    [1, 49],
                );
            } elseif ($filter === 'outofstock') {
                $query->whereNull(
                    'available_batches.medicine_id',
                );
            }

            return [
                'medicines' => $query
                    ->orderBy('medicines.generic_name')
                    ->paginate(15)
                    ->withQueryString(),

                'batches' => null,
            ];
        }

        // Expiring and expired batch views

        $batchQuery = StockIn::with(
            'medicine:medicine_id,generic_name,brand_name,type,category',
        )
            ->where('remaining_quantity', '>', 0)
            ->whereNull('disposed_at');

        if ($filter === 'expiring') {
            $batchQuery
                ->where('expiry_date', '>=', $today)
                ->where('expiry_date', '<=', $thirtyDaysFromNow);
        } else {
            $batchQuery->where('expiry_date', '<', $today);
        }

        // These views display StockIn batches, so apply catalog filters
        // through the related medicine instead of the unused medicine query.
        if ($search !== '' || $category !== '' || $type !== '') {
            $batchQuery->whereHas('medicine', function ($medicineQuery) use (
                $search,
                $category,
                $type,
            ) {
                if ($search !== '') {
                    $normalizedSearch = mb_strtolower($search);
                    $medicineQuery->where(function ($query) use ($normalizedSearch) {
                        $query
                            ->whereRaw('LOWER(generic_name) LIKE ?', ["%{$normalizedSearch}%"])
                            ->orWhereRaw('LOWER(brand_name) LIKE ?', ["%{$normalizedSearch}%"]);
                    });
                }

                if ($category !== '') {
                    $medicineQuery->where('category', $category);
                }

                if ($type !== '') {
                    $medicineQuery->where('type', $type);
                }
            });
        }

        return [
            'medicines' => self::query()
                ->whereRaw('1 = 0')
                ->paginate(15)
                ->withQueryString(),

            'batches' => $batchQuery
                ->orderBy('expiry_date')
                ->paginate(15)
                ->withQueryString(),
        ];
    }

    /**
     * FEFO (First-Expired, First-Out) dispensing.
     *
     * Price is always retrieved from the database.
     */
    public function dispense(
        int $quantityNeeded,
        ?string $dosage,
        string $patientName,
        string $prescriptionNo,
        int $userId,
    ): float {

        if ($quantityNeeded < 1) {
            throw new \Exception(
                'Dispensing quantity must be at least 1.',
            );
        }

        if ((int) $this->current_stock < $quantityNeeded) {
            throw new \Exception(
                "Insufficient total stock for '{$this->generic_name}'.",
            );
        }

        $today = now()->toDateString();

        $batches = $this->stockIn()
            ->where('expiry_date', '>=', $today)
            ->where('remaining_quantity', '>', 0)
            ->whereNull('disposed_at')
            ->orderBy('expiry_date')
            ->orderBy('stock_in_id')
            ->lockForUpdate()
            ->get();

        $unexpiredTotal = (int) $batches->sum('remaining_quantity');

        if ($unexpiredTotal < $quantityNeeded) {
            throw new \Exception(
                "Cannot dispense {$quantityNeeded} units of '{$this->generic_name}'. ".
                "Available unexpired stock: {$unexpiredTotal}.",
            );
        }

        $finalPrice = (float) $this->price;
        $remaining = $quantityNeeded;
        $itemTotal = 0;

        foreach ($batches as $batch) {
            if ($remaining <= 0) {
                break;
            }

            $take = min(
                $remaining,
                (int) $batch->remaining_quantity,
            );

            $batch->decrement('remaining_quantity', $take);

            StockOut::create([
                'medicine_id' => $this->medicine_id,
                'quantity' => $take,
                'dosage' => $dosage ?? '',
                'price' => $finalPrice,
                'patient_name' => $patientName,
                'prescription_no' => $prescriptionNo,
                'dispensed_by' => $userId,
                'stock_in_id' => $batch->stock_in_id,
            ]);

            $itemTotal += $take * $finalPrice;
            $remaining -= $take;
        }

        $this->decrement(
            'current_stock',
            $quantityNeeded,
        );

        return $itemTotal;
    }
}
