<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class UserManagementController extends Controller
{
    public function index(Request $request)
    {
        abort_unless($request->user()->role === 'admin', 403);

        $search = trim((string) $request->query('search', ''));
        $filterRole = $request->query('role', '');

        $users = User::query()
            ->when($search !== '', function ($q) use ($search) {
                $q->where(function ($sub) use ($search) {
                    $sub->where('full_name', 'ILIKE', "%{$search}%")
                        ->orWhere('email', 'ILIKE', "%{$search}%");
                });
            })
            ->when($filterRole !== '' && $filterRole !== 'all', fn ($q) => $q->where('role', $filterRole))
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
            'filters' => ['search' => $search, 'role' => $filterRole ?: 'all'],
        ]);
    }

    public function store(Request $request)
    {
        abort_unless($request->user()->role === 'admin', 403);

        $validated = $request->validate([
            'full_name' => ['required', 'string', 'max:100'],
            'email' => ['required', 'email', 'max:100', 'unique:users,email'],
            'password' => ['required', 'string', 'min:6'],
            'role' => ['required', Rule::in(['admin', 'pharmacist', 'assistant'])],
            'status' => ['required', Rule::in(['active', 'inactive'])],
            'profile_image' => ['nullable', 'image', 'max:2048'],
        ]);

        $profileImagePath = null;
        if ($request->hasFile('profile_image')) {
            $profileImagePath = $request->file('profile_image')->store('profiles', 'public');
        }

        $user = User::create([
            'full_name' => $validated['full_name'],
            'email' => $validated['email'],
            'password_hash' => Hash::make($validated['password']),
            'role' => $validated['role'],
            'status' => $validated['status'],
            'profile_image' => $profileImagePath,
        ]);

        AuditLog::record(
            $request->user()->user_id,
            'CREATE_USER',
            "Added new user: {$user->full_name} ({$user->email}) with role {$user->role}",
            $user->user_id
        );

        return back()->with('success', "User \"{$user->full_name}\" has been added successfully.");
    }

    public function update(Request $request, User $user)
    {
        abort_unless($request->user()->role === 'admin', 403);

        $validated = $request->validate([
            'full_name' => ['required', 'string', 'max:100'],
            'email' => ['required', 'email', 'max:100', Rule::unique('users', 'email')->ignore($user->user_id, 'user_id')],
            'password' => ['nullable', 'string', 'min:6'],
            'role' => ['required', Rule::in(['admin', 'pharmacist', 'assistant'])],
            'status' => ['required', Rule::in(['active', 'inactive'])],
            'profile_image' => ['nullable', 'image', 'max:2048'],
        ]);

        if ($request->hasFile('profile_image')) {
            if ($user->profile_image) {
                Storage::disk('public')->delete($user->profile_image);
            }
            $validated['profile_image'] = $request->file('profile_image')->store('profiles', 'public');
        }

        if (!empty($validated['password'])) {
            $validated['password_hash'] = Hash::make($validated['password']);
        }
        unset($validated['password']);

        $user->update($validated);

        AuditLog::record(
            $request->user()->user_id,
            'UPDATE_USER',
            "Updated user: {$user->full_name} ({$user->email})",
            $user->user_id
        );

        return back()->with('success', "User \"{$user->full_name}\" has been updated.");
    }

    public function toggleStatus(Request $request, User $user)
    {
        abort_unless($request->user()->role === 'admin', 403);

        if ($user->user_id === $request->user()->user_id) {
            return back()->withErrors(['message' => 'You cannot change your own status.']);
        }

        $newStatus = $user->status === 'active' ? 'inactive' : 'active';
        $user->update(['status' => $newStatus]);

        AuditLog::record(
            $request->user()->user_id,
            'TOGGLE_USER_STATUS',
            "Set user {$user->full_name} status to {$newStatus}",
            $user->user_id
        );

        return back()->with('success', "User status changed to {$newStatus}.");
    }

    public function destroy(Request $request, User $user)
    {
        abort_unless($request->user()->role === 'admin', 403);
        
        if ($user->user_id === $request->user()->user_id) {
            return back()->withErrors(['message' => 'You cannot delete your own account.']);
        }

        $name = $user->full_name;
        $id = $user->user_id;
        $user->delete();

        AuditLog::record(
            $request->user()->user_id,
            'DELETE_USER',
            "Deleted user: {$name} (ID {$id})"
        );

        return back()->with('success', 'User deleted successfully.');
    }
}