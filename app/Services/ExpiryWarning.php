<?php

namespace App\Services;

use App\Models\StockIn;
use Illuminate\Support\Carbon;

/**
 * One shared source for the "batch(es) expiring within N days" warning, so
 * Stock Receiving, Stock Dispensing, and Medicine Catalog all show the same
 * numbers and the same batch list in "View details".
 *
 * Only batches that still have stock left are counted.
 */
class ExpiryWarning
{
    public static function payload(int $days = 60): array
    {
        $today = Carbon::today();

        $rows = StockIn::with('medicine:medicine_id,generic_name,brand_name')
            ->where('remaining_quantity', '>', 0)
            ->whereDate('expiry_date', '<=', $today->copy()->addDays($days))
            ->orderBy('expiry_date')
            ->get()
            ->map(function ($b) use ($today) {
                $expiry = Carbon::parse($b->expiry_date)->startOfDay();

                return [
                    'stock_in_id'        => $b->stock_in_id,
                    'generic_name'       => $b->medicine?->generic_name,
                    'brand_name'         => $b->medicine?->brand_name,
                    'batch_no'           => $b->batch_no,
                    'expiry_date'        => $expiry->toDateString(),
                    'remaining_quantity' => $b->remaining_quantity,
                    'days_left'          => (int) $today->diffInDays($expiry, false),
                ];
            });

        return [
            'days'     => $days,
            'expired'  => $rows->where('days_left', '<', 0)->values()->all(),
            'expiring' => $rows->where('days_left', '>=', 0)->values()->all(),
        ];
    }
}
