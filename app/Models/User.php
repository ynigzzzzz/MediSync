<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    use HasFactory, Notifiable;

    protected $table = 'users';

    protected $primaryKey = 'user_id';

    public $timestamps = false;

    protected $fillable = [
        'full_name',
        'email',
        'password_hash',
        'role',
        'status',
        'profile_image',
        'must_change_password',
        'remember_token',
    ];

    protected $hidden = [
        'password_hash',
        'remember_token',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'must_change_password' => 'boolean',
    ];

    public function getAuthPassword(): string
    {
        return $this->password_hash;
    }

    public function isActive(): bool
    {
        return $this->status === 'active';
    }

    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    // --- Relationships ---

    public function stockIn()
    {
        return $this->hasMany(StockIn::class, 'received_by', 'user_id');
    }

    public function stockOut()
    {
        return $this->hasMany(StockOut::class, 'dispensed_by', 'user_id');
    }

    public function contactMessages()
    {
        return $this->hasMany(ContactMessage::class, 'user_id', 'user_id');
    }

    public function auditLogs()
    {
        return $this->hasMany(AuditLog::class, 'user_id', 'user_id');
    }

    // --- Query Scopes & Logic ---

    public static function getIndexData(array $filters)
    {
        return self::query()
            ->filter($filters)
            ->orderBy('full_name')
            ->paginate(15)
            ->withQueryString();
    }

    public static function getStats(): array
    {
        return [
            'total' => self::count(),
            'activeUsers' => self::where('status', 'active')->count(),
            'inactiveUsers' => self::where('status', 'inactive')->count(),
            'adminCount' => self::where('role', 'admin')->count(),
        ];
    }

    public function scopeFilter($query, array $filters)
    {
        $query->when($filters['search'] ?? false, function ($q, $search) {
            $q->where(function ($sub) use ($search) {
                $sub->where('full_name', 'ILIKE', "%{$search}%")
                    ->orWhere('email', 'ILIKE', "%{$search}%");
            });
        });

        $query->when($filters['role'] ?? 'all', function ($q, $role) {
            if ($role !== 'all' && $role !== '') {
                $q->where('role', $role);
            }
        });

        $query->when($filters['status'] ?? 'all', function ($q, $status) {
            if ($status !== 'all' && $status !== '') {
                $q->where('status', $status);
            }
        });
    }

    public function toggleStatus(): string
    {
        $newStatus = $this->status === 'active' ? 'inactive' : 'active';
        $this->update(['status' => $newStatus]);

        return $newStatus;
    }
}
