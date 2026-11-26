<?php

namespace Tests\Feature;

use App\Models\Medicine;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class FormValidationLimitsTest extends TestCase
{
    use RefreshDatabase;

    public function test_dispensing_patient_and_prescription_fields_match_database_limits(): void
    {
        $user = User::factory()->create(['role' => 'pharmacist']);
        $medicine = Medicine::create([
            'generic_name' => 'Validation Medicine',
            'brand_name' => 'Validation Brand',
            'type' => 'Tablet',
            'category' => 'Test',
            'dosage' => '500mg',
            'price' => 2.50,
        ]);

        $this->actingAs($user)
            ->from('/dispensing')
            ->post(route('dispensing.store'), [
                'patient_name' => str_repeat('P', 101),
                'prescription_no' => str_repeat('R', 51),
                'items' => [[
                    'medicine_id' => $medicine->medicine_id,
                    'quantity' => 1,
                    'dosage' => '500mg',
                ]],
            ])
            ->assertSessionHasErrors(['patient_name', 'prescription_no']);
    }

    public function test_contact_fields_match_database_limits(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->from('/contact')
            ->post(route('contact.store'), [
                'full_name' => str_repeat('N', 101),
                'email' => str_repeat('a', 90).'@example.com',
                'contact_number' => str_repeat('1', 21),
                'inquiry_type' => 'general',
                'subject' => 'Validation test',
                'message' => 'Testing database-aligned validation.',
            ])
            ->assertSessionHasErrors(['full_name', 'email', 'contact_number']);
    }
}
