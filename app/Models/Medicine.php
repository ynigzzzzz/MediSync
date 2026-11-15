<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Medicine extends Model
{
    use HasFactory;

    protected $table = 'medicines';

    protected $primaryKey = 'medicine_id';

    public $timestamps = false;

    protected $fillable = [
        'generic_name', 'brand_name', 'category', 'dosage', 'price', 'current_stock', 'type',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'current_stock' => 'integer',
        'created_at' => 'datetime',
    ];

    // --- Relationships ---

    public function stockIn()
    {
        return $this->hasMany(StockIn::class, 'medicine_id', 'medicine_id');
    }

    public function stockOut()
    {
        return $this->hasMany(StockOut::class, 'medicine_id', 'medicine_id');
    }

    // --- Query Scopes & Logic ---

    public function scopeFilterStatus($query, string $filter)
    {
        if ($filter === 'lowstock') {
            $query->whereBetween('current_stock', [1, 49]);
        } elseif ($filter === 'outofstock') {
            $query->where('current_stock', 0);
        }

        return $query;
    }

    public static function getStats(): array
    {
        $today = now()->toDateString();

        return [
            'total' => self::count(),
            'lowstock' => self::whereBetween('current_stock', [1, 49])->count(),
            'outofstock' => self::where('current_stock', 0)->count(),
            'expiring' => StockIn::where('remaining_quantity', '>', 0)
                ->whereDate('expiry_date', '>=', $today)
                ->whereDate('expiry_date', '<=', now()->addDays(30)->toDateString())
                ->count(),
            'expired' => StockIn::where('remaining_quantity', '>', 0)
                ->whereDate('expiry_date', '<', $today)
                ->count(),
            'categories' => self::whereNotNull('category')->where('category', '!=', '')->distinct()->pluck('category'),
            'types' => self::whereNotNull('type')->where('type', '!=', '')->distinct()->pluck('type'),
        ];
    }

    /**
     * Get the data needed for the catalog index page based on the filter.
     */
    public static function getCatalogData(string $filter)
    {
        $today = now()->toDateString();
        $allowedFilters = ['lowstock', 'outofstock', 'expiring', 'expired'];

        if (! in_array($filter, $allowedFilters, true)) {
            $filter = 'all';
        }

        if ($filter === 'expiring') {
            return [
                'medicines' => collect(),
                'expiringBatches' => StockIn::with('medicine:medicine_id,generic_name,brand_name')
                    ->where('remaining_quantity', '>', 0)
                    ->whereDate('expiry_date', '>=', $today)
                    ->whereDate('expiry_date', '<=', now()->addDays(30)->toDateString())
                    ->orderBy('expiry_date')
                    ->paginate(15)
                    ->withQueryString(),
            ];
        }

        if ($filter === 'expired') {
            return [
                'medicines' => collect(),
                'expiringBatches' => StockIn::with('medicine:medicine_id,generic_name,brand_name')
                    ->where('remaining_quantity', '>', 0)
                    ->whereDate('expiry_date', '<', $today)
                    ->orderBy('expiry_date')
                    ->paginate(15)
                    ->withQueryString(),
            ];
        }

        return [
            'medicines' => self::query()
                ->filterStatus($filter)
                ->orderBy('generic_name')
                ->paginate(15)
                ->withQueryString(),
            'expiringBatches' => null,
        ];
    }

    /**
     * Generate the "Needs Attention" alerts for the catalog page.
     */
    public static function getAttentionAlerts(): array
    {
        $stats = self::getStats();
        $attention = [];

        if ($stats['outofstock'] > 0) {
            $attention[] = ['type' => 'danger', 'icon' => 'fa-circle-xmark', 'message' => "{$stats['outofstock']} medicine(s) out of stock", 'link' => '/medicine-list?filter=outofstock'];
        }
        if ($stats['lowstock'] > 0) {
            $attention[] = ['type' => 'warning', 'icon' => 'fa-triangle-exclamation', 'message' => "{$stats['lowstock']} medicine(s) low on stock", 'link' => '/medicine-list?filter=lowstock'];
        }
        if ($stats['expiring'] > 0) {
            $attention[] = ['type' => 'warning', 'icon' => 'fa-hourglass-half', 'message' => "{$stats['expiring']} batch(es) expiring within 30 days", 'link' => '/medicine-list?filter=expiring'];
        }
        if ($stats['expired'] > 0) {
            $attention[] = ['type' => 'danger', 'icon' => 'fa-ban', 'message' => "{$stats['expired']} expired batch(es) still in stock", 'link' => '/medicine-list?filter=expired'];
        }

        return $attention;
    }

    /**
     * FEFO (First-Expired, First-Out) dispensing.
     * Must be called inside a DB::transaction — see StockDispensingController.
     */
    public function dispense(
        int $quantityNeeded,
        ?float $requestedPrice,
        ?string $dosage,
        string $patientName,
        string $prescriptionNo,
        int $userId,
    ): float {
        $unexpiredTotal = $this->stockIn()
            ->where('expiry_date', '>=', now()->toDateString())
            ->where('remaining_quantity', '>', 0)
            ->sum('remaining_quantity');

        if ($unexpiredTotal < $quantityNeeded) {
            $expiredOnly = $this->current_stock - $unexpiredTotal;
            throw new \Exception("Cannot dispense {$quantityNeeded} units of '{$this->generic_name}'. Unexpired available: {$unexpiredTotal}. Expired (unusable): {$expiredOnly}.");
        }

        if ($this->current_stock < $quantityNeeded) {
            throw new \Exception("Insufficient total stock for '{$this->generic_name}'. Requested {$quantityNeeded}, available {$this->current_stock}.");
        }

        $finalPrice = ($requestedPrice !== null && $requestedPrice > 0) ? $requestedPrice : (float) $this->price;
        $remaining = $quantityNeeded;
        $itemTotal = 0;

        while ($remaining > 0) {
            $batch = $this->stockIn()
                ->where('remaining_quantity', '>', 0)
                ->where('expiry_date', '>=', now()->toDateString())
                ->orderBy('expiry_date')
                ->lockForUpdate()
                ->first();

            if (! $batch) {
                throw new \Exception("No available unexpired stock for '{$this->generic_name}'.");
            }

            $take = min($remaining, $batch->remaining_quantity);
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

        $this->decrement('current_stock', $quantityNeeded);

        return $itemTotal;
    }
}
