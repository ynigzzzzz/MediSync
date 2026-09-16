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

    public function stockIn()
    {
        return $this->hasMany(StockIn::class, 'medicine_id', 'medicine_id');
    }

    public function stockOut()
    {
        return $this->hasMany(StockOut::class, 'medicine_id', 'medicine_id');
    }
}
