<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AuditLog extends Model
{
    protected $table = 'audit_log';
    protected $primaryKey = 'log_id';
    public $timestamps = false;

    protected $fillable = [
        'user_id',
        'action_type',
        'description',
        'reference_id',
        'ip_address',
    ];

    protected $casts = [
        'created_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id', 'user_id');
    }

    /**
     * record($userId, $actionType, $description, $referenceId = null)
     *
     * $userId is explicit rather than pulled from auth()->id() — some
     * disposal/cleanup actions may run without a bound request user, and
     * every existing call site already passes it explicitly.
     */
    public static function record($userId, string $actionType, string $description, ?int $referenceId = null): self
    {
        return self::create([
            'user_id' => $userId,
            'action_type' => $actionType,
            'description' => $description,
            'reference_id' => $referenceId,
            'ip_address' => request()->ip(),
        ]);
    }
}