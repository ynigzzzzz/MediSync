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
            ->get(['user_id', 'full_name', 'email', 'role', 'status', 'profile_image', 'created_at']);

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
            $user->user_id  // ← Make sure this is the 4th parameter
        );

        return back()->with('success', "User \"{$user->full_name}\" has been added successfully.");
    }

    /**
     * Toggle active/inactive — matches the original's self-protection rule.
     */
    public function toggleStatus(Request $request, User $user)
    {
        abort_unless($request->user()->role === 'admin', 403);

        if ($user->user_id === $request->user()->user_id) {
            return response()->json(['success' => false, 'message' => 'You cannot change your own status.']);
        }

        $newStatus = $user->status === 'active' ? 'inactive' : 'active';
        $user->update(['status' => $newStatus]);

        AuditLog::record(
            $request->user()->user_id,
            'TOGGLE_USER_STATUS',
            "Set user {$user->full_name} status to {$newStatus}"
        );

        return response()->json(['success' => true, 'new_status' => $newStatus]);
    }
}
