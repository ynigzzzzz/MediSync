<?php

namespace Tests\Feature;

use App\Models\Medicine;
use App\Models\StockIn;
use App\Models\User;
use App\Services\NotificationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class NotificationServiceTest extends TestCase
{
    use RefreshDatabase;

    public function test_low_stock_notification_updates_when_stock_changes(): void
    {
        $user = User::factory()->create([
            'role' => 'pharmacist',
            'status' => 'active',
        ]);

        $medicine = $this->createMedicine(45);

        $batch = $this->createBatch($medicine, 45);

        NotificationService::syncStockAlerts();

        $key = 'low_stock:'.$medicine->medicine_id;

        $notification = DB::table('system_notifications')
            ->where('user_id', $user->user_id)
            ->where('dedupe_key', $key)
            ->first();

        $this->assertNotNull($notification);
        $this->assertStringContainsString(
            '45 units available',
            $notification->message,
        );

        // Mark the original notification as read.
        DB::table('system_notifications')
            ->where('notification_id', $notification->notification_id)
            ->update(['read_at' => now()]);

        // Simulate dispensing.
        $batch->update(['remaining_quantity' => 12]);
        $medicine->update(['current_stock' => 12]);

        NotificationService::syncStockAlerts();

        $updated = DB::table('system_notifications')
            ->where('user_id', $user->user_id)
            ->where('dedupe_key', $key)
            ->first();

        $this->assertNotNull($updated);

        $this->assertStringContainsString(
            '12 units available',
            $updated->message,
        );

        // Existing read status must be preserved.
        $this->assertNotNull($updated->read_at);

        // No duplicate notifications.
        $this->assertSame(
            1,
            DB::table('system_notifications')
                ->where('user_id', $user->user_id)
                ->where('dedupe_key', $key)
                ->count(),
        );
    }

    public function test_low_stock_threshold_is_exactly_50_units(): void
    {
        $user = User::factory()->create([
            'role' => 'pharmacist',
            'status' => 'active',
        ]);

        $lowStock = $this->createMedicine(49);
        $normalStock = $this->createMedicine(50);

        $this->createBatch($lowStock, 49);
        $this->createBatch($normalStock, 50);

        $stats = Medicine::getStats();

        $this->assertSame(1, $stats['lowstock']);

        NotificationService::syncStockAlerts();

        $this->assertDatabaseHas('system_notifications', [
            'user_id' => $user->user_id,
            'dedupe_key' => 'low_stock:'.$lowStock->medicine_id,
        ]);

        $this->assertDatabaseMissing('system_notifications', [
            'user_id' => $user->user_id,
            'dedupe_key' => 'low_stock:'.$normalStock->medicine_id,
        ]);
    }

    private function createMedicine(int $quantity): Medicine
    {
        return Medicine::create([
            'generic_name' => 'Test Medicine '.uniqid(),
            'brand_name' => 'Test Brand',
            'category' => 'Fever',
            'dosage' => '500mg',
            'price' => 2.50,
            'current_stock' => $quantity,
            'type' => 'Tablet',
        ]);
    }

    private function createBatch(
        Medicine $medicine,
        int $quantity,
    ): StockIn {
        return StockIn::create([
            'medicine_id' => $medicine->medicine_id,
            'quantity' => $quantity,
            'batch_no' => 'BATCH-'.uniqid(),
            'expiry_date' => now()->addMonths(6)->toDateString(),
            'supplier' => 'Test Supplier',
            'received_by' => null,
            'delivery_date' => now()->toDateString(),
            'invoice_no' => 'N/A',
            'cost_price' => 1.25,
            'selling_price' => 2.50,
            'remaining_quantity' => $quantity,
            'disposed_quantity' => 0,
        ]);
    }
}
