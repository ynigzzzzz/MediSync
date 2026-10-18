<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Supplier extends Model
{
    protected $table = 'suppliers';
    protected $primaryKey = 'supplier_id';
    public $timestamps = false;

    protected $fillable = [
        'name', 'contact_person', 'phone', 'email', 'address', 'status',
    ];

    protected $casts = [
        'created_at' => 'datetime',
    ];

    public function stockIn()
    {
        return $this->hasMany(StockIn::class, 'supplier_id', 'supplier_id');
    }
}