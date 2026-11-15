<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\PasswordUpdateRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Hash;

class PasswordController extends Controller
{
    public function update(PasswordUpdateRequest $request): RedirectResponse
    {
        $request->user()->update([
            'password_hash' => Hash::make($request->validated('password')),
            'must_change_password' => false,
        ]);

        return back()->with('status', 'password-updated');
    }
}
