<?php

namespace App\Http\Controllers;

use App\Http\Requests\ProfileUpdateRequest;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    public function edit(Request $request): Response
    {
        return Inertia::render('Profile/Edit', [
            'status' => session('status'),
        ]);
    }

    public function update(ProfileUpdateRequest $request): RedirectResponse
    {
        $user = $request->user();
        $validated = $request->validated();
        $oldImagePath = $user->profile_image;
        $newImagePath = null;

        if ($request->hasFile('profile_image')) {
            $newImagePath = $request->file('profile_image')->store('profiles', 'public');
            $validated['profile_image'] = $newImagePath;
        }

        $user->fill($validated);
        $user->save();

        // Delete the previous file only after the new image and user record
        // have been saved successfully.
        if ($newImagePath && $oldImagePath && $oldImagePath !== $newImagePath) {
            Storage::disk('public')->delete($oldImagePath);
        }

        return Redirect::route('profile.edit')
            ->with('success', 'Profile updated successfully.');
    }

    public function destroy(Request $request): RedirectResponse
    {
        $request->validate([
            'password' => ['required', 'current_password'],
        ]);

        $user = $request->user();

        $deleted = DB::transaction(function () use ($user) {
            $lockedUser = User::query()
                ->whereKey($user->getKey())
                ->lockForUpdate()
                ->firstOrFail();

            $hasTransactionHistory = DB::table('stock_out')
                ->where('dispensed_by', $lockedUser->user_id)
                ->exists()
                || DB::table('stock_in')
                    ->where('received_by', $lockedUser->user_id)
                    ->exists();

            if ($hasTransactionHistory) {
                return false;
            }

            $lockedUser->delete();

            return true;
        });

        if (! $deleted) {
            return back()->withErrors([
                'account' => 'This account has stock receiving or dispensing history and cannot be deleted. Ask an administrator to deactivate the account instead.',
            ]);
        }

        Auth::logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return Redirect::to('/');
    }
}
