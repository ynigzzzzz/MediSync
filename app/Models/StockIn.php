<?php

namespace App\Models;

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
        'cost_price', 'selling_price', 'remaining_quantity',
    ];

    protected $casts = [
        'expiry_date' => 'date',
        'delivery_date' => 'date',
        'recorded_at' => 'datetime',
        'cost_price' => 'decimal:2',
        'selling_price' => 'decimal:2',
        'remaining_quantity' => 'integer',
    ];

    // --- Relationships ---

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

    // --- Fat Model Logic ---

    /**
     * Handle the entire receiving transaction logic.
     * Updates the medicine stock, prices, and creates the stock_in record.
     */
    public static function receiveBatch(array $data, int $userId): self
    {
        return DB::transaction(function () use ($data, $userId) {
            $medicine = Medicine::where('medicine_id', $data['medicine_id'])->lockForUpdate()->firstOrFail();

            // 1. Update stock
            $medicine->increment('current_stock', $data['quantity']);

            // 2. Update price and dosage if provided
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

            // 3. Create the stock-in record
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
}
