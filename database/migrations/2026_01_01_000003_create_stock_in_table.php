<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stock_in', function (Blueprint $table) {
            $table->id('stock_in_id');

            $table->foreignId('medicine_id')
                ->constrained('medicines', 'medicine_id')
                ->cascadeOnDelete();

            $table->integer('quantity');
            $table->string('batch_no', 50);
            $table->date('expiry_date');
            $table->string('supplier', 100)->nullable();

            $table->foreignId('received_by')
                ->nullable()
                ->constrained('users', 'user_id')
                ->nullOnDelete();

            $table->date('delivery_date')->nullable();
            $table->string('invoice_no', 50)->nullable();
            $table->timestamp('recorded_at')->useCurrent();
            $table->decimal('cost_price', 10, 2)->default(0);
            $table->decimal('selling_price', 10, 2)->default(0);
            $table->integer('remaining_quantity')->default(0);
        });

        DB::statement('ALTER TABLE stock_in ADD CONSTRAINT stock_in_quantity_check CHECK (quantity > 0)');
        DB::statement('ALTER TABLE stock_in ADD CONSTRAINT stock_in_cost_price_check CHECK (cost_price >= 0)');
        DB::statement('ALTER TABLE stock_in ADD CONSTRAINT stock_in_selling_price_check CHECK (selling_price >= 0)');
    }

    public function down(): void
    {
        Schema::dropIfExists('stock_in');
    }
};
