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
            'full_name' => ['required', 'string', 'max:100'],
            'email' => ['required', 'email', 'max:100'],
            'contact_number' => ['nullable', 'regex:/^[0-9+\-() ]*$/', 'max:20'],
            'inquiry_type' => ['required', Rule::in(array_keys(ContactController::INQUIRY_TYPES))],
            'subject' => ['required', 'string', 'max:200'],
            'message' => ['required', 'string'],
            'attachment' => [
                'nullable',
                'file',
                'mimes:pdf,jpg,jpeg,png,gif,webp,doc,docx,txt,csv',
                'max:5120',
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'attachment.mimes' => 'Attachment must be one of: PDF, JPG, JPEG, PNG, GIF, WEBP, DOC, DOCX, TXT, CSV.',
            'attachment.max' => 'Attachment may not be larger than 5 MB.',
        ];
    }
}
