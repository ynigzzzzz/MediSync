<?php

namespace App\Services;

use App\Models\StockOut;
use Symfony\Component\HttpFoundation\StreamedResponse;

class TransactionHistoryCsvExporter
{
    public function download(array $filters): StreamedResponse
    {
        $filename = 'transaction_history_'.now()->format('Y-m-d').'.csv';

        return response()->streamDownload(function () use ($filters): void {
            $output = fopen('php://output', 'w');

            if ($output === false) {
                return;
            }

            // UTF-8 BOM helps spreadsheet applications recognize Filipino text.
            fwrite($output, "\xEF\xBB\xBF");

            fputcsv($output, [
                'Date & Time',
                'Type',
                'Medicine (Generic)',
                'Brand Name',
                'Dosage',
                'Quantity',
                'Selling Price',
                'Batch #',
                'Expiry Date',
                'Supplier',
                'Invoice No',
                'Patient Name',
                'Prescription No',
                'User',
            ], ',', '"', '');

            $rows = StockOut::getTransactionHistory($filters)
                ->orderByDesc('date_time')
                ->orderByDesc('record_id')
                ->cursor();

            foreach ($rows as $row) {
                fputcsv($output, [
                    $this->safeCell($row->date_time),
                    $this->safeCell($row->transaction_type),
                    $this->safeCell($row->generic_name),
                    $this->safeCell($row->brand_name),
                    $this->safeCell($row->dosage),
                    $row->quantity,
                    $row->selling_price,
                    $this->safeCell($row->batch_reference),
                    $this->safeCell($row->expiry_date),
                    $this->safeCell($row->supplier),
                    $this->safeCell($row->invoice_no),
                    $this->safeCell($row->patient_name),
                    $this->safeCell($row->prescription_no),
                    $this->safeCell($row->user_name ?? 'System'),
                ], ',', '"', '');
            }

            fclose($output);
        }, $filename, [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Cache-Control' => 'no-store, no-cache',
        ]);
    }

    /**
     * Prevent spreadsheet formula execution for untrusted text cells.
     */
    private function safeCell(mixed $value): mixed
    {
        if (! is_string($value) || $value === '') {
            return $value;
        }

        if (preg_match('/^[\x00-\x20]*[=+\-@]/u', $value) === 1) {
            return "'".$value;
        }

        return $value;
    }
}
