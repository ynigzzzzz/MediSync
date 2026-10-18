import { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import StatCard from '@/Components/StatCard';
import Badge from '@/Components/Badge';
import {
    Card, CardHeader, CardTitle, CardDescription, CardContent,
} from '@/Components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/Components/ui/tabs';
import {
    Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@/Components/ui/table';
import { DateRangePicker } from '@/Components/ui/date-range-picker';
import { ReportBarChart, ReportLineChart } from '@/Components/ReportChart';

function peso(n) {
    return '₱' + Number(n || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function Index({ inventory, receiving, dispensing, supplierSummary, range }) {
    const [tab, setTab] = useState('inventory');
    const [dateRange, setDateRange] = useState({
        from: new Date(range.from),
        to: new Date(range.to),
    });

    function applyRange(r) {
        setDateRange(r);
        if (r?.from && r?.to) {
            const fmt = (d) => {
                const y = d.getFullYear();
                const m = String(d.getMonth() + 1).padStart(2, '0');
                const day = String(d.getDate()).padStart(2, '0');
                return `${y}-${m}-${day}`;
            };
            router.get('/reports', { from: fmt(r.from), to: fmt(r.to) }, { preserveState: true, preserveScroll: true });
        }
    }

    function exportCurrent() {
        let headers = [];
        let data = [];
        const filename = `reports_${tab}_${range.from}_to_${range.to}.csv`;

        if (tab === 'inventory') {
            headers = ['Generic', 'Brand', 'Dosage', 'Stock', 'Price', 'Stock Value', 'Status'];
            data = inventory.rows.map((r) => [r.generic_name, r.brand_name, r.dosage, r.current_stock, r.price, r.stock_value, r.status]);
        } else if (tab === 'receiving') {
            headers = ['Supplier', 'Batches', 'Units', 'Cost'];
            data = receiving.by_supplier.map((r) => [r.supplier, r.batches, r.units, r.cost]);
        } else if (tab === 'dispensing') {
            headers = ['Medicine', 'Brand', 'Units'];
            data = dispensing.by_medicine.map((r) => [r.generic_name, r.brand_name, r.units]);
        } else if (tab === 'suppliers') {
            headers = ['Name', 'Contact Person', 'Phone', 'Email', 'Status', 'Batches', 'Units', 'Cost'];
            data = supplierSummary.map((s) => [s.name, s.contact_person, s.phone, s.email, s.status, s.batches, s.units, s.cost]);
        }

        const csv = [headers, ...data].map((row) => row.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
        const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    }

    function openPrint() {
        const params = new URLSearchParams({ tab, from: range.from, to: range.to }).toString();
        window.open(`/reports/print?${params}`, '_blank');
    }

    return (
        <AuthenticatedLayout>
            <Head title="Reports" />

            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-semibold text-charcoal-blue">Reports</h1>
                    <p className="text-sm text-charcoal-blue opacity-70">
                        Read-only summaries — inventory, receiving, dispensing and suppliers.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {(tab === 'receiving' || tab === 'dispensing') && (
                        <DateRangePicker dateRange={dateRange} onChange={applyRange} />
                    )}
                    <button
                        onClick={exportCurrent}
                        className="rounded-lg border border-gray-300 text-charcoal-blue text-sm px-3 py-2 hover:bg-gray-50"
                    >
                        <i className="fas fa-file-csv mr-1" /> CSV
                    </button>
                    <button
                        onClick={openPrint}
                        className="rounded-lg bg-burnt-rose text-white text-sm px-3 py-2 hover:opacity-90"
                    >
                        <i className="fas fa-print mr-1" /> Print / PDF
                    </button>
                </div>
            </div>

            <Tabs value={tab} onValueChange={setTab}>
                <TabsList>
                    <TabsTrigger value="inventory"><i className="fas fa-capsules mr-2" /> Inventory</TabsTrigger>
                    <TabsTrigger value="receiving"><i className="fas fa-arrow-down mr-2" /> Receiving</TabsTrigger>
                    <TabsTrigger value="dispensing"><i className="fas fa-arrow-up mr-2" /> Dispensing</TabsTrigger>
                    <TabsTrigger value="suppliers"><i className="fas fa-truck mr-2" /> Suppliers</TabsTrigger>
                </TabsList>

                {/* ============ INVENTORY ============ */}
                <TabsContent value="inventory">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <StatCard icon="fa-capsules" label="Total Medicines" value={inventory.total_medicines} />
                        <StatCard icon="fa-triangle-exclamation" label="Low Stock" value={inventory.low_stock} color="#E67E22" />
                        <StatCard icon="fa-circle-xmark" label="Out of Stock" value={inventory.out_of_stock} color="#DC3545" />
                        <StatCard icon="fa-sack-dollar" label="Inventory Value" value={peso(inventory.valuation)} color="#2E7D64" />
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Top 10 Stocked Medicines</CardTitle>
                            <CardDescription>Current stock on hand per medicine.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ReportBarChart
                                data={inventory.top_stock}
                                xKey="name"
                                yKey="stock"
                                label="Stock on hand"
                            />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Full Inventory</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0 overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Generic</TableHead>
                                        <TableHead>Brand</TableHead>
                                        <TableHead>Dosage</TableHead>
                                        <TableHead>Stock</TableHead>
                                        <TableHead>Price</TableHead>
                                        <TableHead>Stock Value</TableHead>
                                        <TableHead>Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {inventory.rows.map((r) => (
                                        <TableRow key={r.medicine_id}>
                                            <TableCell>{r.generic_name}</TableCell>
                                            <TableCell>{r.brand_name}</TableCell>
                                            <TableCell>{r.dosage}</TableCell>
                                            <TableCell>{r.current_stock}</TableCell>
                                            <TableCell>{peso(r.price)}</TableCell>
                                            <TableCell>{peso(r.stock_value)}</TableCell>
                                            <TableCell>
                                                {r.status === 'out' && <Badge tone="danger">Out of Stock</Badge>}
                                                {r.status === 'low' && <Badge tone="warning">Low Stock</Badge>}
                                                {r.status === 'ok' && <Badge tone="success" outline>OK</Badge>}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* ============ RECEIVING ============ */}
                <TabsContent value="receiving">
                    <div className="grid grid-cols-3 gap-4">
                        <StatCard icon="fa-boxes-stacked" label="Total Batches" value={receiving.total_batches} />
                        <StatCard icon="fa-arrow-down" label="Total Units" value={receiving.total_units} color="#2E7D64" />
                        <StatCard icon="fa-sack-dollar" label="Total Cost" value={peso(receiving.total_cost)} />
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Daily Receiving — {range.from} → {range.to}</CardTitle>
                            <CardDescription>Units received per day.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ReportLineChart
                                data={receiving.daily}
                                xKey="label"
                                series={[{ key: 'value', label: 'Units received', color: '#2E7D64' }]}
                            />
                        </CardContent>
                    </Card>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <Card>
                            <CardHeader><CardTitle>Received per Supplier</CardTitle></CardHeader>
                            <CardContent className="p-0">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Supplier</TableHead>
                                            <TableHead>Batches</TableHead>
                                            <TableHead>Units</TableHead>
                                            <TableHead>Cost</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {receiving.by_supplier.length === 0 ? (
                                            <TableRow><TableCell colSpan={4} className="text-center text-gray-400">No receiving in this range.</TableCell></TableRow>
                                        ) : receiving.by_supplier.map((r, i) => (
                                            <TableRow key={i}>
                                                <TableCell>{r.supplier}</TableCell>
                                                <TableCell>{r.batches}</TableCell>
                                                <TableCell>{r.units}</TableCell>
                                                <TableCell>{peso(r.cost)}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader><CardTitle>Top Medicines Received</CardTitle></CardHeader>
                            <CardContent className="p-0">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Medicine</TableHead>
                                            <TableHead>Brand</TableHead>
                                            <TableHead>Units</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {receiving.by_medicine.length === 0 ? (
                                            <TableRow><TableCell colSpan={3} className="text-center text-gray-400">No receiving in this range.</TableCell></TableRow>
                                        ) : receiving.by_medicine.map((r, i) => (
                                            <TableRow key={i}>
                                                <TableCell>{r.generic_name}</TableCell>
                                                <TableCell>{r.brand_name}</TableCell>
                                                <TableCell>{r.units}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* ============ DISPENSING ============ */}
                <TabsContent value="dispensing">
                    <div className="grid grid-cols-3 gap-4">
                        <StatCard icon="fa-receipt" label="Dispense Records" value={dispensing.total_records} />
                        <StatCard icon="fa-arrow-up" label="Total Units" value={dispensing.total_units} color="#764248" />
                        <StatCard icon="fa-sack-dollar" label="Total Value" value={peso(dispensing.total_value)} color="#2E7D64" />
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Daily Dispensing — {range.from} → {range.to}</CardTitle>
                            <CardDescription>Units dispensed per day.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ReportLineChart
                                data={dispensing.daily}
                                xKey="label"
                                series={[{ key: 'value', label: 'Units dispensed', color: '#764248' }]}
                            />
                        </CardContent>
                    </Card>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <Card>
                            <CardHeader><CardTitle>Top Dispensed Medicines</CardTitle></CardHeader>
                            <CardContent className="p-0">
                                <Table>
                                    <TableHeader>
                                        <TableRow><TableHead>Medicine</TableHead><TableHead>Brand</TableHead><TableHead>Units</TableHead></TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {dispensing.by_medicine.length === 0 ? (
                                            <TableRow><TableCell colSpan={3} className="text-center text-gray-400">No dispensing in this range.</TableCell></TableRow>
                                        ) : dispensing.by_medicine.map((r, i) => (
                                            <TableRow key={i}>
                                                <TableCell>{r.generic_name}</TableCell>
                                                <TableCell>{r.brand_name}</TableCell>
                                                <TableCell>{r.units}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader><CardTitle>Dispensed by User</CardTitle></CardHeader>
                            <CardContent className="p-0">
                                <Table>
                                    <TableHeader>
                                        <TableRow><TableHead>User</TableHead><TableHead>Records</TableHead><TableHead>Units</TableHead></TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {dispensing.by_user.length === 0 ? (
                                            <TableRow><TableCell colSpan={3} className="text-center text-gray-400">No dispensing in this range.</TableCell></TableRow>
                                        ) : dispensing.by_user.map((r, i) => (
                                            <TableRow key={i}>
                                                <TableCell>{r.user}</TableCell>
                                                <TableCell>{r.records}</TableCell>
                                                <TableCell>{r.units}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* ============ SUPPLIERS ============ */}
                <TabsContent value="suppliers">
                    <Card>
                        <CardHeader>
                            <CardTitle>Supplier Overview</CardTitle>
                            <CardDescription>All-time receiving totals per supplier.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-0 overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Contact</TableHead>
                                        <TableHead>Phone</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Batches</TableHead>
                                        <TableHead>Units</TableHead>
                                        <TableHead>Total Cost</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {supplierSummary.length === 0 ? (
                                        <TableRow><TableCell colSpan={8} className="text-center text-gray-400">No suppliers yet.</TableCell></TableRow>
                                    ) : supplierSummary.map((s) => (
                                        <TableRow key={s.supplier_id}>
                                            <TableCell className="font-medium">{s.name}</TableCell>
                                            <TableCell>{s.contact_person || '—'}</TableCell>
                                            <TableCell>{s.phone || '—'}</TableCell>
                                            <TableCell>{s.email || '—'}</TableCell>
                                            <TableCell>
                                                <Badge tone={s.status === 'active' ? 'success' : 'warning'} outline>{s.status}</Badge>
                                            </TableCell>
                                            <TableCell>{s.batches}</TableCell>
                                            <TableCell>{s.units}</TableCell>
                                            <TableCell>{peso(s.cost)}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </AuthenticatedLayout>
    );
}