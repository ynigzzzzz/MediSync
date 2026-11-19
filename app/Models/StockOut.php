<?php

namespace App\Models;

use Carbon\Carbon;
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
        'dispensed_at',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'total_amount' => 'decimal:2',
        'dispensed_at' => 'datetime',
    ];

    public function medicine()
    {
        return $this->belongsTo(
            Medicine::class,
            'medicine_id',
            'medicine_id',
        )->withTrashed();
    }

    public function dispensedBy()
    {
        return $this->belongsTo(
            User::class,
            'dispensed_by',
            'user_id',
        );
    }

    public function stockIn()
    {
        return $this->belongsTo(
            StockIn::class,
            'stock_in_id',
            'stock_in_id',
        );
    }

    public static function getDispensingData(array $filters = [])
    {
        $query = self::with([
            'medicine:medicine_id,generic_name,brand_name,dosage',
            'dispensedBy:user_id,full_name',
            'stockIn:stock_in_id,batch_no,expiry_date',
        ])->orderByDesc('dispensed_at')
            ->orderByDesc('stock_out_id');

        if (! empty($filters['search'])) {
            $search = $filters['search'];

            $query->where(function ($q) use ($search) {
                $q->where('patient_name', 'ILIKE', "%{$search}%")
                    ->orWhere('prescription_no', 'ILIKE', "%{$search}%")
                    ->orWhereHas('medicine', function ($mq) use ($search) {
                        $mq->where('generic_name', 'ILIKE', "%{$search}%")
                            ->orWhere('brand_name', 'ILIKE', "%{$search}%");
                    });
            });
        }

        if (! empty($filters['date_from'])) {
            $query->where(
                'dispensed_at',
                '>=',
                $filters['date_from'].' 00:00:00',
            );
        }

        if (! empty($filters['date_to'])) {
            $query->where(
                'dispensed_at',
                '<',
                Carbon::parse($filters['date_to'])
                    ->addDay()
                    ->startOfDay(),
            );
        }

        $today = now()->toDateString();

        $eligibleBatchFilter = function ($stockQuery) use ($today) {
            $stockQuery
                ->where('remaining_quantity', '>', 0)
                ->whereDate('expiry_date', '>=', $today)
                ->whereNull('disposed_at');
        };

        $medicines = Medicine::query()
            ->select([
                'medicine_id',
                'generic_name',
                'brand_name',
                'dosage',
                'current_stock',
                'price',
            ])
            ->where('current_stock', '>', 0)
            ->whereHas('stockIn', $eligibleBatchFilter)
            ->withSum([
                'stockIn as available_stock' => $eligibleBatchFilter,
            ], 'remaining_quantity')
            ->orderBy('generic_name')
            ->get();

        return [
            'stockOutRecords' => $query
                ->paginate(15)
                ->withQueryString(),

            'medicines' => $medicines,
        ];
    }

    /**
     * Build a unified, filterable query for stock-in and stock-out history.
     *
     * The actor's user ID is included so filtering remains reliable even when
     * multiple users share the same display name.
     */
    public static function getTransactionHistory(array $filters = [])
    {
        $stockIn = DB::table('stock_in as si')
            ->join(
                'medicines as m',
                'si.medicine_id',
                '=',
                'm.medicine_id',
            )
            ->leftJoin(
                'users as u',
                'si.received_by',
                '=',
                'u.user_id',
            )
            ->selectRaw("
                'Stock-In' as transaction_type,
                si.recorded_at as date_time,
                si.quantity,
                si.batch_no,
                si.expiry_date,
                si.supplier,
                si.invoice_no,
                si.cost_price,
                si.selling_price,
                m.generic_name,
                m.brand_name,
                m.dosage,
                NULL as patient_name,
                NULL as prescription_no,
                si.received_by as user_id,
                u.full_name as user_name,
                'stock_in' as source_table,
                si.stock_in_id as record_id,
                si.batch_no as batch_reference
            ");

        $stockOut = DB::table('stock_out as so')
            ->join(
                'medicines as m',
                'so.medicine_id',
                '=',
                'm.medicine_id',
            )
            ->leftJoin(
                'users as u',
                'so.dispensed_by',
                '=',
                'u.user_id',
            )
            ->leftJoin(
                'stock_in as si',
                'so.stock_in_id',
                '=',
                'si.stock_in_id',
            )
            ->selectRaw("
                'Stock-Out' as transaction_type,
                so.dispensed_at as date_time,
                so.quantity,
                si.batch_no,
                si.expiry_date,
                si.supplier,
                '' as invoice_no,
                NULL as cost_price,
                so.price as selling_price,
                m.generic_name,
                m.brand_name,
                m.dosage,
                so.patient_name,
                so.prescription_no,
                so.dispensed_by as user_id,
                u.full_name as user_name,
                'stock_out' as source_table,
                so.stock_out_id as record_id,
                si.batch_no as batch_reference
            ");

        $query = DB::query()->fromSub(
            $stockIn->unionAll($stockOut),
            't',
        );

        $query->when(
            filled($filters['search'] ?? null),
            function ($q) use ($filters) {
                $search = mb_strtolower(trim($filters['search']));
                $like = "%{$search}%";

                $q->where(function ($sub) use ($like) {
                    $sub->whereRaw('LOWER(generic_name) LIKE ?', [$like])
                        ->orWhereRaw('LOWER(brand_name) LIKE ?', [$like])
                        ->orWhereRaw('LOWER(patient_name) LIKE ?', [$like])
                        ->orWhereRaw('LOWER(supplier) LIKE ?', [$like])
                        ->orWhereRaw('LOWER(batch_reference) LIKE ?', [$like])
                        ->orWhereRaw('LOWER(invoice_no) LIKE ?', [$like])
                        ->orWhereRaw('LOWER(prescription_no) LIKE ?', [$like]);
                });
            },
        );

        $query->when(
            ($filters['type'] ?? 'all') !== 'all',
            function ($q) use ($filters) {
                $q->where(
                    'source_table',
                    $filters['type'] === 'Stock-In' ? 'stock_in' : 'stock_out',
                );
            },
        );

        $query->when(
            filled($filters['date_from'] ?? null),
            fn ($q) => $q->whereDate('date_time', '>=', $filters['date_from']),
        );

        $query->when(
            filled($filters['date_to'] ?? null),
            fn ($q) => $q->whereDate('date_time', '<=', $filters['date_to']),
        );

        $query->when(
            filled($filters['user'] ?? null) && $filters['user'] !== 'all',
            fn ($q) => $q->where('user_id', (int) $filters['user']),
        );

        return $query;
    }
}
