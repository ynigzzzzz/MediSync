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

    /**
     * Apply the "Low Stock" or "Out of Stock" filter.
     */
    public function scopeFilterStatus($query, string $filter)
    {
        if ($filter === 'lowstock') {
            $query->whereBetween('current_stock', [1, 49]);
        } elseif ($filter === 'outofstock') {
            $query->where('current_stock', 0);
        }

        return $query;
    }

    /**
     * Get the counts for the stat cards on the catalog page.
     */
    public static function getStats(): array
    {
        return [
            'total' => self::count(),
            'lowstock' => self::whereBetween('current_stock', [1, 49])->count(),
            'outofstock' => self::where('current_stock', 0)->count(),
            'expiring' => StockIn::where('remaining_quantity', '>', 0)
                ->whereDate('expiry_date', '<=', now()->addDays(30)->toDateString())
                ->count(),
            'categories' => self::whereNotNull('category')->where('category', '!=', '')->distinct()->pluck('category'),
            'types' => self::whereNotNull('type')->where('type', '!=', '')->distinct()->pluck('type'),
        ];
    }

    /**
     * The FEFO (First-Expired, First-Out) Dispensing Algorithm.
     * Handles locking, batch deduction, and stock creation.
     */
    public function dispense(int $quantityNeeded, ?float $requestedPrice, ?string $dosage, string $patientName, string $prescriptionNo, int $userId): float
    {
        // 1. Check unexpired stock
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

        $finalPrice = $requestedPrice > 0 ? $requestedPrice : $this->price;
        $remaining = $quantityNeeded;
        $itemTotal = 0;

        // 2. FEFO Loop
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

        // 3. Deduct total from medicine
        $this->decrement('current_stock', $quantityNeeded);

        return $itemTotal;
    }
}
