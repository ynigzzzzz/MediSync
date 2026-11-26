<?php

namespace Tests\Feature;

use App\Models\Medicine;
use App\Models\StockIn;
use App\Models\StockOut;
use App\Models\Supplier;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class StockManagementSecurityTest extends TestCase
{
    use RefreshDatabase;

    public function test_assistant_cannot_view_or_receive_stock(): void
    {
        $assistant = User::factory()->create(['role' => 'assistant']);

        $this->actingAs($assistant)
            ->get(route('stock-receiving.index'))
            ->assertForbidden();

        $this->post(route('stock-receiving.store'), [])
            ->assertForbidden();
    }

    public function test_pharmacist_can_receive_stock_and_audit_entry_references_the_batch(): void
    {
        $pharmacist = User::factory()->create(['role' => 'pharmacist']);
        $medicine = $this->createMedicine();

        $supplier = Supplier::create([
            'name' => 'Active Supplier',
            'status' => 'active',
        ]);

        $response = $this->actingAs($pharmacist)->post(
            route('stock-receiving.store'),
            [
                'medicine_id' => $medicine->medicine_id,
                'supplier_id' => $supplier->supplier_id,
                'batch_no' => 'RECEIVE-001',
                'expiry_date' => now()->addYear()->toDateString(),
                'delivery_date' => now()->toDateString(),
                'quantity' => 12,
                'sell_price' => 2.50,
                'cost_price' => 1.25,
                'dosage' => '500mg',
            ],
        );

        $response->assertSessionHasNoErrors();

        $batch = StockIn::query()
            ->where('batch_no', 'RECEIVE-001')
            ->firstOrFail();

        $this->assertDatabaseHas('medicines', [
            'medicine_id' => $medicine->medicine_id,
            'current_stock' => 12,
        ]);

        $this->assertDatabaseHas('audit_log', [
            'user_id' => $pharmacist->user_id,
            'action_type' => 'STOCK_IN',
            'reference_id' => $batch->stock_in_id,
        ]);

        $this->assertSame(
            1,
            DB::table('audit_log')
                ->where('action_type', 'STOCK_IN')
                ->where('reference_id', $batch->stock_in_id)
                ->count(),
        );
    }

    public function test_disposal_rolls_back_all_batches_when_one_selected_batch_is_already_disposed(): void
    {
        $pharmacist = User::factory()->create([
            'role' => 'pharmacist',
        ]);

        $medicine = $this->createMedicine([
            'current_stock' => 5,
        ]);

        // First batch: valid and available for disposal.
        $validBatch = $this->createBatch(
            $medicine,
            5,
            now()->addMonths(6)->toDateString(),
        );

        // Second batch: already disposed.
        $disposedBatch = $this->createBatch(
            $medicine,
            5,
            now()->addMonths(6)->toDateString(),
            [
                'remaining_quantity' => 0,
                'disposed_quantity' => 5,
                'disposed_at' => now(),
                'disposed_by' => $pharmacist->user_id,
            ],
        );

        $auditCountBefore = DB::table('audit_log')
            ->where('action_type', 'DISPOSE_BATCH')
            ->count();

        // Select both batches. The valid batch is processed first
        // because disposal orders batches by stock_in_id.
        $response = $this->actingAs($pharmacist)
            ->from(route('stock-receiving.index'))
            ->post('/stock-receiving/dispose', [
                'batch_ids' => [
                    $validBatch->stock_in_id,
                    $disposedBatch->stock_in_id,
                ],
            ]);

        $response->assertSessionHasErrors('batch_ids');

        // First batch must be restored after transaction rollback.
        $this->assertDatabaseHas('stock_in', [
            'stock_in_id' => $validBatch->stock_in_id,
            'remaining_quantity' => 5,
            'disposed_quantity' => 0,
            'disposed_at' => null,
        ]);

        // Previously disposed batch must remain unchanged.
        $this->assertDatabaseHas('stock_in', [
            'stock_in_id' => $disposedBatch->stock_in_id,
            'remaining_quantity' => 0,
            'disposed_quantity' => 5,
            'disposed_by' => $pharmacist->user_id,
        ]);

        // Aggregate medicine inventory must remain unchanged.
        $this->assertDatabaseHas('medicines', [
            'medicine_id' => $medicine->medicine_id,
            'current_stock' => 5,
        ]);

        // No partial disposal audit entry should be committed.
        $auditCountAfter = DB::table('audit_log')
            ->where('action_type', 'DISPOSE_BATCH')
            ->count();

        $this->assertSame(
            $auditCountBefore,
            $auditCountAfter,
        );

        $this->assertDatabaseMissing('audit_log', [
            'action_type' => 'DISPOSE_BATCH',
            'reference_id' => $validBatch->stock_in_id,
        ]);
    }

    public function test_assistant_can_view_dispensing_and_dispense_available_stock(): void
    {
        $assistant = User::factory()->create(['role' => 'assistant']);
        $medicine = $this->createMedicine(['current_stock' => 8]);
        $batch = $this->createBatch(
            $medicine,
            8,
            now()->addMonths(6)->toDateString(),
        );

        $this->actingAs($assistant)
            ->get(route('dispensing.index'))
            ->assertOk();

        $this->post(route('dispensing.store'), [
            'items' => [[
                'medicine_id' => $medicine->medicine_id,
                'quantity' => 2,
                'dosage' => '500mg',
            ]],
        ])->assertSessionHasNoErrors();

        $this->assertDatabaseHas('stock_in', [
            'stock_in_id' => $batch->stock_in_id,
            'remaining_quantity' => 6,
        ]);

        $this->assertDatabaseHas('medicines', [
            'medicine_id' => $medicine->medicine_id,
            'current_stock' => 6,
        ]);
    }

    public function test_unknown_roles_cannot_access_stock_receiving_or_dispensing(): void
    {
        $unknownRoleUser = User::factory()->create(['role' => 'supervisor']);

        $this->actingAs($unknownRoleUser)
            ->get(route('stock-receiving.index'))
            ->assertForbidden();

        $this->get(route('dispensing.index'))
            ->assertForbidden();

        $this->get('/dispensing/unexpired-stock?medicine_id=1')
            ->assertForbidden();

        $this->post(route('stock-receiving.store'), [])
            ->assertForbidden();

        $this->post(route('dispensing.store'), [])
            ->assertForbidden();
    }

    public function test_dispensing_consumes_batches_in_fefo_order(): void
    {
        $pharmacist = User::factory()->create(['role' => 'pharmacist']);
        $medicine = $this->createMedicine(['current_stock' => 10]);

        $earlierBatch = $this->createBatch(
            $medicine,
            5,
            now()->addDays(10)->toDateString(),
        );

        $laterBatch = $this->createBatch(
            $medicine,
            5,
            now()->addDays(20)->toDateString(),
        );

        $this->actingAs($pharmacist)->post(route('dispensing.store'), [
            'items' => [[
                'medicine_id' => $medicine->medicine_id,
                'quantity' => 7,
                'dosage' => '500mg',
            ]],
        ])->assertSessionHasNoErrors();

        $dispenses = StockOut::query()
            ->orderBy('stock_out_id')
            ->get();

        $this->assertCount(2, $dispenses);

        $this->assertSame(
            (int) $earlierBatch->stock_in_id,
            (int) $dispenses[0]->stock_in_id,
        );

        $this->assertSame(5, (int) $dispenses[0]->quantity);

        $this->assertSame(
            (int) $laterBatch->stock_in_id,
            (int) $dispenses[1]->stock_in_id,
        );

        $this->assertSame(2, (int) $dispenses[1]->quantity);

        $this->assertDatabaseHas('stock_in', [
            'stock_in_id' => $earlierBatch->stock_in_id,
            'remaining_quantity' => 0,
        ]);

        $this->assertDatabaseHas('stock_in', [
            'stock_in_id' => $laterBatch->stock_in_id,
            'remaining_quantity' => 3,
        ]);

        // Verify aggregate medicine stock after FEFO dispensing.
        $this->assertDatabaseHas('medicines', [
            'medicine_id' => $medicine->medicine_id,
            'current_stock' => 3,
        ]);
    }

    public function test_dispensing_uses_only_unexpired_and_undisposed_batches(): void
    {
        $pharmacist = User::factory()->create([
            'role' => 'pharmacist',
        ]);

        $medicine = $this->createMedicine([
            'current_stock' => 10,
        ]);

        // Expired batch: must not be used.
        $expiredBatch = $this->createBatch(
            $medicine,
            5,
            now()->subDay()->toDateString(),
        );

        // Disposed batch: must not be used.
        $disposedBatch = $this->createBatch(
            $medicine,
            5,
            now()->addDays(10)->toDateString(),
            [
                'remaining_quantity' => 0,
                'disposed_quantity' => 5,
                'disposed_at' => now(),
                'disposed_by' => $pharmacist->user_id,
            ],
        );

        // Valid batch: this is the only batch available for dispensing.
        $validBatch = $this->createBatch(
            $medicine,
            5,
            now()->addDays(20)->toDateString(),
        );

        $this->actingAs($pharmacist)
            ->post(route('dispensing.store'), [
                'items' => [[
                    'medicine_id' => $medicine->medicine_id,
                    'quantity' => 5,
                    'dosage' => '500mg',
                ]],
            ])
            ->assertSessionHasNoErrors();

        $dispenses = StockOut::query()->get();

        $this->assertCount(1, $dispenses);

        // Only the valid batch should be consumed.
        $this->assertSame(
            (int) $validBatch->stock_in_id,
            (int) $dispenses->first()->stock_in_id,
        );

        // Expired batch remains untouched.
        $this->assertDatabaseHas('stock_in', [
            'stock_in_id' => $expiredBatch->stock_in_id,
            'remaining_quantity' => 5,
        ]);

        // Disposed batch remains untouched.
        $this->assertDatabaseHas('stock_in', [
            'stock_in_id' => $disposedBatch->stock_in_id,
            'remaining_quantity' => 0,
            'disposed_quantity' => 5,
        ]);

        // Valid batch is consumed.
        $this->assertDatabaseHas('stock_in', [
            'stock_in_id' => $validBatch->stock_in_id,
            'remaining_quantity' => 0,
        ]);

        // Aggregate stock is updated correctly.
        $this->assertDatabaseHas('medicines', [
            'medicine_id' => $medicine->medicine_id,
            'current_stock' => 5,
        ]);
    }

    public function test_multi_medicine_dispense_rolls_back_if_any_item_has_insufficient_unexpired_stock(): void
    {
        $pharmacist = User::factory()->create(['role' => 'pharmacist']);

        $firstMedicine = $this->createMedicine([
            'generic_name' => 'First Medicine',
            'current_stock' => 5,
        ]);

        $secondMedicine = $this->createMedicine([
            'generic_name' => 'Second Medicine',
            'current_stock' => 4,
        ]);

        $firstBatch = $this->createBatch(
            $firstMedicine,
            5,
            now()->addMonths(6)->toDateString(),
        );

        $response = $this->actingAs($pharmacist)
            ->from(route('dispensing.index'))
            ->post(
                route('dispensing.store'),
                [
                    'items' => [
                        [
                            'medicine_id' => $firstMedicine->medicine_id,
                            'quantity' => 2,
                            'dosage' => '500mg',
                        ],
                        [
                            'medicine_id' => $secondMedicine->medicine_id,
                            'quantity' => 1,
                            'dosage' => '250mg',
                        ],
                    ],
                ],
            );

        $response->assertSessionHasErrors('dispense');

        // First medicine must retain its original stock.
        $this->assertDatabaseHas('medicines', [
            'medicine_id' => $firstMedicine->medicine_id,
            'current_stock' => 5,
        ]);

        // Second medicine must also retain its original stock.
        $this->assertDatabaseHas('medicines', [
            'medicine_id' => $secondMedicine->medicine_id,
            'current_stock' => 4,
        ]);

        // First medicine's original batch must be restored.
        $this->assertDatabaseHas('stock_in', [
            'stock_in_id' => $firstBatch->stock_in_id,
            'remaining_quantity' => 5,
        ]);

        // No dispensing records should survive the failed transaction.
        $this->assertDatabaseCount('stock_out', 0);

        // No dispensing audit entry should survive the failed transaction.
        $this->assertDatabaseMissing('audit_log', [
            'action_type' => 'STOCK_OUT',
        ]);
    }

    public function test_pharmacist_cannot_delete_receiving_or_dispensing_records(): void
    {
        $pharmacist = User::factory()->create(['role' => 'pharmacist']);
        $medicine = $this->createMedicine(['current_stock' => 5]);

        $batch = $this->createBatch(
            $medicine,
            5,
            now()->addMonths(6)->toDateString(),
        );

        $dispense = StockOut::create([
            'medicine_id' => $medicine->medicine_id,
            'quantity' => 1,
            'dosage' => '500mg',
            'patient_name' => 'Test Patient',
            'prescription_no' => 'RX-TEST-001',
            'dispensed_by' => $pharmacist->user_id,
            'price' => 2.50,
            'stock_in_id' => $batch->stock_in_id,
        ]);

        $this->actingAs($pharmacist)->delete(
            route('stock-receiving.destroy', $batch),
            ['reason' => 'Attempted deletion'],
        )->assertForbidden();

        $this->delete(
            route('dispensing.destroy', $dispense),
            ['reason' => 'Attempted deletion'],
        )->assertForbidden();
    }

    public function test_assistant_cannot_dispose_batches(): void
    {
        $assistant = User::factory()->create(['role' => 'assistant']);
        $medicine = $this->createMedicine(['current_stock' => 5]);

        $batch = $this->createBatch(
            $medicine,
            5,
            now()->addMonths(6)->toDateString(),
        );

        $this->actingAs($assistant)->post('/stock-receiving/dispose', [
            'batch_ids' => [$batch->stock_in_id],
        ])->assertForbidden();
    }

    public function test_pharmacist_can_dispose_a_batch_and_audit_entry_references_it(): void
    {
        $pharmacist = User::factory()->create(['role' => 'pharmacist']);
        $medicine = $this->createMedicine(['current_stock' => 5]);

        $batch = $this->createBatch(
            $medicine,
            5,
            now()->addMonths(6)->toDateString(),
        );

        $this->actingAs($pharmacist)->post('/stock-receiving/dispose', [
            'batch_ids' => [$batch->stock_in_id],
        ])->assertSessionHasNoErrors();

        $this->assertDatabaseHas('stock_in', [
            'stock_in_id' => $batch->stock_in_id,
            'remaining_quantity' => 0,
            'disposed_quantity' => 5,
            'disposed_by' => $pharmacist->user_id,
        ]);

        $this->assertDatabaseHas('medicines', [
            'medicine_id' => $medicine->medicine_id,
            'current_stock' => 0,
        ]);

        $this->assertDatabaseHas('audit_log', [
            'user_id' => $pharmacist->user_id,
            'action_type' => 'DISPOSE_BATCH',
            'reference_id' => $batch->stock_in_id,
        ]);
    }

    public function test_admin_stock_in_deletion_audits_the_batch_id(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $medicine = $this->createMedicine(['current_stock' => 5]);

        $batch = $this->createBatch(
            $medicine,
            5,
            now()->addMonths(6)->toDateString(),
        );

        $this->actingAs($admin)->delete(
            route('stock-receiving.destroy', $batch),
            ['reason' => 'Duplicate receiving entry'],
        )->assertSessionHasNoErrors();

        $this->assertDatabaseMissing('stock_in', [
            'stock_in_id' => $batch->stock_in_id,
        ]);

        $this->assertDatabaseHas('audit_log', [
            'user_id' => $admin->user_id,
            'action_type' => 'DELETE_STOCK_IN',
            'reference_id' => $batch->stock_in_id,
            'reason' => 'Duplicate receiving entry',
        ]);

        $this->assertDatabaseHas('medicines', [
            'medicine_id' => $medicine->medicine_id,
            'current_stock' => 0,
        ]);
    }

    public function test_admin_stock_out_reversal_audits_the_dispensing_record_id(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $medicine = $this->createMedicine(['current_stock' => 3]);

        $batch = $this->createBatch(
            $medicine,
            10,
            now()->addMonths(6)->toDateString(),
            ['remaining_quantity' => 3],
        );

        $dispense = StockOut::create([
            'medicine_id' => $medicine->medicine_id,
            'quantity' => 7,
            'dosage' => '500mg',
            'patient_name' => 'Test Patient',
            'prescription_no' => 'RX-TEST-002',
            'dispensed_by' => $admin->user_id,
            'price' => 2.50,
            'stock_in_id' => $batch->stock_in_id,
        ]);

        $this->actingAs($admin)->delete(
            route('dispensing.destroy', $dispense),
            ['reason' => 'Corrected dispensing record'],
        )->assertSessionHasNoErrors();

        $this->assertDatabaseHas('stock_in', [
            'stock_in_id' => $batch->stock_in_id,
            'remaining_quantity' => 10,
        ]);

        $this->assertDatabaseHas('medicines', [
            'medicine_id' => $medicine->medicine_id,
            'current_stock' => 10,
        ]);

        $this->assertDatabaseHas('audit_log', [
            'user_id' => $admin->user_id,
            'action_type' => 'DELETE_STOCK_OUT',
            'reference_id' => $dispense->stock_out_id,
            'reason' => 'Corrected dispensing record',
        ]);
    }

    public function test_admin_cannot_reverse_dispensing_from_a_disposed_batch(): void
    {
        $admin = User::factory()->create([
            'role' => 'admin',
        ]);

        $medicine = $this->createMedicine([
            'current_stock' => 0,
        ]);

        $batch = $this->createBatch(
            $medicine,
            10,
            now()->addMonths(6)->toDateString(),
            [
                'remaining_quantity' => 0,
                'disposed_quantity' => 3,
                'disposed_at' => now(),
                'disposed_by' => $admin->user_id,
            ],
        );

        $dispense = StockOut::create([
            'medicine_id' => $medicine->medicine_id,
            'quantity' => 7,
            'dosage' => '500mg',
            'patient_name' => 'Test Patient',
            'prescription_no' => 'RX-DISPOSED-001',
            'dispensed_by' => $admin->user_id,
            'price' => 2.50,
            'stock_in_id' => $batch->stock_in_id,
        ]);

        $response = $this->actingAs($admin)
            ->from(route('dispensing.index'))
            ->delete(
                route('dispensing.destroy', $dispense),
                ['reason' => 'Attempted reversal'],
            );

        $response->assertSessionHasErrors('delete');

        // The original dispensing record must remain.
        $this->assertDatabaseHas('stock_out', [
            'stock_out_id' => $dispense->stock_out_id,
            'quantity' => 7,
        ]);

        // The disposed batch must remain unchanged.
        $this->assertDatabaseHas('stock_in', [
            'stock_in_id' => $batch->stock_in_id,
            'remaining_quantity' => 0,
            'disposed_quantity' => 3,
        ]);

        // Aggregate inventory must not increase.
        $this->assertDatabaseHas('medicines', [
            'medicine_id' => $medicine->medicine_id,
            'current_stock' => 0,
        ]);

        // No successful reversal audit should be recorded.
        $this->assertDatabaseMissing('audit_log', [
            'action_type' => 'DELETE_STOCK_OUT',
            'reference_id' => $dispense->stock_out_id,
        ]);
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

    public function test_inventory_remains_balanced_after_dispensing_and_disposal(): void
    {
        $pharmacist = User::factory()->create([
            'role' => 'pharmacist',
        ]);

        $medicine = $this->createMedicine([
            'generic_name' => 'Lifecycle Test Medicine',
            'current_stock' => 100,
        ]);

        $firstBatch = $this->createBatch(
            $medicine,
            40,
            now()->addDays(10)->toDateString(),
        );

        $secondBatch = $this->createBatch(
            $medicine,
            60,
            now()->addDays(20)->toDateString(),
        );

        // STEP 1: Dispense 30 units.
        $this->actingAs($pharmacist)
            ->post(route('dispensing.store'), [
                'items' => [[
                    'medicine_id' => $medicine->medicine_id,
                    'quantity' => 30,
                    'dosage' => '500mg',
                ]],
            ])
            ->assertSessionHasNoErrors();

        // Verify FEFO consumption.
        $this->assertDatabaseHas('stock_in', [
            'stock_in_id' => $firstBatch->stock_in_id,
            'remaining_quantity' => 10,
        ]);

        $this->assertDatabaseHas('stock_in', [
            'stock_in_id' => $secondBatch->stock_in_id,
            'remaining_quantity' => 60,
        ]);

        $this->assertSame(
            70,
            (int) Medicine::where(
                'medicine_id',
                $medicine->medicine_id,
            )->value('current_stock'),
        );

        // STEP 2: Dispose of both remaining batches.
        $this->post('/stock-receiving/dispose', [
            'batch_ids' => [
                $firstBatch->stock_in_id,
                $secondBatch->stock_in_id,
            ],
        ])->assertSessionHasNoErrors();

        // STEP 3: Verify disposal history.
        $this->assertDatabaseHas('stock_in', [
            'stock_in_id' => $firstBatch->stock_in_id,
            'remaining_quantity' => 0,
            'disposed_quantity' => 10,
        ]);

        $this->assertDatabaseHas('stock_in', [
            'stock_in_id' => $secondBatch->stock_in_id,
            'remaining_quantity' => 0,
            'disposed_quantity' => 60,
        ]);

        // STEP 4: Verify aggregate inventory.
        $currentStock = (int) Medicine::where(
            'medicine_id',
            $medicine->medicine_id,
        )->value('current_stock');

        $remainingStock = (int) StockIn::where(
            'medicine_id',
            $medicine->medicine_id,
        )->sum('remaining_quantity');

        $this->assertSame(0, $currentStock);
        $this->assertSame(0, $remainingStock);

        // STEP 5: Verify dispensing history remains intact.
        $this->assertSame(
            30,
            (int) StockOut::where(
                'medicine_id',
                $medicine->medicine_id,
            )->sum('quantity'),
        );

        // STEP 6: Verify both disposal actions were audited.
        $this->assertSame(
            2,
            DB::table('audit_log')
                ->where('action_type', 'DISPOSE_BATCH')
                ->count(),
        );
    }

    public function test_dispensing_rejects_expired_stock_even_when_aggregate_stock_is_positive(): void
    {
        $pharmacist = User::factory()->create([
            'role' => 'pharmacist',
        ]);

        $medicine = $this->createMedicine([
            'current_stock' => 5,
        ]);

        $expiredBatch = $this->createBatch(
            $medicine,
            5,
            now()->subDay()->toDateString(),
        );

        $this->actingAs($pharmacist)
            ->from(route('dispensing.index'))
            ->post(route('dispensing.store'), [
                'items' => [[
                    'medicine_id' => $medicine->medicine_id,
                    'quantity' => 1,
                    'dosage' => '500mg',
                ]],
            ])
            ->assertSessionHasErrors('dispense');

        // Aggregate stock must remain unchanged.
        $this->assertDatabaseHas('medicines', [
            'medicine_id' => $medicine->medicine_id,
            'current_stock' => 5,
        ]);

        // Expired batch must remain unchanged.
        $this->assertDatabaseHas('stock_in', [
            'stock_in_id' => $expiredBatch->stock_in_id,
            'remaining_quantity' => 5,
        ]);

        // No dispensing transaction should be created.
        $this->assertDatabaseCount('stock_out', 0);

        // No successful dispensing audit should exist.
        $this->assertDatabaseMissing('audit_log', [
            'action_type' => 'STOCK_OUT',
        ]);
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
