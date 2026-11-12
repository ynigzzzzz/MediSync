<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreStockInRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->role !== 'assistant';
    }

    public function rules(): array
    {
        return [
            'medicine_id' => ['required', 'integer', 'exists:medicines,medicine_id'],
            'quantity' => ['required', 'integer', 'min:1'],
            'batch_no' => ['required', 'string', 'max:50'],
            'expiry_date' => ['required', 'date', 'after:today'],
            'supplier_id' => [
                'required',
                'integer',
                Rule::exists('suppliers', 'supplier_id')->where('status', 'active'),
            ],
            'delivery_date' => ['required', 'date', 'before_or_equal:expiry_date'],
            'cost_price' => ['required', 'numeric', 'min:0.01'],
            'sell_price' => ['nullable', 'numeric', 'min:0'],
            'dosage' => ['nullable', 'string', 'max:50'],
        ];
    }

    public function messages(): array
    {
        return [
            'supplier_id.required' => 'Please select a supplier from the Suppliers module.',
            'supplier_id.exists' => 'The selected supplier is not active or does not exist.',
            'delivery_date.before_or_equal' => 'The delivery date cannot be after the expiry date.',
        ];
    }
}
