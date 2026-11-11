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
    ];

    protected $hidden = [
        'password_hash',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'must_change_password' => 'boolean',
    ];

    /**
     * Laravel's auth guard expects getAuthPassword() to return the hash -
     * our column is password_hash, not the default password.
     */
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

    /**
     * Apply search and role filters.
     */
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
    }

    /**
     * Toggle the user's active status.
     */
    public function toggleStatus(): string
    {
        $newStatus = $this->status === 'active' ? 'inactive' : 'active';
        $this->update(['status' => $newStatus]);

        return $newStatus;
    }
}
