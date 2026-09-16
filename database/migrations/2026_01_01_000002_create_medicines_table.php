<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('medicines', function (Blueprint $table) {
            $table->id('medicine_id');
            $table->string('generic_name', 100);
            $table->string('brand_name', 100);
            $table->string('category', 50);
            $table->string('dosage', 50);
            $table->decimal('price', 10, 2);
            $table->integer('current_stock')->default(0);
            $table->timestamp('created_at')->useCurrent();
            $table->string('type', 50)->default('Tablet');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('medicines');
    }
};
