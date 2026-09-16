<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stock_out', function (Blueprint $table) {
            $table->id('stock_out_id');

            $table->foreignId('medicine_id')
                ->constrained('medicines', 'medicine_id')
                ->cascadeOnDelete();

            $table->integer('quantity');
            $table->string('dosage', 50)->nullable();
            $table->string('patient_name', 100);
            $table->string('prescription_no', 50);

            $table->foreignId('dispensed_by')
                ->constrained('users', 'user_id');

            $table->timestamp('dispensed_at')->useCurrent();
            $table->decimal('price', 10, 2)->default(0);

            // total_amount is added as a generated column below — Blueprint
            // can't express GENERATED ALWAYS ... STORED portably, and this
            // must match the dump exactly since the app never writes to it.

            $table->foreignId('stock_in_id')
                ->nullable()
                ->constrained('stock_in', 'stock_in_id');
        });

        DB::statement('ALTER TABLE stock_out ADD COLUMN total_amount numeric(10,2) GENERATED ALWAYS AS (quantity * price) STORED');

        DB::statement('ALTER TABLE stock_out ADD CONSTRAINT stock_out_quantity_check CHECK (quantity > 0)');
        DB::statement('ALTER TABLE stock_out ADD CONSTRAINT stock_out_price_check CHECK (price >= 0)');
        DB::statement('ALTER TABLE stock_out ADD CONSTRAINT stock_out_total_check CHECK (total_amount >= 0)');
    }

    public function down(): void
    {
        Schema::dropIfExists('stock_out');
    }
};
