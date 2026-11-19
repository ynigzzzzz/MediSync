<?php

namespace App\Http\Requests;

use App\Models\User;
use Closure;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class TransactionHistoryFilterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'search' => ['nullable', 'string', 'max:100'],
            'type' => ['nullable', Rule::in(['all', 'Stock-In', 'Stock-Out'])],
            'date_from' => ['nullable', 'date_format:Y-m-d'],
            'date_to' => [
                'nullable',
                'date_format:Y-m-d',
                function (string $attribute, mixed $value, Closure $fail): void {
                    $dateFrom = $this->input('date_from');

                    if ($value && $dateFrom && $value < $dateFrom) {
                        $fail('The end date must be on or after the start date.');
                    }
                },
            ],
            'user' => [
                'nullable',
                function (string $attribute, mixed $value, Closure $fail): void {
                    if ($value === null || $value === '' || $value === 'all') {
                        return;
                    }

                    if (
                        ! ctype_digit((string) $value)
                        || ! User::whereKey((int) $value)->exists()
                    ) {
                        $fail('Please select a valid user.');
                    }
                },
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'search.max' => 'The search term may not exceed 100 characters.',
            'type.in' => 'Please select a valid transaction type.',
            'date_from.date_format' => 'The start date must use the YYYY-MM-DD format.',
            'date_to.date_format' => 'The end date must use the YYYY-MM-DD format.',
        ];
    }
}
