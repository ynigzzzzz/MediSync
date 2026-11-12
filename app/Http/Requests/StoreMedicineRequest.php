<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreMedicineRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->role !== 'assistant';
    }

    public function rules(): array
    {
        $brandName = $this->input('brand_name');
        $dosage = $this->input('dosage');

        return [
            'generic_name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('medicines', 'generic_name')->where(
                    fn ($query) => $query
                        ->where('brand_name', $brandName)
                        ->where('dosage', $dosage),
                ),
            ],
            'brand_name' => ['required', 'string', 'max:255'],
            'type' => ['required', 'string', 'max:255'],
            'category' => ['required', 'string', 'max:255'],
            'dosage' => ['required', 'string', 'max:255'],
            'price' => ['required', 'numeric', 'min:0'],
        ];
    }

    public function messages(): array
    {
        return [
            'generic_name.unique' => 'This medicine already exists. To add more stock, please go to Stock Receiving.',
        ];
    }
}
