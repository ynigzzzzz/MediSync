<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class DisposeStockBatchesRequest extends FormRequest
{
    public function authorize(): bool
    {
        return in_array($this->user()->role, ['admin', 'pharmacist'], true);
    }

    public function rules(): array
    {
        return [
            'batch_ids' => ['required', 'array', 'min:1'],
            'batch_ids.*' => ['integer', 'exists:stock_in,stock_in_id'],
        ];
    }
}
