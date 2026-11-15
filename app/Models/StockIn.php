<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

class StockIn extends Model
{
    protected $table = 'stock_in';

    protected $primaryKey = 'stock_in_id';

    public $timestamps = false;

    protected $fillable = [
        'medicine_id', 'quantity', 'batch_no', 'expiry_date', 'supplier',
        'supplier_id', 'received_by', 'delivery_date', 'invoice_no',
        'cost_price', 'selling_price', 'remaining_quantity', 'recorded_at',
    ];

    protected $casts = [
        'expiry_date' => 'date',
        'delivery_date' => 'date',
        'recorded_at' => 'datetime',
        'cost_price' => 'decimal:2',
        'selling_price' => 'decimal:2',
        'remaining_quantity' => 'integer',
    ];

    protected $appends = ['days_left'];

    public function getDaysLeftAttribute(): int
    {
        if (! $this->expiry_date) {
            return 0;
        }

        return (int) now()->startOfDay()->diffInDays(
            $this->expiry_date instanceof Carbon
                ? $this->expiry_date->startOfDay()
                : Carbon::parse($this->expiry_date)->startOfDay(),
            false,
        );
    }

    public function medicine()
    {
        return $this->belongsTo(Medicine::class, 'medicine_id', 'medicine_id');
    }

    public function receivedBy()
    {
        return $this->belongsTo(User::class, 'received_by', 'user_id');
    }

    public function supplier()
    {
        return $this->belongsTo(Supplier::class, 'supplier_id', 'supplier_id');
    }

    public static function getReceivingData(array $filters = [])
    {
        $query = self::with([
            'medicine:medicine_id,generic_name,price',
            'receivedBy:user_id,full_name',
            'supplier:supplier_id,name',
        ])->orderByDesc('recorded_at');

        if (! empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('batch_no', 'ILIKE', "%{$search}%")
                    ->orWhere('supplier', 'ILIKE', "%{$search}%")
                    ->orWhereHas('medicine', function ($mq) use ($search) {
                        $mq->where('generic_name', 'ILIKE', "%{$search}%")
                            ->orWhere('brand_name', 'ILIKE', "%{$search}%");
                    });
            });
        }

        if (! empty($filters['date_from'])) {
            $query->whereDate('recorded_at', '>=', $filters['date_from']);
        }
        if (! empty($filters['date_to'])) {
            $query->whereDate('recorded_at', '<=', $filters['date_to']);
        }

        return [
            'records' => $query->paginate(15)->withQueryString(),
            'expiringBatches' => self::with('medicine:medicine_id,generic_name,brand_name')
                ->where('remaining_quantity', '>', 0)
                ->whereDate('expiry_date', '>=', now()->toDateString())
                ->whereDate('expiry_date', '<=', now()->addDays(30)->toDateString())
                ->orderBy('expiry_date')
                ->get()
                ->map(fn ($b) => [
                    'stock_in_id' => $b->stock_in_id,
                    'generic_name' => $b->medicine->generic_name ?? '—',
                    'brand_name' => $b->medicine->brand_name ?? '',
                    'batch_no' => $b->batch_no,
                    'expiry_date' => $b->expiry_date,
                    'remaining_quantity' => $b->remaining_quantity,
                    'days_left' => (int) now()->diffInDays($b->expiry_date, false),
                ]),
        ];
    }

    public static function receiveBatch(array $data, int $userId): self
    {
        return DB::transaction(function () use ($data, $userId) {
            $medicine = Medicine::where('medicine_id', $data['medicine_id'])->lockForUpdate()->firstOrFail();

            $medicine->increment('current_stock', $data['quantity']);

            $updates = [];
            if (($data['sell_price'] ?? 0) > 0 && (float) $medicine->price !== (float) $data['sell_price']) {
                $updates['price'] = $data['sell_price'];
            }
            if (! empty($data['dosage']) && $medicine->dosage !== $data['dosage']) {
                $updates['dosage'] = $data['dosage'];
            }
            if (! empty($updates)) {
                $medicine->update($updates);
            }

            return self::create([
                'medicine_id' => $data['medicine_id'],
                'quantity' => $data['quantity'],
                'batch_no' => $data['batch_no'],
                'expiry_date' => $data['expiry_date'],
                'supplier' => $data['supplier'] ?? null,
                'supplier_id' => $data['supplier_id'] ?? null,
                'received_by' => $userId,
                'delivery_date' => $data['delivery_date'],
                'invoice_no' => 'N/A',
                'cost_price' => $data['cost_price'],
                'selling_price' => $data['sell_price'] ?? 0,
                'remaining_quantity' => $data['quantity'],
            ]);
        });
    }

    public static function disposeBatches(array $batchIds, int $userId): void
    {
        DB::transaction(function () use ($batchIds, $userId) {
            $batches = self::whereIn('stock_in_id', $batchIds)->lockForUpdate()->get();

            foreach ($batches as $batch) {
                Medicine::where('medicine_id', $batch->medicine_id)
                    ->decrement('current_stock', $batch->remaining_quantity);

                StockOut::where('stock_in_id', $batch->stock_in_id)->update(['stock_in_id' => null]);

                AuditLog::record(
                    $userId,
                    'DISPOSE_BATCH',
                    "Disposed batch {$batch->batch_no}, removed {$batch->remaining_quantity} units",
                    $batch->medicine_id,
                );

                $batch->delete();
            }
        });
    }
}
