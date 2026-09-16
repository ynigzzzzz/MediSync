<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StockIn extends Model
{
    use HasFactory;

    protected $table = 'stock_in';
    protected $primaryKey = 'stock_in_id';
    public $timestamps = false;

    protected $fillable = [
        'medicine_id',
        'quantity',
        'batch_no',
        'expiry_date',
        'supplier',
        'received_by',
        'delivery_date',
        'invoice_no',
        'cost_price',
        'selling_price',
        'remaining_quantity',
    ];

    protected $casts = [
        'expiry_date' => 'date',
        'delivery_date' => 'date',
        'cost_price' => 'decimal:2',
        'selling_price' => 'decimal:2',
        'recorded_at' => 'datetime',
    ];

    public function medicine()
    {
        return $this->belongsTo(Medicine::class, 'medicine_id', 'medicine_id');
    }

    public function receivedBy()
    {
        return $this->belongsTo(User::class, 'received_by', 'user_id');
    }

    public function stockOut()
    {
        return $this->hasMany(StockOut::class, 'stock_in_id', 'stock_in_id');
    }

    /**
     * Batches with stock still left, oldest expiry first — this is the
     * query FEFO dispensing (Stock Dispensing module) will build on.
     */
    public function scopeAvailableFefo($query, int $medicineId)
    {
        return $query->where('medicine_id', $medicineId)
            ->where('remaining_quantity', '>', 0)
            ->orderBy('expiry_date', 'asc');
    }
}
