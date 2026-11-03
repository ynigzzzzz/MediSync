<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreDispenseRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // All authenticated users can dispense
    }

    public function rules(): array
    {
        return [
            'patient_name' => ['nullable', 'string', 'max:255'],
            'prescription_no' => ['nullable', 'string', 'max:255'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.medicine_id' => ['required', 'integer', 'exists:medicines,medicine_id'],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
            'items.*.price' => ['nullable', 'numeric', 'min:0'],
            'items.*.dosage' => ['nullable', 'string', 'max:50'],
        ];
    }
}
