<?php

namespace Tests\Feature;

use App\Models\Medicine;
use App\Models\StockIn;
use App\Models\StockOut;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class ReportsTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_who_dispensed_is_available_in_report_user_filter(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $medicine = Medicine::create([
            'generic_name' => 'Report Medicine',
            'brand_name' => 'Report Brand',
            'type' => 'Tablet',
            'category' => 'Test',
            'dosage' => '500mg',
            'price' => 2.50,
            'current_stock' => 5,
        ]);

        $batch = StockIn::create([
            'medicine_id' => $medicine->medicine_id,
            'quantity' => 5,
            'batch_no' => 'REPORT-ADMIN-001',
            'expiry_date' => now()->addYear()->toDateString(),
            'remaining_quantity' => 4,
        ]);

        StockOut::create([
            'medicine_id' => $medicine->medicine_id,
            'quantity' => 1,
            'dosage' => '500mg',
            'patient_name' => 'Report Patient',
            'prescription_no' => 'REPORT-RX-001',
            'dispensed_by' => $admin->user_id,
            'price' => 2.50,
            'stock_in_id' => $batch->stock_in_id,
        ]);

        $this->actingAs($admin)
            ->get(route('reports.index', [
                'user_id' => $admin->user_id,
            ]))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Reports/Index')
                ->where('dispensing.total_records', 1)
                ->has('dispensing.users_list', 1)
                ->where(
                    'dispensing.users_list.0.user_id',
                    $admin->user_id,
                ),
            );
    }

    /**
     * Verify that inventory valuation uses the acquisition
     * cost of remaining, unexpired and undisposed batches.
     */
    public function test_inventory_valuation_uses_remaining_batch_acquisition_cost(): void
    {
        $admin = User::factory()->create([
            'role' => 'admin',
        ]);

        $medicine = $this->createValuationFixture();

        $this->actingAs($admin)
            ->get(route('reports.index', [
                'tab' => 'inventory',
            ]))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Reports/Index')
                ->where(
                    'inventory.valuation',
                    fn ($value) => abs((float) $value - 35.50) < 0.001,
                )
                ->where('inventory.usable_units', 10)
                ->has('inventory.rows', 1)
                ->where(
                    'inventory.rows.0.medicine_id',
                    $medicine->medicine_id,
                )
                ->where('inventory.rows.0.available_stock', 10)
                ->where(
                    'inventory.rows.0.price',
                    fn ($value) => abs((float) $value - 20.00) < 0.001,
                )
                ->where(
                    'inventory.rows.0.stock_value',
                    fn ($value) => abs((float) $value - 35.50) < 0.001,
                ),
            );
    }

    /**
     * Verify that CSV exports distinguish the current
     * selling price from the actual acquisition cost.
     */
    public function test_inventory_csv_exports_correct_acquisition_cost(): void
    {
        $admin = User::factory()->create([
            'role' => 'admin',
        ]);

        $this->createValuationFixture();

        $response = $this->actingAs($admin)
            ->get(route('reports.export', [
                'tab' => 'inventory',
            ]));

        $response->assertOk();

        $csv = $response->streamedContent();

        // Remove the UTF-8 BOM before parsing.
        $csv = preg_replace('/^\xEF\xBB\xBF/', '', $csv);

        $lines = preg_split('/\r\n|\n|\r/', trim($csv));

        $rows = array_map(
            fn ($line) => str_getcsv($line),
            $lines,
        );

        $header = null;
        $medicineRow = null;

        foreach ($rows as $row) {
            if (in_array('Generic Name', $row, true)) {
                $header = $row;
            }

            if (($row[1] ?? null) === 'Valuation Regression Medicine') {
                $medicineRow = $row;
            }
        }

        $this->assertNotNull($header);
        $this->assertNotNull($medicineRow);

        // CSV column mapping.
        $this->assertSame(
            'Current Selling Price',
            $header[7],
        );

        $this->assertSame(
            'Stock Value (Acquisition Cost)',
            $header[8],
        );

        // Selling price is a unit price.
        $this->assertEqualsWithDelta(
            20.00,
            (float) $medicineRow[7],
            0.001,
        );

        // Acquisition value is based on remaining batch costs.
        $this->assertEqualsWithDelta(
            35.50,
            (float) $medicineRow[8],
            0.001,
        );
    }

    /**
     * Verify that the printable inventory report displays
     * the correct selling-price and acquisition valuations.
     */
    public function test_inventory_print_report_displays_correct_valuations(): void
    {
        $admin = User::factory()->create([
            'role' => 'admin',
        ]);

        $this->createValuationFixture();

        $this->actingAs($admin)
            ->get(route('reports.print', [
                'tab' => 'inventory',
            ]))
            ->assertOk()
            ->assertSee('Valuation Regression Medicine')
            ->assertSee('Stock Value (Selling Price)')
            ->assertSee('Stock Value (Acquisition Cost)')
            ->assertSee('₱200.00')
            ->assertSee('₱35.50');
    }

    /**
     * Create controlled inventory records for valuation tests.
     *
     * Eligible:
     * 6 units x ₱3.25 = ₱19.50
     * 4 units x ₱4.00 = ₱16.00
     *
     * Expected acquisition value = ₱35.50
     *
     * Expired, disposed and depleted batches must be excluded.
     */
    private function createValuationFixture(): Medicine
    {
        $medicine = Medicine::create([
            'generic_name' => 'Valuation Regression Medicine',
            'brand_name' => 'Valuation Test Brand',
            'type' => 'Tablet',
            'category' => 'Test',
            'dosage' => '500mg',
            'price' => 20.00,
            'current_stock' => 20,
        ]);

        $createBatch = function (array $attributes) use ($medicine): void {
            StockIn::create(array_merge([
                'medicine_id' => $medicine->medicine_id,
                'selling_price' => 20.00,
            ], $attributes));
        };

        // Eligible batch 1: 6 x ₱3.25 = ₱19.50
        $createBatch([
            'quantity' => 10,
            'batch_no' => 'VALUATION-ELIGIBLE-001',
            'expiry_date' => now()->addDays(10)->toDateString(),
            'remaining_quantity' => 6,
            'cost_price' => 3.25,
        ]);

        // Eligible batch 2: 4 x ₱4.00 = ₱16.00
        // Expiry today is still eligible.
        $createBatch([
            'quantity' => 10,
            'batch_no' => 'VALUATION-ELIGIBLE-002',
            'expiry_date' => now()->toDateString(),
            'remaining_quantity' => 4,
            'cost_price' => 4.00,
        ]);

        // Expired batch: must not be included.
        $createBatch([
            'quantity' => 5,
            'batch_no' => 'VALUATION-EXPIRED-001',
            'expiry_date' => now()->subDay()->toDateString(),
            'remaining_quantity' => 5,
            'cost_price' => 99.00,
        ]);

        // Disposed batch: must not be included.
        $createBatch([
            'quantity' => 10,
            'batch_no' => 'VALUATION-DISPOSED-001',
            'expiry_date' => now()->addDays(10)->toDateString(),
            'remaining_quantity' => 5,
            'disposed_quantity' => 5,
            'disposed_at' => now(),
            'cost_price' => 88.00,
        ]);

        // Depleted batch: must not be included.
        $createBatch([
            'quantity' => 5,
            'batch_no' => 'VALUATION-EMPTY-001',
            'expiry_date' => now()->addDays(10)->toDateString(),
            'remaining_quantity' => 0,
            'cost_price' => 100.00,
        ]);

        return $medicine;
    }
}
