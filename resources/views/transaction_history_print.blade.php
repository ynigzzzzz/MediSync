<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Transaction History Print</title>
    <style>
        body { font-family: sans-serif; font-size: 12px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        @media print {
            @page { margin: 1cm; }
            body { -webkit-print-color-adjust: exact; }
        }
    </style>
</head>
<body onload="window.print()">
    <h2>Transaction History</h2>
    <p>Filtered results: {{ $rows->count() }}</p>
    <table>
        <thead>
            <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Medicine</th>
                <th>Qty</th>
                <th>Price</th>
                <th>Party</th>
                <th>User</th>
            </tr>
        </thead>
        <tbody>
            @foreach($rows as $row)
            <tr>
                <td>{{ \Carbon\Carbon::parse($row->date_time)->format('M d, Y h:i A') }}</td>
                <td>{{ $row->transaction_type }}</td>
                <td>{{ $row->generic_name }} {{ $row->brand_name ? "($row->brand_name)" : '' }}</td>
                <td>{{ $row->quantity }}</td>
                <td>₱{{ $row->selling_price }}</td>
                <td>{{ $row->transaction_type === 'Stock-In' ? ($row->supplier ?? '—') : ($row->patient_name ?? 'Walk-in') }}</td>
                <td>{{ $row->user_name ?? 'System' }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>
</body>
</html>