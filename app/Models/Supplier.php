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

    // --- Relationships ---

    public function stockIn()
    {
        return $this->hasMany(StockIn::class, 'supplier_id', 'supplier_id');
    }

    // --- Query Scopes & Logic ---

    public static function getIndexData(array $filters)
    {
        return self::query()
            ->filter($filters)
            ->orderBy('name')
            ->paginate(15)
            ->withQueryString();
    }

    public static function getStats(): array
    {
        return [
            'total' => self::count(),
            'active' => self::where('status', 'active')->count(),
            'inactive' => self::where('status', 'inactive')->count(),
        ];
    }

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
