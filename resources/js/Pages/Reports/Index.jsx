import { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import StatCard from '@/Components/StatCard';
import  Badge  from '@/Components/Badge';
import {
    Card, CardHeader, CardTitle, CardDescription, CardContent,
} from '@/Components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/Components/ui/tabs';
import {
    Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@/Components/ui/table';
import { DateRangePicker } from '@/Components/ui/date-range-picker';
import { ReportLineChart } from '@/Components/ReportChart';
import { PieChart } from '@/Components/Charts/PieChart';
import { BarChart } from '@/Components/Charts/BarChart';
import { CHART_COLORS } from '@/lib/chart-palette';

function peso(n) {
    return '₱' + Number(n || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function Index({ inventory, receiving, dispensing, supplierSummary, range, filters }) {
    const [tab, setTab] = useState('inventory');
    const [invTab, setInvTab] = useState('overview');
    const [recvTab, setRecvTab] = useState('summary');
    const [dispTab, setDispTab] = useState('summary');

    const [dateRange, setDateRange] = useState({
        from: new Date(range.from),
        to: new Date(range.to),
    });

    const [invFilter, setInvFilter] = useState(filters.category || 'all');
    const [supFilter, setSupFilter] = useState(filters.supplier_id || 'all');
    const [usrFilter, setUsrFilter] = useState(filters.user_id || 'all');

    function applyFilters(overrides = {}) {
        const fmt = (d) => {
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return `${y}-${m}-${day}`;
        };

        const params = {
            from: dateRange?.from ? fmt(dateRange.from) : range.from,
            to: dateRange?.to ? fmt(dateRange.to) : range.to,
            category: invFilter,
            supplier_id: supFilter,
            user_id: usrFilter,
            ...overrides,
        };

        router.get('/reports', params, { preserveState: true, preserveScroll: true });
    }

    function onDateChange(r) {
        setDateRange(r);
        if (r?.from && r?.to) {
            const fmt = (d) => {
                const y = d.getFullYear();
                const m = String(d.getMonth() + 1).padStart(2, '0');
                const day = String(d.getDate()).padStart(2, '0');
                return `${y}-${m}-${day}`;
            };
            applyFilters({ from: fmt(r.from), to: fmt(r.to) });
        }
    }

    function onFilterChange(key, val) {
        if (key === 'category') setInvFilter(val);
        if (key === 'supplier_id') setSupFilter(val);
        if (key === 'user_id') setUsrFilter(val);
        applyFilters({ [key]: val });
    }

    function exportCurrent() {
        let headers = [];
        let data = [];
        const filename = `reports_${tab}_${range.from}_to_${range.to}.csv`;

        if (tab === 'inventory') {
            headers = ['Generic', 'Brand', 'Dosage', 'Category', 'Stock', 'Price', 'Stock Value', 'Status'];
            data = inventory.rows.map((r) => [r.generic_name, r.brand_name, r.dosage, r.category, r.current_stock, r.price, r.stock_value, r.status]);
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

    const PIE_COLORS = [CHART_COLORS.green, CHART_COLORS.orange, CHART_COLORS.red];

    return (
        <AuthenticatedLayout>
            <Head title="Reports" />

            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-semibold text-charcoal-blue">Reports</h1>
                    <p className="text-sm text-charcoal-blue opacity-70">Read-only summaries — inventory, receiving, dispensing and suppliers.</p>
                </div>
                <div className="flex items-center gap-2">
                    {(tab === 'receiving' || tab === 'dispensing') && (
                        <DateRangePicker dateRange={dateRange} onChange={onDateChange} />
                    )}
                    <button onClick={exportCurrent} className="rounded-lg border border-gray-300 text-charcoal-blue text-sm px-3 py-2 hover:bg-gray-50">
                        <i className="fas fa-file-csv mr-1" /> CSV
                    </button>
                    <button onClick={openPrint} className="rounded-lg bg-burnt-rose text-white text-sm px-3 py-2 hover:opacity-90">
                        <i className="fas fa-print mr-1" /> Print
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

                {/* ═══════════════ INVENTORY ═══════════════ */}
                <TabsContent value="inventory">
                    <div className="flex items-center justify-between mb-4">
                        <Tabs value={invTab} onValueChange={setInvTab}>
                            <TabsList className="border-b-0">
                                <TabsTrigger value="overview">Overview</TabsTrigger>
                                <TabsTrigger value="lowout">Low & Out of Stock</TabsTrigger>
                            </TabsList>
                        </Tabs>
                        <select
                            className="rounded-lg border-gray-300 text-sm focus:border-cherry-blossom focus:ring-cherry-blossom"
                            value={invFilter}
                            onChange={(e) => onFilterChange('category', e.target.value)}
                        >
                            <option value="all">All Categories</option>
                            {inventory.categories.map((c) => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <StatCard icon="fa-capsules" label="Total Medicines" value={inventory.total_medicines} />
                        <StatCard icon="fa-triangle-exclamation" label="Low Stock" value={inventory.low_stock} tone="warning" />
                        <StatCard icon="fa-circle-xmark" label="Out of Stock" value={inventory.out_of_stock} tone="danger" />
                        <StatCard icon="fa-sack-dollar" label="Inventory Value" value={peso(inventory.valuation)} tone="success" />
                    </div>

                    {invTab === 'overview' && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
                            <Card className="lg:col-span-1">
                                <CardHeader><CardTitle>Stock Status</CardTitle></CardHeader>
                                <CardContent>
                                    <PieChart data={inventory.status_distribution} nameKey="name" dataKey="value" colors={PIE_COLORS} />
                                </CardContent>
                            </Card>
                            <Card className="lg:col-span-2">
                                <CardHeader><CardTitle>Full Inventory</CardTitle></CardHeader>
                                <CardContent className="p-0 overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Generic</TableHead><TableHead>Category</TableHead><TableHead>Stock</TableHead><TableHead>Status</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {inventory.rows.map((r) => (
                                                <TableRow key={r.medicine_id}>
                                                    <TableCell>{r.generic_name} {r.brand_name && <span className="text-xs text-gray-500">({r.brand_name})</span>}</TableCell>
                                                    <TableCell>{r.category}</TableCell>
                                                    <TableCell>{r.current_stock}</TableCell>
                                                    <TableCell>
                                                        {r.status === 'out' && <Badge tone="danger">Out</Badge>}
                                                        {r.status === 'low' && <Badge tone="warning">Low</Badge>}
                                                        {r.status === 'ok' && <Badge tone="success" outline>OK</Badge>}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {invTab === 'lowout' && (
                        <Card className="mt-4">
                            <CardHeader><CardTitle>Low & Out of Stock</CardTitle></CardHeader>
                            <CardContent className="p-0 overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Generic</TableHead><TableHead>Brand</TableHead><TableHead>Dosage</TableHead><TableHead>Stock</TableHead><TableHead>Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {inventory.rows.filter(r => r.status !== 'ok').map((r) => (
                                            <TableRow key={r.medicine_id}>
                                                <TableCell>{r.generic_name}</TableCell>
                                                <TableCell>{r.brand_name}</TableCell>
                                                <TableCell>{r.dosage}</TableCell>
                                                <TableCell>{r.current_stock}</TableCell>
                                                <TableCell>
                                                    {r.status === 'out' && <Badge tone="danger">Out</Badge>}
                                                    {r.status === 'low' && <Badge tone="warning">Low</Badge>}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        {inventory.rows.filter(r => r.status !== 'ok').length === 0 && (
                                            <TableRow><TableCell colSpan={5} className="text-center text-gray-400 py-4">All stock is OK.</TableCell></TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                {/* ═══════════════ RECEIVING ═══════════════ */}
                <TabsContent value="receiving">
                    <div className="flex items-center justify-between mb-4">
                        <Tabs value={recvTab} onValueChange={setRecvTab}>
                            <TabsList className="border-b-0">
                                <TabsTrigger value="summary">Summary</TabsTrigger>
                                <TabsTrigger value="supplier">By Supplier</TabsTrigger>
                            </TabsList>
                        </Tabs>
                        <select
                            className="rounded-lg border-gray-300 text-sm focus:border-cherry-blossom focus:ring-cherry-blossom"
                            value={supFilter}
                            onChange={(e) => onFilterChange('supplier_id', e.target.value)}
                        >
                            <option value="all">All Suppliers</option>
                            {receiving.suppliers_list.map((s) => <option key={s.supplier_id} value={s.supplier_id}>{s.name}</option>)}
                        </select>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <StatCard icon="fa-boxes-stacked" label="Total Batches" value={receiving.total_batches} />
                        <StatCard icon="fa-arrow-down" label="Total Units" value={receiving.total_units} tone="success" />
                        <StatCard icon="fa-sack-dollar" label="Total Cost" value={peso(receiving.total_cost)} />
                    </div>

                    {recvTab === 'summary' && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
                            <Card>
                                <CardHeader><CardTitle>Daily Receiving</CardTitle></CardHeader>
                                <CardContent>
                                    <ReportLineChart data={receiving.daily} xKey="label" series={[{ key: 'value', label: 'Units received', color: CHART_COLORS.green }]} />
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader><CardTitle>Top Medicines Received</CardTitle></CardHeader>
                                <CardContent>
                                    <BarChart data={receiving.by_medicine} xKey="name" yKey="units" label="Units" color={CHART_COLORS.green} />
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {recvTab === 'supplier' && (
                        <Card className="mt-4">
                            <CardHeader><CardTitle>Receiving by Supplier</CardTitle></CardHeader>
                            <CardContent className="p-0 overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow><TableHead>Supplier</TableHead><TableHead>Batches</TableHead><TableHead>Units</TableHead><TableHead>Cost</TableHead></TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {receiving.by_supplier.length === 0 ? (
                                            <TableRow><TableCell colSpan={4} className="text-center text-gray-400 py-4">No records.</TableCell></TableRow>
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
                    )}
                </TabsContent>

                {/* ═══════════════ DISPENSING ═══════════════ */}
                <TabsContent value="dispensing">
                    <div className="flex items-center justify-between mb-4">
                        <Tabs value={dispTab} onValueChange={setDispTab}>
                            <TabsList className="border-b-0">
                                <TabsTrigger value="summary">Summary</TabsTrigger>
                                <TabsTrigger value="user">By User</TabsTrigger>
                            </TabsList>
                        </Tabs>
                        <select
                            className="rounded-lg border-gray-300 text-sm focus:border-cherry-blossom focus:ring-cherry-blossom"
                            value={usrFilter}
                            onChange={(e) => onFilterChange('user_id', e.target.value)}
                        >
                            <option value="all">All Users</option>
                            {dispensing.users_list.map((u) => <option key={u.user_id} value={u.user_id}>{u.full_name}</option>)}
                        </select>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <StatCard icon="fa-receipt" label="Records" value={dispensing.total_records} />
                        <StatCard icon="fa-arrow-up" label="Total Units" value={dispensing.total_units} tone="rose" />
                        <StatCard icon="fa-sack-dollar" label="Total Value" value={peso(dispensing.total_value)} tone="success" />
                    </div>

                    {dispTab === 'summary' && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
                            <Card>
                                <CardHeader><CardTitle>Daily Dispensing</CardTitle></CardHeader>
                                <CardContent>
                                    <ReportLineChart data={dispensing.daily} xKey="label" series={[{ key: 'value', label: 'Units dispensed', color: CHART_COLORS.rose }]} />
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader><CardTitle>Top Dispensed Medicines</CardTitle></CardHeader>
                                <CardContent>
                                    <BarChart data={dispensing.by_medicine} xKey="name" yKey="units" label="Units" color={CHART_COLORS.rose} />
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {dispTab === 'user' && (
                        <Card className="mt-4">
                            <CardHeader><CardTitle>Dispensed by User</CardTitle></CardHeader>
                            <CardContent className="p-0 overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow><TableHead>User</TableHead><TableHead>Records</TableHead><TableHead>Units</TableHead></TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {dispensing.by_user.length === 0 ? (
                                            <TableRow><TableCell colSpan={3} className="text-center text-gray-400 py-4">No records.</TableCell></TableRow>
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
                    )}
                </TabsContent>

                {/* ═══════════════ SUPPLIERS ═══════════════ */}
                <TabsContent value="suppliers">
                    <Card>
                        <CardHeader><CardTitle>Supplier Overview</CardTitle></CardHeader>
                        <CardContent className="p-0 overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead><TableHead>Contact</TableHead><TableHead>Status</TableHead><TableHead>Batches</TableHead><TableHead>Units</TableHead><TableHead>Cost</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {supplierSummary.length === 0 ? (
                                        <TableRow><TableCell colSpan={6} className="text-center text-gray-400 py-4">No suppliers yet.</TableCell></TableRow>
                                    ) : supplierSummary.map((s) => (
                                        <TableRow key={s.supplier_id}>
                                            <TableCell>{s.name}</TableCell>
                                            <TableCell>{s.contact_person}</TableCell>
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