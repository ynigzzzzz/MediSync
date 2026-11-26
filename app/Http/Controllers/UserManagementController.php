<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreUserRequest;
use App\Http\Requests\UpdateUserRequest;
use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class UserManagementController extends Controller
{
    public function index(Request $request)
    {
        abort_unless($request->user()->role === 'admin', 403);

        $users = User::query()
            ->filter($request->only('search', 'role', 'status'))
            ->orderBy('full_name')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('UserManagement/Index', [
            'users' => $users,
            'stats' => [
                'activeUsers' => User::where('status', 'active')->count(),
                'inactiveUsers' => User::where('status', 'inactive')->count(),
                'adminCount' => User::where('role', 'admin')->count(),
            ],
            'filters' => [
                'search' => $request->query('search', ''),
                'role' => $request->query('role', 'all'),
                'status' => $request->query('status', 'all'),
            ],
        ]);
    }

    public function store(StoreUserRequest $request)
    {
        $validated = $request->validated();

        if ($request->hasFile('profile_image')) {
            $validated['profile_image'] = $request->file('profile_image')->store('profiles', 'public');
        }

        $user = User::create([
            'full_name' => $validated['full_name'],
            'email' => $validated['email'],
            'password_hash' => Hash::make($validated['password']),
            'role' => $validated['role'],
            'status' => $validated['status'],
            'profile_image' => $validated['profile_image'] ?? null,
            'must_change_password' => true,
        ]);

        AuditLog::record(
            $request->user()->user_id,
            'CREATE_USER',
            "Added new user: {$user->full_name} ({$user->email}) with role {$user->role}",
            $user->user_id,
        );

        return back()->with('success', "User \"{$user->full_name}\" has been added successfully.");
    }

    public function update(UpdateUserRequest $request, User $user)
    {
        $validated = $request->validated();

        if ($request->hasFile('profile_image')) {
            if ($user->profile_image) {
                Storage::disk('public')->delete($user->profile_image);
            }
            $validated['profile_image'] = $request->file('profile_image')->store('profiles', 'public');
        }

        if (! empty($validated['password'])) {
            $validated['password_hash'] = Hash::make($validated['password']);
            $validated['must_change_password'] = true;
        }
        unset($validated['password']);

        // An administrator may edit their profile, but cannot change their
        // own role or status through the user-management update endpoint.
        if ((int) $user->user_id === (int) $request->user()->user_id) {
            $validated['role'] = $user->role;
            $validated['status'] = $user->status;
        }

        $user->update($validated);

        AuditLog::record(
            $request->user()->user_id,
            'UPDATE_USER',
            "Updated user: {$user->full_name} ({$user->email})",
            $user->user_id,
        );

        return back()->with('success', "User \"{$user->full_name}\" has been updated.");
    }

    public function toggleStatus(Request $request, User $user)
    {
        abort_unless($request->user()->role === 'admin', 403);

        if ($user->user_id === $request->user()->user_id) {
            return back()->withErrors(['message' => 'You cannot change your own status.']);
        }

        $newStatus = $user->toggleStatus();

        AuditLog::record(
            $request->user()->user_id,
            'TOGGLE_USER_STATUS',
            "Set user {$user->full_name} status to {$newStatus}",
            $user->user_id,
        );

        return back()->with('success', "User status changed to {$newStatus}.");
    }

    public function destroy(Request $request, User $user)
    {
        abort_unless($request->user()->role === 'admin', 403);

        if ($user->user_id === $request->user()->user_id) {
            return back()->withErrors(['message' => 'You cannot delete your own account.']);
        }

        $deletedUser = DB::transaction(function () use ($user) {
            $lockedUser = User::query()
                ->whereKey($user->getKey())
                ->lockForUpdate()
                ->firstOrFail();

            $hasActivity = DB::table('stock_out')
                ->where('dispensed_by', $lockedUser->user_id)
                ->exists()
                || DB::table('stock_in')
                    ->where('received_by', $lockedUser->user_id)
                    ->exists();

            if ($hasActivity) {
                return null;
            }

            $deleted = [
                'name' => $lockedUser->full_name,
                'id' => $lockedUser->user_id,
            ];

            $lockedUser->delete();

            return $deleted;
        });

        if ($deletedUser === null) {
            return back()->withErrors([
                'message' => "Cannot delete {$user->full_name} — they have transaction history. Deactivate the account instead.",
            ]);
        }

        AuditLog::record(
            $request->user()->user_id,
            'DELETE_USER',
            "Deleted user: {$deletedUser['name']} (ID {$deletedUser['id']})",
        );

        return back()->with('success', 'User deleted successfully.');
    }
}
