<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ProfileTest extends TestCase
{
    use RefreshDatabase;

    public function test_profile_page_is_displayed(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->get('/profile');

        $response->assertOk();
    }

    public function test_profile_information_can_be_updated(): void
    {
        $user = User::factory()->create();

        $response = $this
            ->actingAs($user)
            ->patch('/profile', [
                'full_name' => 'Test User',
                'email' => 'test@example.com',
            ]);

        $response
            ->assertSessionHasNoErrors()
            ->assertRedirect('/profile');

        $user->refresh();

        $this->assertSame('Test User', $user->full_name);
        $this->assertSame('test@example.com', $user->email);
    }

    public function test_user_can_delete_their_account(): void
    {
        $user = User::factory()->create();

        $response = $this
            ->actingAs($user)
            ->delete('/profile', [
                'password' => 'password',
            ]);

        $response
            ->assertSessionHasNoErrors()
            ->assertRedirect('/');

        $this->assertGuest();
        $this->assertNull($user->fresh());
    }

    public function test_account_with_stock_receiving_history_cannot_be_deleted(): void
    {
        $user = User::factory()->create();
        $medicineId = $this->createMedicine();

        DB::table('stock_in')->insert([
            'medicine_id' => $medicineId,
            'quantity' => 10,
            'batch_no' => 'PROFILE-RECEIVING-001',
            'expiry_date' => now()->addYear()->toDateString(),
            'received_by' => $user->user_id,
            'remaining_quantity' => 10,
        ]);

        $this->actingAs($user)
            ->from('/profile')
            ->delete('/profile', ['password' => 'password'])
            ->assertSessionHasErrors('account')
            ->assertRedirect('/profile');

        $this->assertNotNull($user->fresh());
        $this->assertDatabaseHas('stock_in', [
            'batch_no' => 'PROFILE-RECEIVING-001',
            'received_by' => $user->user_id,
        ]);
    }

    public function test_account_with_stock_dispensing_history_cannot_be_deleted(): void
    {
        $user = User::factory()->create();
        $medicineId = $this->createMedicine();

        $batchId = DB::table('stock_in')->insertGetId([
            'medicine_id' => $medicineId,
            'quantity' => 10,
            'batch_no' => 'PROFILE-DISPENSING-001',
            'expiry_date' => now()->addYear()->toDateString(),
            'remaining_quantity' => 9,
        ], 'stock_in_id');

        DB::table('stock_out')->insert([
            'medicine_id' => $medicineId,
            'quantity' => 1,
            'dosage' => '500mg',
            'patient_name' => 'Test Patient',
            'prescription_no' => 'RX-PROFILE-001',
            'dispensed_by' => $user->user_id,
            'price' => 2.50,
            'stock_in_id' => $batchId,
        ]);

        $this->actingAs($user)
            ->from('/profile')
            ->delete('/profile', ['password' => 'password'])
            ->assertSessionHasErrors('account')
            ->assertRedirect('/profile');

        $this->assertNotNull($user->fresh());
        $this->assertDatabaseHas('stock_out', [
            'prescription_no' => 'RX-PROFILE-001',
            'dispensed_by' => $user->user_id,
        ]);
    }

    public function test_profile_photo_can_be_uploaded_and_replaces_the_previous_photo(): void
    {
        Storage::fake('public');

        $user = User::factory()->create([
            'profile_image' => 'profiles/old-avatar.jpg',
        ]);

        Storage::disk('public')->put('profiles/old-avatar.jpg', 'old image');

        $response = $this
            ->actingAs($user)
            ->patch('/profile', [
                'full_name' => $user->full_name,
                'email' => $user->email,
                'profile_image' => UploadedFile::fake()->image('new-avatar.jpg'),
            ]);

        $response
            ->assertSessionHasNoErrors()
            ->assertRedirect('/profile');

        $user->refresh();

        $this->assertNotSame('profiles/old-avatar.jpg', $user->profile_image);
        $this->assertStringStartsWith('profiles/', $user->profile_image);
        Storage::disk('public')->assertExists($user->profile_image);
        Storage::disk('public')->assertMissing('profiles/old-avatar.jpg');
    }

    public function test_profile_photo_rejects_unsupported_file_types(): void
    {
        Storage::fake('public');

        $user = User::factory()->create();

        $this->actingAs($user)
            ->from('/profile')
            ->patch('/profile', [
                'full_name' => $user->full_name,
                'email' => $user->email,
                'profile_image' => UploadedFile::fake()->create(
                    'not-an-image.pdf',
                    100,
                    'application/pdf',
                ),
            ])
            ->assertSessionHasErrors('profile_image')
            ->assertRedirect('/profile');

        $this->assertNull($user->fresh()->profile_image);
    }

    private function createMedicine(): int
    {
        return DB::table('medicines')->insertGetId([
            'generic_name' => 'Profile Test Medicine',
            'brand_name' => 'Profile Brand',
            'category' => 'Test',
            'dosage' => '500mg',
            'price' => 2.50,
            'current_stock' => 10,
            'created_at' => now(),
            'type' => 'Tablet',
        ], 'medicine_id');
    }

    public function test_correct_password_must_be_provided_to_delete_account(): void
    {
        $user = User::factory()->create();

        $response = $this
            ->actingAs($user)
            ->from('/profile')
            ->delete('/profile', [
                'password' => 'wrong-password',
            ]);

        $response
            ->assertSessionHasErrors('password')
            ->assertRedirect('/profile');

        $this->assertNotNull($user->fresh());
    }
}
