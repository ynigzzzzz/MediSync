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
            'supplier_id' => ['nullable', 'integer', Rule::exists('suppliers', 'supplier_id')],
            'supplier' => ['required_without:supplier_id', 'nullable', 'string', 'max:100'],
            'delivery_date' => ['required', 'date', 'before_or_equal:expiry_date'], // <-- ADDED RULE
            'cost_price' => ['required', 'numeric', 'min:0.01'],
            'sell_price' => ['nullable', 'numeric', 'min:0'],
            'dosage' => ['nullable', 'string', 'max:50'],
        ];
    }

    public function messages(): array
    {
        return [
            'supplier.required_without' => 'Please pick a supplier or type one in.',
            'delivery_date.before_or_equal' => 'The delivery date cannot be after the expiry date.',
        ];
    }
}
