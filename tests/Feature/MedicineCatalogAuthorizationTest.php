<?php

namespace Tests\Feature;

use App\Models\Medicine;
use App\Models\StockIn;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class MedicineCatalogAuthorizationTest extends TestCase
{
    use RefreshDatabase;

    public function test_assistant_cannot_create_a_medicine(): void
    {
        $assistant = User::factory()->create(['role' => 'assistant']);

        $response = $this->actingAs($assistant)->post(
            route('medicine-list.store'),
            $this->medicinePayload(),
        );

        $response->assertForbidden();

        $this->assertDatabaseMissing('medicines', [
            'generic_name' => 'Paracetamol',
        ]);
    }

    public function test_assistant_cannot_update_a_medicine(): void
    {
        $assistant = User::factory()->create(['role' => 'assistant']);
        $medicine = $this->createMedicine();

        $response = $this->actingAs($assistant)->patch(
            route('medicine-list.update', $medicine),
            $this->medicinePayload([
                'generic_name' => 'Updated Paracetamol',
            ]),
        );

        $response->assertForbidden();

        $this->assertDatabaseHas('medicines', [
            'medicine_id' => $medicine->medicine_id,
            'generic_name' => 'Paracetamol',
        ]);
    }

    public function test_pharmacist_can_create_and_update_a_medicine(): void
    {
        $pharmacist = User::factory()->create(['role' => 'pharmacist']);

        $this->actingAs($pharmacist)
            ->post(
                route('medicine-list.store'),
                $this->medicinePayload(),
            )
            ->assertSessionHasNoErrors();

        $medicine = Medicine::query()
            ->where('generic_name', 'Paracetamol')
            ->firstOrFail();

        $this->patch(
            route('medicine-list.update', $medicine),
            $this->medicinePayload([
                'generic_name' => 'Paracetamol 500',
            ]),
        )->assertSessionHasNoErrors();

        $this->assertDatabaseHas('medicines', [
            'medicine_id' => $medicine->medicine_id,
            'generic_name' => 'Paracetamol 500',
        ]);
    }

    public function test_pharmacist_cannot_delete_a_medicine(): void
    {
        $pharmacist = User::factory()->create(['role' => 'pharmacist']);
        $medicine = $this->createMedicine();

        $response = $this->actingAs($pharmacist)->delete(
            route('medicine-list.destroy', $medicine),
            ['reason' => 'Duplicate catalog entry'],
        );

        $response->assertForbidden();

        $this->assertDatabaseHas('medicines', [
            'medicine_id' => $medicine->medicine_id,
            'deleted_at' => null,
        ]);
    }

    public function test_admin_must_provide_a_valid_reason_to_delete_a_medicine(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $medicine = $this->createMedicine();

        $response = $this->actingAs($admin)
            ->from('/medicine-list')
            ->delete(
                route('medicine-list.destroy', $medicine),
                ['reason' => 'no'],
            );

        $response->assertSessionHasErrors('reason');

        $this->assertDatabaseHas('medicines', [
            'medicine_id' => $medicine->medicine_id,
            'deleted_at' => null,
        ]);
    }

    public function test_admin_can_delete_a_medicine_and_the_reason_is_audited(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $medicine = $this->createMedicine();
        $medicineId = $medicine->medicine_id;

        $response = $this->actingAs($admin)
            ->from('/medicine-list')
            ->delete(
                route('medicine-list.destroy', $medicine),
                ['reason' => 'Duplicate medicine record'],
            );

        $response->assertSessionHasNoErrors();

        $this->assertSoftDeleted('medicines', [
            'medicine_id' => $medicineId,
        ]);

        $this->assertDatabaseHas('audit_log', [
            'user_id' => $admin->user_id,
            'action_type' => 'DELETE_MEDICINE',
            'reference_id' => $medicineId,
            'reason' => 'Duplicate medicine record',
        ]);
    }

    public function test_admin_can_delete_medicine_with_historical_stock_records(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $medicine = $this->createMedicine();
        $medicineId = $medicine->medicine_id;

        // Historical batch with no remaining stock.
        DB::table('stock_in')->insert([
            'medicine_id' => $medicineId,
            'quantity' => 10,
            'batch_no' => 'TEST-BATCH-001',
            'expiry_date' => now()->addYear()->toDateString(),
            'remaining_quantity' => 0,
        ]);

        $response = $this->actingAs($admin)
            ->from('/medicine-list')
            ->delete(
                route('medicine-list.destroy', $medicine),
                ['reason' => 'Duplicate historical medicine record'],
            );

        $response->assertSessionHasNoErrors();

        $this->assertSoftDeleted('medicines', [
            'medicine_id' => $medicineId,
        ]);

        // Historical stock-in record must remain.
        $this->assertDatabaseHas('stock_in', [
            'medicine_id' => $medicineId,
            'batch_no' => 'TEST-BATCH-001',
        ]);

        // Historical relationship must still resolve.
        $batch = StockIn::query()
            ->where('batch_no', 'TEST-BATCH-001')
            ->firstOrFail();

        $this->assertNotNull($batch->medicine);

        $this->assertSame(
            $medicineId,
            $batch->medicine->medicine_id,
        );
    }

    public function test_admin_cannot_delete_a_medicine_with_remaining_stock(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $medicine = $this->createMedicine();

        DB::table('stock_in')->insert([
            'medicine_id' => $medicine->medicine_id,
            'quantity' => 10,
            'batch_no' => 'ACTIVE-BATCH-001',
            'expiry_date' => now()->addYear()->toDateString(),
            'remaining_quantity' => 10,
        ]);

        $response = $this->actingAs($admin)
            ->from('/medicine-list')
            ->delete(
                route('medicine-list.destroy', $medicine),
                ['reason' => 'Attempted deletion with remaining stock'],
            );

        $response->assertSessionHasErrors('delete');

        $this->assertDatabaseHas('medicines', [
            'medicine_id' => $medicine->medicine_id,
            'deleted_at' => null,
        ]);
    }

    public function test_assistant_cannot_dispose_stock_batches(): void
    {
        $assistant = User::factory()->create(['role' => 'assistant']);

        $response = $this->actingAs($assistant)->post(
            '/medicine-list/dispose',
            ['batch_ids' => [999999]],
        );

        $response->assertForbidden();
    }

    public function test_expiring_and_expired_batch_views_apply_medicine_filters(): void
    {
        $user = User::factory()->create(['role' => 'pharmacist']);
        $expiringMedicine = $this->createMedicine([
            'generic_name' => 'Paracetamol',
            'category' => 'Fever',
            'type' => 'Tablet',
        ]);
        $expiredMedicine = $this->createMedicine([
            'generic_name' => 'Ibuprofen',
            'category' => 'Pain',
            'type' => 'Capsule',
        ]);

        StockIn::create([
            'medicine_id' => $expiringMedicine->medicine_id,
            'quantity' => 10,
            'batch_no' => 'EXPIRING-PARA-001',
            'expiry_date' => now()->addDays(10)->toDateString(),
            'remaining_quantity' => 10,
        ]);

        StockIn::create([
            'medicine_id' => $expiredMedicine->medicine_id,
            'quantity' => 8,
            'batch_no' => 'EXPIRED-IBU-001',
            'expiry_date' => now()->subDays(10)->toDateString(),
            'remaining_quantity' => 8,
        ]);

        $this->actingAs($user)
            ->get(route('medicine-list.index', [
                'filter' => 'expiring',
                'search' => 'para',
                'category' => 'Fever',
                'type' => 'Tablet',
            ]))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('MedicineCatalog/Index')
                ->has('batches.data', 1)
                ->where('batches.data.0.medicine.generic_name', 'Paracetamol'),
            );

        $this->get(route('medicine-list.index', [
            'filter' => 'expired',
            'search' => 'ibu',
            'category' => 'Pain',
            'type' => 'Capsule',
        ]))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('MedicineCatalog/Index')
                ->has('batches.data', 1)
                ->where('batches.data.0.medicine.generic_name', 'Ibuprofen'),
            );
    }

    public function test_admin_can_restore_deleted_medicine_and_preserve_history(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $medicine = $this->createMedicine();
        $medicineId = $medicine->medicine_id;

        DB::table('stock_in')->insert([
            'medicine_id' => $medicineId,
            'quantity' => 10,
            'batch_no' => 'RESTORE-TEST-001',
            'expiry_date' => now()->addYear()->toDateString(),
            'remaining_quantity' => 0,
        ]);

        $this->actingAs($admin)
            ->from('/medicine-list')
            ->delete(
                route('medicine-list.destroy', $medicine),
                ['reason' => 'Restoration regression test'],
            )
            ->assertSessionHasNoErrors();

        $this->assertSoftDeleted('medicines', [
            'medicine_id' => $medicineId,
        ]);

        $this->post(
            route('reports.medicines.restore', $medicineId),
        )->assertSessionHasNoErrors();

        $this->assertDatabaseHas('medicines', [
            'medicine_id' => $medicineId,
            'generic_name' => 'Paracetamol',
            'deleted_at' => null,
        ]);

        $this->assertDatabaseHas('stock_in', [
            'medicine_id' => $medicineId,
            'batch_no' => 'RESTORE-TEST-001',
        ]);

        $this->assertDatabaseHas('audit_log', [
            'user_id' => $admin->user_id,
            'action_type' => 'RESTORE_MEDICINE',
            'reference_id' => $medicineId,
        ]);

        $this->assertSame(
            $medicineId,
            Medicine::findOrFail($medicineId)->medicine_id,
        );
    }

    public function test_pharmacist_and_assistant_cannot_restore_medicines(): void
    {
        $medicine = $this->createMedicine();
        $medicineId = $medicine->medicine_id;

        $medicine->delete();

        foreach (['pharmacist', 'assistant'] as $role) {
            $user = User::factory()->create(['role' => $role]);

            $this->actingAs($user)
                ->post(route('reports.medicines.restore', $medicineId))
                ->assertForbidden();
        }

        $this->assertSoftDeleted('medicines', [
            'medicine_id' => $medicineId,
        ]);

        $this->assertDatabaseMissing('audit_log', [
            'action_type' => 'RESTORE_MEDICINE',
            'reference_id' => $medicineId,
        ]);
    }

    public function test_admin_cannot_restore_an_already_active_medicine(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $medicine = $this->createMedicine();

        $this->actingAs($admin)
            ->post(
                route('reports.medicines.restore', $medicine->medicine_id),
            )
            ->assertNotFound();

        $this->assertDatabaseHas('medicines', [
            'medicine_id' => $medicine->medicine_id,
            'deleted_at' => null,
        ]);

        $this->assertDatabaseMissing('audit_log', [
            'action_type' => 'RESTORE_MEDICINE',
            'reference_id' => $medicine->medicine_id,
        ]);
    }

    private function createMedicine(array $overrides = []): Medicine
    {
        return Medicine::create($this->medicinePayload($overrides));
    }

    private function medicinePayload(array $overrides = []): array
    {
        return array_merge([
            'generic_name' => 'Paracetamol',
            'brand_name' => 'Biogesic',
            'type' => 'Tablet',
            'category' => 'Fever',
            'dosage' => '500mg',
            'price' => 2.50,
        ], $overrides);
    }
}
