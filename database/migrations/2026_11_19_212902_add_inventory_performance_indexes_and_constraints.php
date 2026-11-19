<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // FEFO batch selection
        DB::statement('
            CREATE INDEX IF NOT EXISTS stock_in_fefo_idx
            ON stock_in (medicine_id, expiry_date, stock_in_id)
            WHERE remaining_quantity > 0
              AND disposed_at IS NULL
        ');

        // Batch lookup
        DB::statement('
            CREATE INDEX IF NOT EXISTS stock_out_batch_lookup_idx
            ON stock_out (stock_in_id)
            WHERE stock_in_id IS NOT NULL
        ');

        // Latest dispensing records
        DB::statement('
            CREATE INDEX IF NOT EXISTS stock_out_latest_idx
            ON stock_out (dispensed_at DESC, stock_out_id DESC)
        ');

        // PostgreSQL-specific integrity constraints
        if (DB::getDriverName() !== 'pgsql') {
            return;
        }

        DB::statement('
            ALTER TABLE stock_in
            ADD CONSTRAINT stock_in_remaining_quantity_check
            CHECK (
                remaining_quantity >= 0
                AND remaining_quantity + disposed_quantity <= quantity
            ) NOT VALID
        ');

        DB::statement('
            ALTER TABLE stock_in
            VALIDATE CONSTRAINT stock_in_remaining_quantity_check
        ');

        DB::statement('
            ALTER TABLE medicines
            ADD CONSTRAINT medicines_current_stock_nonnegative_check
            CHECK (current_stock >= 0) NOT VALID
        ');

        DB::statement('
            ALTER TABLE medicines
            VALIDATE CONSTRAINT medicines_current_stock_nonnegative_check
        ');
    }

    public function down(): void
    {
        if (DB::getDriverName() === 'pgsql') {
            DB::statement('
                ALTER TABLE stock_in
                DROP CONSTRAINT IF EXISTS stock_in_remaining_quantity_check
            ');

            DB::statement('
                ALTER TABLE medicines
                DROP CONSTRAINT IF EXISTS medicines_current_stock_nonnegative_check
            ');
        }

        DB::statement('DROP INDEX IF EXISTS stock_in_fefo_idx');
        DB::statement('DROP INDEX IF EXISTS stock_out_batch_lookup_idx');
        DB::statement('DROP INDEX IF EXISTS stock_out_latest_idx');
    }
};
