<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class StoreUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->role === 'admin';
    }

    public function rules(): array
    {
        return [
            'full_name' => ['required', 'string', 'max:100'],
            'email' => ['required', 'email', 'max:100', 'unique:users,email'],
            'password' => ['required', 'string', Password::defaults()],
            'role' => ['required', Rule::in(['admin', 'pharmacist', 'assistant'])],
            'status' => ['required', Rule::in(['active', 'inactive'])],
            'profile_image' => ['nullable', 'image', 'max:2048'],
        ];
    }
}
