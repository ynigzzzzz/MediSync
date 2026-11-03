<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

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

    /**
     * Build the unified transaction history query (Stock-In + Stock-Out).
     */
    public static function getTransactionHistory(array $filters)
    {
        $stockIn = DB::table('stock_in as si')
            ->join('medicines as m', 'si.medicine_id', '=', 'm.medicine_id')
            ->leftJoin('users as u', 'si.received_by', '=', 'u.user_id')
            ->selectRaw("
                'Stock-In' as transaction_type, si.recorded_at as date_time,
                si.quantity, si.batch_no, si.expiry_date, si.supplier, si.invoice_no,
                si.cost_price, si.selling_price, m.generic_name, m.brand_name, m.dosage,
                NULL::varchar as patient_name, NULL::varchar as prescription_no,
                u.full_name as user_name, 'stock_in' as source_table,
                si.stock_in_id as record_id, si.batch_no as batch_reference
            ");

        $stockOut = DB::table('stock_out as so')
            ->join('medicines as m', 'so.medicine_id', '=', 'm.medicine_id')
            ->leftJoin('users as u', 'so.dispensed_by', '=', 'u.user_id')
            ->leftJoin('stock_in as si', 'so.stock_in_id', '=', 'si.stock_in_id')
            ->selectRaw("
                'Stock-Out' as transaction_type, so.dispensed_at as date_time,
                so.quantity, si.batch_no, si.expiry_date, si.supplier,
                ''::varchar as invoice_no, NULL::numeric as cost_price,
                so.price as selling_price, m.generic_name, m.brand_name, m.dosage,
                so.patient_name, so.prescription_no, u.full_name as user_name,
                'stock_out' as source_table, so.stock_out_id as record_id,
                si.batch_no as batch_reference
            ");

        $query = DB::query()->fromSub($stockIn->unionAll($stockOut), 't');

        // Apply Filters
        $query->when($filters['search'] ?? false, function ($q, $search) {
            $like = "%{$search}%";
            $q->where(function ($sub) use ($like) {
                $sub->where('generic_name', 'ILIKE', $like)
                    ->orWhere('brand_name', 'ILIKE', $like)
                    ->orWhere('patient_name', 'ILIKE', $like)
                    ->orWhere('supplier', 'ILIKE', $like);
            });
        });

        $query->when($filters['type'] ?? 'all', function ($q, $type) {
            if ($type === 'Stock-In') {
                $q->where('source_table', 'stock_in');
            }
            if ($type === 'Stock-Out') {
                $q->where('source_table', 'stock_out');
            }
        });

        $query->when($filters['date_from'] ?? false, fn ($q, $d) => $q->whereRaw('DATE(date_time) >= ?', [$d]));
        $query->when($filters['date_to'] ?? false, fn ($q, $d) => $q->whereRaw('DATE(date_time) <= ?', [$d]));
        $query->when($filters['user'] ?? 'all', function ($q, $user) {
            if ($user !== 'all') {
                $q->where('user_name', $user);
            }
        });

        return $query;
    }
}
