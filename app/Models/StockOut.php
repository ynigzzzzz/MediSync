<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StockOut extends Model
{
    use HasFactory;

    protected $table = 'stock_out';
    protected $primaryKey = 'stock_out_id';
    public $timestamps = false;

    protected $fillable = [
        'medicine_id',
        'quantity',
        'dosage',
        'patient_name',
        'prescription_no',
        'dispensed_by',
        'price',
        'stock_in_id',
    ];

    // total_amount is GENERATED ALWAYS AS (quantity * price) STORED in
    // Postgres — deliberately left out of $fillable above; never write to
    // it directly, it's computed by the database on insert/update.

    protected $casts = [
        'price' => 'decimal:2',
        'total_amount' => 'decimal:2',
        'dispensed_at' => 'datetime',
    ];

    public function medicine()
    {
        return $this->belongsTo(Medicine::class, 'medicine_id', 'medicine_id');
    }

    public function dispensedBy()
    {
        return $this->belongsTo(User::class, 'dispensed_by', 'user_id');
    }

    public function stockIn()
    {
        return $this->belongsTo(StockIn::class, 'stock_in_id', 'stock_in_id');
    }
}
