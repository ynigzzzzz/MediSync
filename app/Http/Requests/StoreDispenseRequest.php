<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreDispenseRequest extends FormRequest
{
    public function authorize(): bool
    {
        return in_array($this->user()?->role, ['admin', 'pharmacist', 'assistant'], true);
    }

    public function rules(): array
    {
        return [
            'patient_name' => [
                'nullable',
                'string',
                'max:255',
            ],

            'prescription_no' => [
                'nullable',
                'string',
                'max:255',
            ],

            'items' => [
                'required',
                'array',
                'min:1',
            ],

            'items.*' => [
                'required',
                'array:medicine_id,quantity,dosage',
            ],

            'items.*.medicine_id' => [
                'required',
                'integer',
                'exists:medicines,medicine_id',
            ],

            'items.*.quantity' => [
                'required',
                'integer',
                'min:1',
            ],

            'items.*.dosage' => [
                'nullable',
                'string',
                'max:50',
            ],

            'items.*.price' => [
                'prohibited',
            ],
        ];
    }
}
