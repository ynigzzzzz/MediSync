<?php

namespace Tests\Feature;

use App\Models\Medicine;
use App\Models\StockIn;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class DashboardTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_cannot_access_dashboard(): void
    {
        $this->get(route('dashboard'))
            ->assertRedirect(route('login'));
    }

    public function test_authenticated_user_can_view_dashboard(): void
    {
        $user = User::factory()->create([
            'role' => 'pharmacist',
        ]);

        $this->actingAs($user)
            ->get(route('dashboard'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Dashboard/Index')
                ->has('stats')
                ->has('trends')
                ->has('attention')
                ->has('activity', 30)
                ->has('recentActivity')
                ->has('categoryBreakdown')
                ->has('inventoryHealth')
                ->where('inventoryHealth.percentage', 0),
            );
    }

    public function test_dashboard_calculates_inventory_health_correctly(): void
    {
        $user = User::factory()->create([
            'role' => 'pharmacist',
        ]);

        // Low stock: 20 available units.
        $lowStock = $this->createMedicine([
            'generic_name' => 'Low Stock Medicine',
            'category' => 'Pain Relief',
            'current_stock' => 20,
        ]);

        $this->createBatch(
            $lowStock,
            20,
            now()->addMonths(6)->toDateString(),
        );

        // Healthy stock: 100 available units.
        $healthy = $this->createMedicine([
            'generic_name' => 'Healthy Medicine',
            'category' => 'Pain Relief',
            'current_stock' => 100,
        ]);

        $this->createBatch(
            $healthy,
            100,
            now()->addMonths(6)->toDateString(),
        );

        // Expiring within 30 days.
        $expiring = $this->createMedicine([
            'generic_name' => 'Expiring Medicine',
            'category' => 'Antibiotics',
            'current_stock' => 60,
        ]);

        $this->createBatch(
            $expiring,
            60,
            now()->addDays(15)->toDateString(),
        );

        // Already expired.
        $expired = $this->createMedicine([
            'generic_name' => 'Expired Medicine',
            'category' => 'Antibiotics',
            'current_stock' => 40,
        ]);

        $this->createBatch(
            $expired,
            40,
            now()->subDay()->toDateString(),
        );

        // No available stock.
        $this->createMedicine([
            'generic_name' => 'Out of Stock Medicine',
            'category' => 'Vitamins',
            'current_stock' => 0,
        ]);

        $this->actingAs($user)
            ->get(route('dashboard'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Dashboard/Index')

                // Existing inventory statistics.
                ->where('stats.totalMedicines', 5)
                ->where('stats.lowStockCount', 1)
                ->where('stats.outOfStockCount', 2)
                ->where('stats.expiringSoonCount', 1)
                ->where('stats.expiredCount', 1)

                // Inventory health.
                ->where('inventoryHealth.usableStock', 180)
                ->where('inventoryHealth.totalStock', 220)
                ->where('inventoryHealth.percentage', 81.8)

                // Category breakdown.
                ->has('categoryBreakdown', 3)

                ->where('categoryBreakdown.0.name', 'Antibiotics')
                ->where('categoryBreakdown.0.value', 2)
                ->where('categoryBreakdown.0.percentage', 40)

                ->where('categoryBreakdown.1.name', 'Pain Relief')
                ->where('categoryBreakdown.1.value', 2)
                ->where('categoryBreakdown.1.percentage', 40)

                ->where('categoryBreakdown.2.name', 'Vitamins')
                ->where('categoryBreakdown.2.value', 1)
                ->where('categoryBreakdown.2.percentage', 20),
            );
    }

    public function test_dashboard_displays_zero_inventory_statistics_when_empty(): void
    {
        $user = User::factory()->create([
            'role' => 'pharmacist',
        ]);

        $this->actingAs($user)
            ->get(route('dashboard'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Dashboard/Index')

                ->where('stats.totalMedicines', 0)
                ->where('stats.lowStockCount', 0)
                ->where('stats.outOfStockCount', 0)
                ->where('stats.expiringSoonCount', 0)
                ->where('stats.expiredCount', 0)
                ->where('stats.dispensedToday', 0)
                ->where('stats.receivedToday', 0)

                ->where('inventoryHealth.usableStock', 0)
                ->where('inventoryHealth.totalStock', 0)
                ->where('inventoryHealth.percentage', 0)

                ->has('categoryBreakdown', 0)
                ->has('recentActivity', 0),
            );
    }

    private function createMedicine(array $overrides = []): Medicine
    {
        return Medicine::create(array_merge([
            'generic_name' => 'Paracetamol',
            'brand_name' => 'Biogesic',
            'category' => 'Fever',
            'dosage' => '500mg',
            'price' => 2.50,
            'current_stock' => 0,
            'type' => 'Tablet',
        ], $overrides));
    }

    private function createBatch(
        Medicine $medicine,
        int $quantity,
        string $expiryDate,
        array $overrides = [],
    ): StockIn {
        return StockIn::create(array_merge([
            'medicine_id' => $medicine->medicine_id,
            'quantity' => $quantity,
            'batch_no' => 'BATCH-'.uniqid(),
            'expiry_date' => $expiryDate,
            'supplier' => 'Test Supplier',
            'received_by' => null,
            'delivery_date' => now()->toDateString(),
            'invoice_no' => 'N/A',
            'cost_price' => 1.25,
            'selling_price' => 2.50,
            'remaining_quantity' => $quantity,
            'disposed_quantity' => 0,
            'disposed_at' => null,
            'disposed_by' => null,
        ], $overrides));
    }
}
