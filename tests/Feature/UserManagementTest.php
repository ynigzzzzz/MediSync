<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UserManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_edit_own_profile_without_changing_own_role_or_status(): void
    {
        $admin = User::factory()->create([
            'role' => 'admin',
            'status' => 'active',
        ]);

        $this->actingAs($admin)
            ->put(route('user-management.update', $admin), [
                'full_name' => 'Updated Administrator',
                'email' => 'updated-admin@example.com',
                'password' => '',
                'role' => 'assistant',
                'status' => 'inactive',
            ])
            ->assertSessionHasNoErrors();

        $admin->refresh();

        $this->assertSame('Updated Administrator', $admin->full_name);
        $this->assertSame('updated-admin@example.com', $admin->email);
        $this->assertSame('admin', $admin->role);
        $this->assertSame('active', $admin->status);
    }
}
