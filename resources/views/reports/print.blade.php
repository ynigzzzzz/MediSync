<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">

    <title>MediSync Report — {{ ucfirst($tab) }} — {{ $from }} to {{ $to }}</title>

    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            color: #2C3E50;
            font-size: 12px;
            margin: 24px;
        }

        h1 {
            font-size: 20px;
            color: #764248;
            margin-bottom: 4px;
        }

        h2 {
            font-size: 14px;
            color: #2C3E50;
            margin-top: 24px;
            margin-bottom: 8px;
        }

        .meta {
            color: #666;
            margin-bottom: 16px;
        }

        .brand {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 16px;
        }

        .brand-badge {
            width: 36px;
            height: 36px;
            border-radius: 10px;
            background: linear-gradient(135deg, #FFB7CE 0%, #764248 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            color: #fff;
            font-weight: bold;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 8px;
        }

        th, td {
            border-bottom: 1px solid #DFE2CF;
            padding: 6px 8px;
            text-align: left;
        }

        th {
            background: #fdf2f6;
            font-weight: 600;
            color: #764248;
        }

        .print-btn {
            display: inline-block;
            margin-bottom: 16px;
            padding: 6px 12px;
            background: #FFB7CE;
            color: #2C3E50;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 600;
        }

        .empty {
            text-align: center;
            color: #888;
            padding: 15px;
        }

        @media print {
            .print-btn {
                display: none;
            }

            body {
                margin: 10px;
            }
        }
    </style>
</head>

<body>
    <button class="print-btn" onclick="window.print()">
        Print / Save as PDF
    </button>

    <div class="brand">
        <div class="brand-badge">M</div>

        <div>
            <h1>MediSync — {{ ucfirst($tab) }} Report</h1>

            <p class="meta">
                Period: {{ $from }} → {{ $to }}
                · Generated {{ now()->format('M j, Y g:i A') }}
            </p>
        </div>
    </div>

    @if ($tab === 'inventory')
        <h2>Current Inventory Snapshot</h2>

        @if ($filters['category'] !== 'all')
            <p>Category: {{ $filters['category'] }}</p>
        @endif
        <table>
<thead>
    <tr>
        <th>Generic</th>
        <th>Brand</th>
        <th>Dosage</th>
        <th>Category</th>
        <th>Available Stock</th>
        <th>Physical Stock</th>
        <th>Stock Value (Selling Price)</th>
        <th>Stock Value (Acquisition Cost)</th>
        <th>Status</th>
    </tr>
</thead>

<tbody>
    @forelse ($medicines as $m)
        @php
            $available = (int) $m->available_stock;

            $status = $available <= 0
                ? 'Out of Stock'
                : ($available < 50 ? 'Low Stock' : 'OK');
        @endphp

        <tr>
            <td>{{ $m->generic_name }}</td>
            <td>{{ $m->brand_name ?? '—' }}</td>
            <td>{{ $m->dosage ?? '—' }}</td>
            <td>{{ $m->category ?? '—' }}</td>
            <td>{{ $available }}</td>
            <td>{{ $m->current_stock }}</td>
            <td>
                ₱{{ number_format($available * (float) $m->price, 2) }}
            </td>
            <td>
                ₱{{ number_format((float) $m->available_cost_value, 2) }}
            </td>
            <td>{{ $status }}</td>
        </tr>
    @empty
        <tr>
            <td colspan="9" class="empty">
                No inventory records found.
            </td>
        </tr>
    @endforelse
</tbody>

        </table>

    @elseif ($tab === 'receiving')
        <h2>Received per Supplier</h2>

        @if ($filters['supplier_id'] !== 'all')
            <p>Supplier ID: {{ $filters['supplier_id'] }}</p>
        @endif

        <table>
            <thead>
                <tr>
                    <th>Supplier</th>
                    <th>Batches</th>
                    <th>Units</th>
                    <th>Cost</th>
                </tr>
            </thead>

            <tbody>
                @forelse ($receivingRows as $r)
                    <tr>
                        <td>{{ $r->supplier }}</td>
                        <td>{{ $r->batches }}</td>
                        <td>{{ $r->units }}</td>
                        <td>₱{{ number_format((float) $r->cost, 2) }}</td>
                    </tr>
                @empty
                    <tr>
                        <td colspan="4" class="empty">
                            No receiving records found.
                        </td>
                    </tr>
                @endforelse
            </tbody>
        </table>

    @elseif ($tab === 'dispensing')
        <h2>Dispensed by Medicine</h2>

        @if ($filters['user_id'] !== 'all')
            <p>Dispensing User ID: {{ $filters['user_id'] }}</p>
        @endif

        <table>
            <thead>
                <tr>
                    <th>Medicine</th>
                    <th>Brand</th>
                    <th>Units</th>
                </tr>
            </thead>

            <tbody>
                @forelse ($dispensingRows as $r)
                    <tr>
                        <td>{{ $r->generic_name }}</td>
                        <td>{{ $r->brand_name ?? '—' }}</td>
                        <td>{{ $r->units }}</td>
                    </tr>
                @empty
                    <tr>
                        <td colspan="3" class="empty">
                            No dispensing records found.
                        </td>
                    </tr>
                @endforelse
            </tbody>
        </table>

    @elseif ($tab === 'suppliers')
        <h2>Supplier Directory</h2>

        <p>Supplier directory and lifetime receiving totals.</p>

        <table>
            <thead>
                <tr>
                    <th>Name</th>
                    <th>Contact</th>
                    <th>Phone</th>
                    <th>Email</th>
                    <th>Status</th>
                </tr>
            </thead>

            <tbody>
                @forelse ($suppliers as $s)
                    <tr>
                        <td>{{ $s->name }}</td>
                        <td>{{ $s->contact_person ?? '—' }}</td>
                        <td>{{ $s->phone ?? '—' }}</td>
                        <td>{{ $s->email ?? '—' }}</td>
                        <td>{{ ucfirst($s->status) }}</td>
                    </tr>
                @empty
                    <tr>
                        <td colspan="5" class="empty">
                            No suppliers found.
                        </td>
                    </tr>
                @endforelse
            </tbody>
        </table>

    @elseif ($tab === 'deletions')
        <h2>Deletion History</h2>

        <table>
            <thead>
                <tr>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Description</th>
                    <th>Reason</th>
                    <th>Deleted By</th>
                </tr>
            </thead>

            <tbody>
                @forelse ($deletions as $d)
                    @php
                        $types = [
                            'DELETE_STOCK_IN' => 'Stock-In',
                            'DELETE_STOCK_OUT' => 'Stock-Out',
                            'DELETE_MEDICINE' => 'Medicine',
                            'DELETE_SUPPLIER' => 'Supplier',
                            'DELETE_USER' => 'User',
                        ];
                    @endphp

                    <tr>
                        <td>
                            {{ \Illuminate\Support\Carbon::parse($d->created_at)->format('M j, Y g:i A') }}
                        </td>

                        <td>
                            {{ $types[$d->action_type] ?? $d->action_type }}
                        </td>

                        <td>{{ $d->description }}</td>
                        <td>{{ $d->reason ?? '—' }}</td>
                        <td>{{ $d->user_name ?? 'System' }}</td>
                    </tr>
                @empty
                    <tr>
                        <td colspan="5" class="empty">
                            No deletions recorded in this period.
                        </td>
                    </tr>
                @endforelse
            </tbody>
        </table>
    @endif
</body>
</html>
