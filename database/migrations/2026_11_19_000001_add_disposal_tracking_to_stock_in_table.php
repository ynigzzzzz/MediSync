
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('stock_in', function (Blueprint $table) {
            $table->integer('disposed_quantity')->default(0);

            $table->timestamp('disposed_at')->nullable();

            $table->foreignId('disposed_by')
                ->nullable()
                ->constrained('users', 'user_id')
                ->nullOnDelete();
        });

        DB::statement('
            ALTER TABLE stock_in
            ADD CONSTRAINT stock_in_disposed_quantity_check
            CHECK (
                disposed_quantity >= 0
                AND disposed_quantity <= quantity
            )
        ');
    }

    public function down(): void
    {
        DB::statement('
            ALTER TABLE stock_in
            DROP CONSTRAINT IF EXISTS stock_in_disposed_quantity_check
        ');

        Schema::table('stock_in', function (Blueprint $table) {
            $table->dropForeign(['disposed_by']);

            $table->dropColumn([
                'disposed_quantity',
                'disposed_at',
                'disposed_by',
            ]);
        });
    }
};
