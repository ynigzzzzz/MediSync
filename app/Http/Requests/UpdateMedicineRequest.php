<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateMedicineRequest extends FormRequest
{
    public function authorize(): bool
    {
        return in_array($this->user()?->role, ['admin', 'pharmacist'], true);
    }

    public function rules(): array
    {
        $brandName = $this->input('brand_name');
        $dosage = $this->input('dosage');
        $medicineId = $this->route('medicine')->medicine_id;

        return [
            'generic_name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('medicines', 'generic_name')
                    ->ignore($medicineId, 'medicine_id')
                    ->where(fn ($query) => $query
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
            'generic_name.unique' => 'Another medicine with the same generic name, brand, and dosage already exists.',
        ];
    }
}
