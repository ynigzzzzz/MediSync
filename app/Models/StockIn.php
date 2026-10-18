<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

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
    ];

    protected $casts = [
        'expiry_date'        => 'date',
        'delivery_date'      => 'date',
        'recorded_at'        => 'datetime',
        'cost_price'         => 'decimal:2',
        'selling_price'      => 'decimal:2',
        'remaining_quantity' => 'integer',
    ];

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

    /**
     * FEFO helper: unexpired batches for a given medicine, oldest expiry first.
     */
    public function scopeAvailableFebo($query, int $medicineId)
    {
        return $query->where('medicine_id', $medicineId)
            ->where('remaining_quantity', '>', 0)
            ->where('expiry_date', '>=', now()->toDateString())
            ->orderBy('expiry_date');
    }
}