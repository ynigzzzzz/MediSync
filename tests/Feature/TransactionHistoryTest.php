<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class TransactionHistoryTest extends TestCase
{
    use RefreshDatabase;

    public function test_transaction_history_filters_by_user_id_not_display_name(): void
    {
        $firstUser = User::factory()->create(['full_name' => 'Shared Name']);
        $secondUser = User::factory()->create(['full_name' => 'Shared Name']);
        $medicineId = $this->createMedicine();

        $this->createStockIn($medicineId, $firstUser->user_id, 'BATCH-FIRST');
        $this->createStockIn($medicineId, $secondUser->user_id, 'BATCH-SECOND');

        $response = $this
            ->actingAs($firstUser)
            ->get(route('transaction-history.index', [
                'user' => $firstUser->user_id,
            ]));

        $response->assertOk();

        $response->assertInertia(fn (Assert $page) => $page
            ->component('TransactionHistory/Index')
            ->where('totalFilteredRecords', 1)
            ->has('transactions.data', 1)
            ->where('transactions.data.0.user_id', $firstUser->user_id)
            ->where('transactions.data.0.batch_reference', 'BATCH-FIRST'),
        );
    }

    public function test_print_page_includes_all_filtered_records_without_pagination(): void
    {
        $user = User::factory()->create();
        $medicineId = $this->createMedicine();

        for ($index = 1; $index <= 17; $index++) {
            $this->createStockIn(
                $medicineId,
                $user->user_id,
                'PRINT-BATCH-'.$index,
            );
        }

        $response = $this
            ->actingAs($user)
            ->get(route('transaction-history.print', [
                'type' => 'Stock-In',
            ]));

        $response->assertOk();

        $response->assertInertia(fn (Assert $page) => $page
            ->component('TransactionHistory/Print')
            ->has('transactions', 17),
        );
    }

    public function test_csv_export_streams_filtered_rows_and_protects_formula_cells(): void
    {
        $user = User::factory()->create();
        $medicineId = $this->createMedicine();

        $this->createStockIn(
            $medicineId,
            $user->user_id,
            'CSV-BATCH',
            '=HYPERLINK("https://example.com","Open")',
        );

        $response = $this
            ->actingAs($user)
            ->get(route('transaction-history.export', [
                'type' => 'Stock-In',
            ]));

        $response->assertOk();
        $response->assertHeader('content-type', 'text/csv; charset=UTF-8');

        $csv = $response->streamedContent();

        $this->assertStringContainsString(
            "'=HYPERLINK",
            $csv,
            'Untrusted spreadsheet text should be prefixed to prevent formula execution.',
        );
        $this->assertStringContainsString('CSV-BATCH', $csv);
    }

    public function test_transaction_history_rejects_an_end_date_before_the_start_date(): void
    {
        $user = User::factory()->create();

        $response = $this
            ->actingAs($user)
            ->get(route('transaction-history.index', [
                'date_from' => now()->addDay()->toDateString(),
                'date_to' => now()->toDateString(),
            ]));

        $response->assertSessionHasErrors('date_to');
    }

    public function test_transaction_history_paginates_results_and_preserves_filters(): void
    {
        $user = User::factory()->create();
        $medicineId = $this->createMedicine();

        for ($index = 1; $index <= 16; $index++) {
            $this->createStockIn(
                $medicineId,
                $user->user_id,
                'PAGE-BATCH-'.$index,
            );
        }

        $firstPage = $this
            ->actingAs($user)
            ->get(route('transaction-history.index', [
                'type' => 'Stock-In',
            ]));

        $firstPage->assertInertia(fn (Assert $page) => $page
            ->component('TransactionHistory/Index')
            ->has('transactions.data', 15)
            ->where('transactions.last_page', 2)
            ->where('filters.type', 'Stock-In'),
        );

        $secondPage = $this->get(route('transaction-history.index', [
            'type' => 'Stock-In',
            'page' => 2,
        ]));

        $secondPage->assertInertia(fn (Assert $page) => $page
            ->component('TransactionHistory/Index')
            ->has('transactions.data', 1)
            ->where('transactions.current_page', 2)
            ->where('filters.type', 'Stock-In'),
        );
    }

    public function test_assistant_can_view_transaction_history_but_cannot_print_or_export(): void
    {
        $assistant = User::factory()->create(['role' => 'assistant']);
        $medicineId = $this->createMedicine();

        $this->createStockIn($medicineId, $assistant->user_id, 'ASSISTANT-VIEW-BATCH');

        $this->actingAs($assistant)
            ->get(route('transaction-history.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('TransactionHistory/Index')
                ->where('canPrint', false)
                ->where('canExport', false)
                ->has('transactions.data', 1),
            );

        $this->get(route('transaction-history.print'))->assertForbidden();
        $this->get(route('transaction-history.export'))->assertForbidden();
    }

    public function test_admin_can_print_and_export_transaction_history(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $medicineId = $this->createMedicine();

        $this->createStockIn($medicineId, $admin->user_id, 'ADMIN-ACCESS-BATCH');

        $this->actingAs($admin)
            ->get(route('transaction-history.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('canPrint', true)
                ->where('canExport', true),
            );

        $this->get(route('transaction-history.print'))->assertOk();
        $this->get(route('transaction-history.export'))->assertOk();
    }

    public function test_transaction_history_routes_require_authentication(): void
    {
        $this->get(route('transaction-history.index'))->assertRedirect(route('login'));
        $this->get(route('transaction-history.print'))->assertRedirect(route('login'));
        $this->get(route('transaction-history.export'))->assertRedirect(route('login'));
    }

    private function createMedicine(): int
    {
        return DB::table('medicines')->insertGetId([
            'generic_name' => 'Test Medicine',
            'brand_name' => 'Test Brand',
            'category' => 'Test',
            'dosage' => '10mg',
            'price' => 25.00,
            'current_stock' => 100,
            'created_at' => now(),
            'type' => 'Tablet',
        ], 'medicine_id');
    }

    private function createStockIn(
        int $medicineId,
        int $userId,
        string $batchNo,
        ?string $supplier = 'Test Supplier',
    ): void {
        DB::table('stock_in')->insert([
            'medicine_id' => $medicineId,
            'quantity' => 10,
            'batch_no' => $batchNo,
            'expiry_date' => now()->addYear()->toDateString(),
            'supplier' => $supplier,
            'supplier_id' => null,
            'received_by' => $userId,
            'delivery_date' => now()->toDateString(),
            'invoice_no' => 'INV-'.$batchNo,
            'recorded_at' => now(),
            'cost_price' => 10.00,
            'selling_price' => 25.00,
            'remaining_quantity' => 10,
            'disposed_quantity' => 0,
            'disposed_at' => null,
            'disposed_by' => null,
        ]);
    }
}
