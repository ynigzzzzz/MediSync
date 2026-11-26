<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class StockIn extends Model
{
    protected $table = 'stock_in';

    protected $primaryKey = 'stock_in_id';

    public $timestamps = false;

    protected $fillable = [
        'medicine_id',
        'quantity',
        'batch_no',
        'expiry_date',
        'supplier',
        'supplier_id',
        'received_by',
        'delivery_date',
        'invoice_no',
        'cost_price',
        'selling_price',
        'remaining_quantity',
        'recorded_at',
        'disposed_quantity',
        'disposed_at',
        'disposed_by',
    ];

    protected $casts = [
        'expiry_date' => 'date',
        'delivery_date' => 'date',
        'recorded_at' => 'datetime',
        'cost_price' => 'decimal:2',
        'selling_price' => 'decimal:2',
        'remaining_quantity' => 'integer',
        'disposed_quantity' => 'integer',
        'disposed_at' => 'datetime',
        'disposed_by' => 'integer',
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

    // Relationships

    public function medicine()
    {
        return $this->belongsTo(
            Medicine::class,
            'medicine_id',
            'medicine_id',
        )->withTrashed();
    }

    public function receivedBy()
    {
        return $this->belongsTo(
            User::class,
            'received_by',
            'user_id',
        );
    }

    public function disposedBy()
    {
        return $this->belongsTo(
            User::class,
            'disposed_by',
            'user_id',
        );
    }

    public function supplier()
    {
        return $this->belongsTo(
            Supplier::class,
            'supplier_id',
            'supplier_id',
        );
    }

    // Receiving Data

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
            $query->whereDate(
                'recorded_at',
                '>=',
                $filters['date_from'],
            );
        }

        if (! empty($filters['date_to'])) {
            $query->whereDate(
                'recorded_at',
                '<=',
                $filters['date_to'],
            );
        }

        return [
            'records' => $query->paginate(15)->withQueryString(),

            'expiringBatches' => self::with(
                'medicine:medicine_id,generic_name,brand_name',
            )
                ->where('remaining_quantity', '>', 0)
                ->whereNull('disposed_at')
                ->whereDate('expiry_date', '>=', now()->toDateString())
                ->whereDate(
                    'expiry_date',
                    '<=',
                    now()->addDays(30)->toDateString(),
                )
                ->orderBy('expiry_date')
                ->get()
                ->map(fn ($b) => [
                    'stock_in_id' => $b->stock_in_id,
                    'generic_name' => $b->medicine->generic_name ?? '—',
                    'brand_name' => $b->medicine->brand_name ?? '',
                    'batch_no' => $b->batch_no,
                    'expiry_date' => $b->expiry_date,
                    'remaining_quantity' => $b->remaining_quantity,
                    'days_left' => $b->days_left,
                ]),
        ];
    }

    // Receive New Batch

    public static function receiveBatch(
        array $data,
        int $userId,
    ): self {
        return DB::transaction(function () use ($data, $userId) {

            $supplier = Supplier::where(
                'supplier_id',
                $data['supplier_id'],
            )
                ->lockForUpdate()
                ->first();

            if (! $supplier || $supplier->status !== 'active') {
                throw ValidationException::withMessages([
                    'supplier_id' => 'The selected supplier is not active.',
                ]);
            }

            $medicine = Medicine::where(
                'medicine_id',
                $data['medicine_id'],
            )
                ->lockForUpdate()
                ->firstOrFail();

            // Update aggregate inventory.
            $medicine->increment(
                'current_stock',
                $data['quantity'],
            );

            // Update the medicine's current selling price when provided.
            $updates = [];

            if (
                ($data['sell_price'] ?? 0) > 0
                && (float) $medicine->price !== (float) $data['sell_price']
            ) {
                $updates['price'] = $data['sell_price'];
            }

            if (
                ! empty($data['dosage'])
                && $medicine->dosage !== $data['dosage']
            ) {
                $updates['dosage'] = $data['dosage'];
            }

            if (! empty($updates)) {
                $medicine->update($updates);
            }

            // Preserve the actual invoice number.
            $invoiceNo = trim((string) ($data['invoice_no'] ?? ''));

            // Create the receiving batch.
            $batch = self::create([
                'medicine_id' => $data['medicine_id'],
                'quantity' => $data['quantity'],
                'batch_no' => $data['batch_no'],
                'expiry_date' => $data['expiry_date'],

                'supplier' => $supplier->name,
                'supplier_id' => $supplier->supplier_id,

                'received_by' => $userId,
                'delivery_date' => $data['delivery_date'],

                'invoice_no' => $invoiceNo !== ''
                    ? $invoiceNo
                    : null,

                'cost_price' => $data['cost_price'],
                'selling_price' => $data['sell_price'] ?? 0,

                'remaining_quantity' => $data['quantity'],
            ]);

            AuditLog::record(
                $userId,
                'STOCK_IN',
                "Added {$data['quantity']} units of {$medicine->generic_name} (supplier: {$supplier->name})",
                (int) $batch->stock_in_id,
            );

            return $batch;
        });
    }

    // Dispose Selected Batches

    public static function disposeBatches(
        array $batchIds,
        int $userId,
    ): void {
        $batchIds = array_values(array_unique(
            array_map('intval', $batchIds),
        ));

        if ($batchIds === []) {
            return;
        }

        DB::transaction(function () use ($batchIds, $userId) {

            // Identify the medicines associated with the selected batches.
            $medicineIds = self::whereIn(
                'stock_in_id',
                $batchIds,
            )
                ->distinct()
                ->orderBy('medicine_id')
                ->pluck('medicine_id');

            // Lock medicine records first.
            $medicines = Medicine::whereIn(
                'medicine_id',
                $medicineIds,
            )
                ->orderBy('medicine_id')
                ->lockForUpdate()
                ->get()
                ->keyBy('medicine_id');

            // Lock batches in a consistent order.
            $batches = self::whereIn(
                'stock_in_id',
                $batchIds,
            )
                ->orderBy('stock_in_id')
                ->lockForUpdate()
                ->get();

            if ($batches->count() !== count($batchIds)) {
                throw ValidationException::withMessages([
                    'batch_ids' => 'One or more selected batches no longer exist.',
                ]);
            }

            $disposedAt = now();

            foreach ($batches as $batch) {

                if (
                    $batch->disposed_at !== null
                    || (int) $batch->disposed_quantity > 0
                ) {
                    throw ValidationException::withMessages([
                        'batch_ids' => "Batch {$batch->batch_no} has already been disposed.",
                    ]);
                }

                $quantity = (int) $batch->remaining_quantity;

                if ($quantity <= 0) {
                    throw ValidationException::withMessages([
                        'batch_ids' => "Batch {$batch->batch_no} has no remaining quantity to dispose.",
                    ]);
                }

                $medicine = $medicines->get($batch->medicine_id);

                if (! $medicine) {
                    throw ValidationException::withMessages([
                        'batch_ids' => 'The medicine associated with a selected batch could not be found.',
                    ]);
                }

                $currentStock = (int) $medicine->current_stock;

                if ($currentStock < $quantity) {
                    throw ValidationException::withMessages([
                        'batch_ids' => "Inventory mismatch detected for {$medicine->generic_name}. Reconcile the stock before disposing this batch.",
                    ]);
                }

                $nextDisposedQuantity =
                    (int) $batch->disposed_quantity + $quantity;

                if ($nextDisposedQuantity > (int) $batch->quantity) {
                    throw ValidationException::withMessages([
                        'batch_ids' => "The disposal quantity for batch {$batch->batch_no} exceeds its original received quantity.",
                    ]);
                }

                // Update aggregate medicine stock.
                $medicine->current_stock = $currentStock - $quantity;
                $medicine->save();

                // Preserve the original batch record.
                $batch->remaining_quantity = 0;
                $batch->disposed_quantity = $nextDisposedQuantity;
                $batch->disposed_at = $disposedAt;
                $batch->disposed_by = $userId;
                $batch->save();

                // Preserve historical stock-out references.
                AuditLog::record(
                    $userId,
                    'DISPOSE_BATCH',
                    "Disposed batch {$batch->batch_no}, removed {$quantity} units",
                    (int) $batch->stock_in_id,
                );
            }

        }, 3);
    }
}
