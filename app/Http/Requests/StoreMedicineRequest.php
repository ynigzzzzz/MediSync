<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreMedicineRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->role !== 'assistant';
    }

    public function rules(): array
    {
        return [
            'generic_name' => ['required', 'string', 'max:255'],
            'brand_name' => ['required', 'string', 'max:255'],
            'type' => ['required', 'string', 'max:255'],
            'category' => ['required', 'string', 'max:255'],
            'dosage' => ['required', 'string', 'max:255'],
            'price' => ['required', 'numeric', 'min:0'],
        ];
    }
}
