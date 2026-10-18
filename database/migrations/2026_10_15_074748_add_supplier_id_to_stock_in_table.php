<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('stock_in', function (Blueprint $table) {
            // Nullable so existing rows that only have the free-text `supplier`
            // column keep working. New rows can point at a Suppliers record.
            $table->foreignId('supplier_id')
                ->nullable()
                ->after('supplier')
                ->constrained('suppliers', 'supplier_id')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('stock_in', function (Blueprint $table) {
            $table->dropConstrainedForeignId('supplier_id');
        });
    }
};