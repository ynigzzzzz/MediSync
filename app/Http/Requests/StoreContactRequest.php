<?php

namespace App\Http\Requests;

use App\Http\Controllers\ContactController;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreContactRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'full_name' => ['required', 'string', 'max:150'],
            'email' => ['required', 'email', 'max:150'],
            'contact_number' => ['nullable', 'regex:/^[0-9+\-() ]*$/', 'max:30'],
            'inquiry_type' => ['required', Rule::in(array_keys(ContactController::INQUIRY_TYPES))],
            'subject' => ['required', 'string', 'max:200'],
            'message' => ['required', 'string'],
            'attachment' => ['nullable', 'file', 'max:5120'],
        ];
    }
}
