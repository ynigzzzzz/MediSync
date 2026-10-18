<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>MediSync Report — {{ ucfirst($tab) }} — {{ $from }} to {{ $to }}</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #2C3E50; font-size: 12px; margin: 24px; }
        h1 { font-size: 20px; color: #764248; margin-bottom: 4px; }
        h2 { font-size: 14px; color: #2C3E50; margin-top: 24px; margin-bottom: 8px; }
        .meta { color: #666; margin-bottom: 16px; }
        .brand { display: flex; align-items: center; gap: 10px; margin-bottom: 16px; }
        .brand-badge { width: 36px; height: 36px; border-radius: 10px; background: linear-gradient(135deg, #FFB7CE 0%, #764248 100%); display: flex; align-items: center; justify-content: center; color: #fff; font-weight: bold; }
        table { width: 100%; border-collapse: collapse; margin-top: 8px; }
        th, td { border-bottom: 1px solid #DFE2CF; padding: 6px 8px; text-align: left; }
        th { background: #fdf2f6; font-weight: 600; color: #764248; }
        .print-btn { display: inline-block; margin-bottom: 16px; padding: 6px 12px; background: #FFB7CE; color: #2C3E50; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; }
        @media print { .print-btn { display: none; } }
    </style>
</head>
<body>
    <button class="print-btn" onclick="window.print()">Print / Save as PDF</button>

    <div class="brand">
        <div class="brand-badge">M</div>
        <div>
            <h1>MediSync — {{ ucfirst($tab) }} Report</h1>
            <p class="meta">Period: {{ $from }} → {{ $to }} · Generated {{ now()->format('M j, Y g:i A') }}</p>
        </div>
    </div>

    @if ($tab === 'inventory')
        <h2>Current Inventory Snapshot</h2>
        <table>
            <thead>
                <tr>
                    <th>Generic</th><th>Brand</th><th>Dosage</th><th>Stock</th><th>Price</th><th>Stock Value</th><th>Status</th>
                </tr>
            </thead>
            <tbody>
                @foreach ($medicines as $m)
                    @php
                        $status = $m->current_stock == 0 ? 'Out of Stock' : ($m->current_stock < 50 ? 'Low Stock' : 'OK');
                    @endphp
                    <tr>
                        <td>{{ $m->generic_name }}</td>
                        <td>{{ $m->brand_name }}</td>
                        <td>{{ $m->dosage }}</td>
                        <td>{{ $m->current_stock }}</td>
                        <td>₱{{ number_format($m->price, 2) }}</td>
                        <td>₱{{ number_format($m->current_stock * $m->price, 2) }}</td>
                        <td>{{ $status }}</td>
                    </tr>
                @endforeach
            </tbody>
        </table>
    @elseif ($tab === 'receiving')
        <h2>Received per Supplier</h2>
        <table>
            <thead><tr><th>Supplier</th><th>Batches</th><th>Units</th><th>Cost</th></tr></thead>
            <tbody>
                @foreach ($receivingRows as $r)
                    <tr>
                        <td>{{ $r->supplier ?? '—' }}</td>
                        <td>{{ $r->batches }}</td>
                        <td>{{ $r->units }}</td>
                        <td>₱{{ number_format($r->cost, 2) }}</td>
                    </tr>
                @endforeach
            </tbody>
        </table>
    @elseif ($tab === 'dispensing')
        <h2>Dispensed by Medicine</h2>
        <table>
            <thead><tr><th>Medicine</th><th>Brand</th><th>Units</th></tr></thead>
            <tbody>
                @foreach ($dispensingRows as $r)
                    <tr>
                        <td>{{ $r->generic_name }}</td>
                        <td>{{ $r->brand_name }}</td>
                        <td>{{ $r->units }}</td>
                    </tr>
                @endforeach
            </tbody>
        </table>
    @elseif ($tab === 'suppliers')
        <h2>Suppliers</h2>
        <table>
            <thead><tr><th>Name</th><th>Contact</th><th>Phone</th><th>Email</th><th>Status</th></tr></thead>
            <tbody>
                @foreach ($suppliers as $s)
                    <tr>
                        <td>{{ $s->name }}</td>
                        <td>{{ $s->contact_person ?? '—' }}</td>
                        <td>{{ $s->phone ?? '—' }}</td>
                        <td>{{ $s->email ?? '—' }}</td>
                        <td>{{ ucfirst($s->status) }}</td>
                    </tr>
                @endforeach
            </tbody>
        </table>
    @endif
</body>
</html>