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

    // --- Fat Model Logic ---

    public function stockIn()
    {
        return $this->hasMany(StockIn::class, 'supplier_id', 'supplier_id');
    }

    /**
     * Scope a query to apply search and status filters.
     */
    public function scopeFilter($query, array $filters)
    {
        $query->when($filters['search'] ?? false, function ($q, $search) {
            $q->where(function ($sub) use ($search) {
                $sub->where('name', 'ILIKE', "%{$search}%")
                    ->orWhere('contact_person', 'ILIKE', "%{$search}%")
                    ->orWhere('email', 'ILIKE', "%{$search}%")
                    ->orWhere('phone', 'ILIKE', "%{$search}%");
            });
        });

        $query->when($filters['status'] ?? 'all', function ($q, $status) {
            if ($status !== 'all' && $status !== '') {
                $q->where('status', $status);
            }
        });
    }
}
