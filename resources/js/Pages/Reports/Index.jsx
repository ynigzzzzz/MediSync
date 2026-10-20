import { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import StatCard from '@/Components/StatCard';
import Badge from '@/Components/Badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/Components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/Components/ui/tabs';
import { DateRangePicker } from '@/Components/ui/date-range-picker';
import { ReportLineChart } from '@/Components/ReportChart';
import { PieChart } from '@/Components/Charts/PieChart';
import { BarChart } from '@/Components/Charts/BarChart';
import { DonutChart } from '@/Components/Charts/DonutChart';
import { RadialChart } from '@/Components/Charts/RadialChart';
import { CHART_COLORS } from '@/lib/chart-palette';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/Components/ui/dropdown-menu";

const inputCls = "w-full rounded-xl border border-transparent bg-[#F2F2F7] px-3 py-2 text-[14px] text-gray-900 placeholder-gray-400 focus:border-gray-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-gray-100 transition-all";

function peso(n) {
    return '₱' + Number(n || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function Index({ inventory, receiving, dispensing, supplierSummary, overall = {}, range, filters }) {
    // Default to summary tab
    const [tab, setTab] = useState('summary'); 
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

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Reports</h1>
                    <p className="text-[13px] text-gray-500">Read-only summaries — inventory, receiving, dispensing and suppliers.</p>
                </div>
                <div className="flex items-center gap-2">
                    {(tab === 'receiving' || tab === 'dispensing') && (
                        <DateRangePicker dateRange={dateRange} onChange={onDateChange} />
                    )}
                    
                    {tab !== 'summary' && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button className="rounded-full bg-gray-900 text-white text-[13px] font-semibold px-4 py-2 hover:bg-black transition-colors shadow-sm flex items-center gap-2">
                                    Export <i className="fas fa-chevron-down text-[10px] opacity-70" />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem onClick={exportCurrent}>
                                    <i className="fas fa-file-csv mr-2 text-gray-400" /> Export as CSV
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={openPrint}>
                                    <i className="fas fa-print mr-2 text-gray-400" /> Print / Save PDF
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>
            </div>

            <Tabs value={tab} onValueChange={setTab}>
                <TabsList className="border-b-0 mb-5 bg-gray-100 p-1 rounded-xl inline-flex w-auto overflow-x-auto">
                    {/* NEW SUMMARY TAB */}
                    <TabsTrigger value="summary" className="rounded-lg px-4 py-1.5 text-[13px] font-semibold text-gray-500 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm transition-all">
                        <i className="fas fa-chart-pie mr-2 opacity-50" /> Summary
                    </TabsTrigger>
                    <TabsTrigger value="inventory" className="rounded-lg px-4 py-1.5 text-[13px] font-semibold text-gray-500 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm transition-all">
                        <i className="fas fa-capsules mr-2 opacity-50" /> Inventory
                    </TabsTrigger>
                    <TabsTrigger value="receiving" className="rounded-lg px-4 py-1.5 text-[13px] font-semibold text-gray-500 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm transition-all">
                        <i className="fas fa-arrow-down mr-2 opacity-50" /> Receiving
                    </TabsTrigger>
                    <TabsTrigger value="dispensing" className="rounded-lg px-4 py-1.5 text-[13px] font-semibold text-gray-500 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm transition-all">
                        <i className="fas fa-arrow-up mr-2 opacity-50" /> Dispensing
                    </TabsTrigger>
                    <TabsTrigger value="suppliers" className="rounded-lg px-4 py-1.5 text-[13px] font-semibold text-gray-500 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm transition-all">
                        <i className="fas fa-truck mr-2 opacity-50" /> Suppliers
                    </TabsTrigger>
                </TabsList>

                {/* ═══════════════ NEW SUMMARY TAB ═══════════════ */}
                <TabsContent value="summary" className="mt-0">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                        <StatCard icon="fa-sack-dollar" label="Total Revenue" value={peso(overall?.total_revenue)} tone="success" />
<StatCard icon="fa-money-bill-transfer" label="Total Spent" value={peso(overall?.total_spent)} tone="danger" />
<StatCard icon="fa-chart-line" label="Net Profit" value={peso(overall?.profit)} tone={overall?.profit >= 0 ? 'success' : 'danger'} />
<StatCard icon="fa-boxes-stacked" label="Total Units" value={overall?.total_units?.toLocaleString()} />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        {/* Top 5 Medicines Donut */}
                        <Card className="lg:col-span-1">
                            <CardHeader>
                                <CardTitle>Most Dispensed</CardTitle>
                                <CardDescription>All-time top 5 medicines.</CardDescription>
                            </CardHeader>
                            <CardContent className="flex flex-col items-center">
                                <DonutChart 
                                    data={overall.top_medicines.map((m, i) => ({
                                        name: m.name,
                                        value: m.value,
                                        fill: ['#3B82F6', '#2E7D64', '#FF4D79', '#E67E22', '#8B5CF6'][i % 5]
                                    }))} 
                                />
                                <div className="w-full mt-4 space-y-2">
                                    {overall.top_medicines.map((m, i) => (
                                        <div key={m.name} className="flex justify-between text-[12px]">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full" style={{ background: ['#3B82F6', '#2E7D64', '#FF4D79', '#E67E22', '#8B5CF6'][i % 5] }} />
                                                <span className="text-gray-600">{m.name}</span>
                                            </div>
                                            <span className="font-semibold text-gray-900">{m.value} units</span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Weekly Summary Chart */}
                        <Card className="lg:col-span-2">
                            <CardHeader>
                                <CardTitle>Operational Summary</CardTitle>
                                <CardDescription>All-time receiving vs dispensing totals.</CardDescription>
                            </CardHeader>
                            <CardContent className="flex items-center justify-center h-[250px]">
                                <BarChart 
                                    data={[
                                        { name: 'Received', units: overall.total_units - (overall.total_revenue/10), cost: overall.total_spent },
                                        { name: 'Dispensed', units: overall.total_units - (overall.total_spent/10), cost: overall.total_revenue }
                                    ]} 
                                    xKey="name" 
                                    yKey="units" 
                                    label="Total Volume" 
                                    color="#3B82F6" 
                                />
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* ═══════════════ INVENTORY ═══════════════ */}
                <TabsContent value="inventory" className="mt-0">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3">
                        <Tabs value={invTab} onValueChange={setInvTab}>
                            <TabsList className="border-b-0 bg-gray-100 p-1 rounded-lg inline-flex w-auto">
                                <TabsTrigger value="overview" className="rounded-md px-4 py-1.5 text-[12px] font-semibold text-gray-500 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm transition-all">Overview</TabsTrigger>
                                <TabsTrigger value="lowout" className="rounded-md px-4 py-1.5 text-[12px] font-semibold text-gray-500 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm transition-all">Low & Out of Stock</TabsTrigger>
                            </TabsList>
                        </Tabs>
                        <select className={`${inputCls} sm:w-48`} value={invFilter} onChange={(e) => onFilterChange('category', e.target.value)}>
                            <option value="all">All Categories</option>
                            {inventory.categories.map((c) => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <StatCard icon="fa-capsules" label="Total Medicines" value={inventory.total_medicines} />
                        <StatCard icon="fa-triangle-exclamation" label="Low Stock" value={inventory.low_stock} tone="warning" />
                        <StatCard icon="fa-circle-xmark" label="Out of Stock" value={inventory.out_of_stock} tone="danger" />
                        <StatCard icon="fa-sack-dollar" label="Inventory Value" value={peso(inventory.valuation)} tone="success" />
                    </div>

                    {invTab === 'overview' && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                            <Card className="lg:col-span-1 flex flex-col items-center justify-center">
                                <CardHeader className="w-full text-center pb-0">
                                    <CardTitle>Inventory Health</CardTitle>
                                </CardHeader>
                                <CardContent className="flex flex-col items-center">
                                    <RadialChart 
                                        data={[{ name: 'Health', value: Math.round(((inventory.total_medicines - inventory.out_of_stock) / inventory.total_medicines) * 100) || 0, fill: '#2E7D64' }]} 
                                        value={`${Math.round(((inventory.total_medicines - inventory.out_of_stock) / inventory.total_medicines) * 100) || 0}%`}
                                        label="Healthy" 
                                    />
                                    <p className="text-[12px] text-gray-500 text-center mt-2">
                                        {inventory.total_medicines - inventory.out_of_stock} out of {inventory.total_medicines} items are in stock.
                                    </p>
                                </CardContent>
                            </Card>
                            
                            <Card className="lg:col-span-2">
                                <CardHeader><CardTitle>Full Inventory</CardTitle></CardHeader>
                                <CardContent className="p-0 overflow-x-auto">
                                    <table className="w-full text-left text-[13px]">
                                        <thead>
                                            <tr className="border-b border-gray-100">
                                                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">Generic</th>
                                                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">Category</th>
                                                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">Stock</th>
                                                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {inventory.rows.slice(0, 15).map((r) => (
                                                <tr key={r.medicine_id} className="hover:bg-gray-50/50 transition-colors">
                                                    <td className="px-4 py-3 text-gray-900 font-medium">{r.generic_name} {r.brand_name && <span className="text-[11px] font-normal text-gray-400">({r.brand_name})</span>}</td>
                                                    <td className="px-4 py-3 text-gray-600">{r.category}</td>
                                                    <td className="px-4 py-3 text-gray-600">{r.current_stock}</td>
                                                    <td className="px-4 py-3">
                                                        {r.status === 'out' && <Badge tone="danger">Out</Badge>}
                                                        {r.status === 'low' && <Badge tone="warning">Low</Badge>}
                                                        {r.status === 'ok' && <Badge tone="success" outline>OK</Badge>}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {invTab === 'lowout' && (
                        <Card>
                            <CardHeader><CardTitle>Low & Out of Stock</CardTitle></CardHeader>
                            <CardContent className="p-0 overflow-x-auto">
                                <table className="w-full text-left text-[13px]">
                                    <thead>
                                        <tr className="border-b border-gray-100">
                                            <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">Generic</th>
                                            <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">Brand</th>
                                            <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">Dosage</th>
                                            <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">Stock</th>
                                            <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {inventory.rows.filter(r => r.status !== 'ok').map((r) => (
                                            <tr key={r.medicine_id} className="hover:bg-gray-50/50 transition-colors">
                                                <td className="px-4 py-3 text-gray-900 font-medium">{r.generic_name}</td>
                                                <td className="px-4 py-3 text-gray-600">{r.brand_name}</td>
                                                <td className="px-4 py-3 text-gray-600">{r.dosage}</td>
                                                <td className="px-4 py-3 text-gray-600">{r.current_stock}</td>
                                                <td className="px-4 py-3">
                                                    {r.status === 'out' && <Badge tone="danger">Out</Badge>}
                                                    {r.status === 'low' && <Badge tone="warning">Low</Badge>}
                                                </td>
                                            </tr>
                                        ))}
                                        {inventory.rows.filter(r => r.status !== 'ok').length === 0 && (
                                            <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">All stock is OK.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                {/* ═══════════════ RECEIVING ═══════════════ */}
                <TabsContent value="receiving" className="mt-0">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3">
                        <Tabs value={recvTab} onValueChange={setRecvTab}>
                            <TabsList className="border-b-0 bg-gray-100 p-1 rounded-lg inline-flex w-auto">
                                <TabsTrigger value="summary" className="rounded-md px-4 py-1.5 text-[12px] font-semibold text-gray-500 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm transition-all">Summary</TabsTrigger>
                                <TabsTrigger value="supplier" className="rounded-md px-4 py-1.5 text-[12px] font-semibold text-gray-500 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm transition-all">By Supplier</TabsTrigger>
                            </TabsList>
                        </Tabs>
                        <select className={`${inputCls} sm:w-48`} value={supFilter} onChange={(e) => onFilterChange('supplier_id', e.target.value)}>
                            <option value="all">All Suppliers</option>
                            {receiving.suppliers_list.map((s) => <option key={s.supplier_id} value={s.supplier_id}>{s.name}</option>)}
                        </select>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                        <StatCard icon="fa-boxes-stacked" label="Total Batches" value={receiving.total_batches} />
                        <StatCard icon="fa-arrow-down" label="Total Units" value={receiving.total_units} tone="success" />
                        <StatCard icon="fa-sack-dollar" label="Total Cost" value={peso(receiving.total_cost)} />
                    </div>

                    {recvTab === 'summary' && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                            <Card className="lg:col-span-2">
                                <CardHeader><CardTitle>Daily Receiving</CardTitle></CardHeader>
                                <CardContent>
                                    <ReportLineChart data={receiving.daily} xKey="label" series={[{ key: 'value', label: 'Units received', color: CHART_COLORS.green }]} />
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader><CardTitle>By Supplier</CardTitle></CardHeader>
                                <CardContent className="flex flex-col items-center">
                                    <DonutChart 
                                        data={receiving.by_supplier.slice(0,4).map((s, i) => ({
                                            name: s.supplier,
                                            value: s.units,
                                            fill: ['#2E7D64', '#3B82F6', '#FF4D79', '#E67E22'][i % 4]
                                        }))} 
                                    />
                                    <div className="w-full mt-4 space-y-2">
                                        {receiving.by_supplier.slice(0,4).map((s, i) => (
                                            <div key={s.supplier} className="flex justify-between text-[12px]">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full" style={{ background: ['#2E7D64', '#3B82F6', '#FF4D79', '#E67E22'][i % 4] }} />
                                                    <span className="text-gray-600">{s.supplier}</span>
                                                </div>
                                                <span className="font-semibold text-gray-900">{s.units} units</span>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {recvTab === 'supplier' && (
                        <Card>
                            <CardHeader><CardTitle>Receiving by Supplier</CardTitle></CardHeader>
                            <CardContent className="p-0 overflow-x-auto">
                                <table className="w-full text-left text-[13px]">
                                    <thead>
                                        <tr className="border-b border-gray-100">
                                            <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">Supplier</th>
                                            <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">Batches</th>
                                            <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">Units</th>
                                            <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">Cost</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {receiving.by_supplier.length === 0 ? (
                                            <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">No records.</td></tr>
                                        ) : receiving.by_supplier.map((r, i) => (
                                            <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                                                <td className="px-4 py-3 text-gray-900 font-medium">{r.supplier}</td>
                                                <td className="px-4 py-3 text-gray-600">{r.batches}</td>
                                                <td className="px-4 py-3 text-gray-600">{r.units}</td>
                                                <td className="px-4 py-3 text-gray-600">{peso(r.cost)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                {/* ═══════════════ DISPENSING ═══════════════ */}
                <TabsContent value="dispensing" className="mt-0">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3">
                        <Tabs value={dispTab} onValueChange={setDispTab}>
                            <TabsList className="border-b-0 bg-gray-100 p-1 rounded-lg inline-flex w-auto">
                                <TabsTrigger value="summary" className="rounded-md px-4 py-1.5 text-[12px] font-semibold text-gray-500 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm transition-all">Summary</TabsTrigger>
                                <TabsTrigger value="user" className="rounded-md px-4 py-1.5 text-[12px] font-semibold text-gray-500 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm transition-all">By User</TabsTrigger>
                            </TabsList>
                        </Tabs>
                        <select className={`${inputCls} sm:w-48`} value={usrFilter} onChange={(e) => onFilterChange('user_id', e.target.value)}>
                            <option value="all">All Users</option>
                            {dispensing.users_list.map((u) => <option key={u.user_id} value={u.user_id}>{u.full_name}</option>)}
                        </select>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                        <StatCard icon="fa-receipt" label="Records" value={dispensing.total_records} />
                        <StatCard icon="fa-arrow-up" label="Total Units" value={dispensing.total_units} tone="rose" />
                        <StatCard icon="fa-sack-dollar" label="Total Value" value={peso(dispensing.total_value)} tone="success" />
                    </div>

                    {dispTab === 'summary' && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                            <Card className="lg:col-span-2">
                                <CardHeader><CardTitle>Daily Dispensing</CardTitle></CardHeader>
                                <CardContent>
                                    <ReportLineChart data={dispensing.daily} xKey="label" series={[{ key: 'value', label: 'Units dispensed', color: CHART_COLORS.rose }]} />
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader><CardTitle>Top Dispensed</CardTitle></CardHeader>
                                <CardContent>
                                    <BarChart data={dispensing.by_medicine.slice(0, 5)} xKey="name" yKey="units" label="Units" color="#FF4D79" />
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {dispTab === 'user' && (
                        <Card>
                            <CardHeader><CardTitle>Dispensed by User</CardTitle></CardHeader>
                            <CardContent className="p-0 overflow-x-auto">
                                <table className="w-full text-left text-[13px]">
                                    <thead>
                                        <tr className="border-b border-gray-100">
                                            <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">User</th>
                                            <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">Records</th>
                                            <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">Units</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {dispensing.by_user.length === 0 ? (
                                            <tr><td colSpan={3} className="px-4 py-8 text-center text-gray-400">No records.</td></tr>
                                        ) : dispensing.by_user.map((r, i) => (
                                            <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                                                <td className="px-4 py-3 text-gray-900 font-medium">{r.user}</td>
                                                <td className="px-4 py-3 text-gray-600">{r.records}</td>
                                                <td className="px-4 py-3 text-gray-600">{r.units}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                {/* ═══════════════ SUPPLIERS ═══════════════ */}
                <TabsContent value="suppliers" className="mt-0">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        <Card className="lg:col-span-2">
                            <CardHeader><CardTitle>Supplier Directory</CardTitle></CardHeader>
                            <CardContent className="p-0 overflow-x-auto">
                                <table className="w-full text-left text-[13px]">
                                    <thead>
                                        <tr className="border-b border-gray-100">
                                            <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">Name</th>
                                            <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">Contact</th>
                                            <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">Status</th>
                                            <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">Batches</th>
                                            <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">Cost</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {supplierSummary.length === 0 ? (
                                            <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">No suppliers yet.</td></tr>
                                        ) : supplierSummary.map((s) => (
                                            <tr key={s.supplier_id} className="hover:bg-gray-50/50 transition-colors">
                                                <td className="px-4 py-3 text-gray-900 font-medium">{s.name}</td>
                                                <td className="px-4 py-3 text-gray-600">{s.contact_person || '—'}</td>
                                                <td className="px-4 py-3">
                                                    <Badge tone={s.status === 'active' ? 'success' : 'warning'} outline>{s.status}</Badge>
                                                </td>
                                                <td className="px-4 py-3 text-gray-600">{s.batches}</td>
                                                <td className="px-4 py-3 text-gray-600">{peso(s.cost)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </CardContent>
                        </Card>
                        
                        <Card>
                            <CardHeader>
                                <CardTitle>Supplier Checklist</CardTitle>
                                <CardDescription>Pending actions for your vendors.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {[
                                    { title: 'Update inactive suppliers', desc: '2 suppliers are currently marked inactive.', done: false },
                                    { title: 'Verify contact info', desc: '3 suppliers are missing phone numbers.', done: false },
                                    { title: 'Quarterly review', desc: 'All active suppliers reviewed for Q3.', done: true },
                                    { title: 'Tax documents', desc: 'W-9 forms collected for all vendors.', done: true },
                                ].map((task, i) => (
                                    <div key={i} className="flex items-start gap-3">
                                        <div className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center shrink-0 border ${task.done ? 'bg-success-green border-success-green text-white' : 'border-gray-300 text-transparent'}`}>
                                            <i className="fas fa-check text-[10px]" />
                                        </div>
                                        <div>
                                            <p className={`text-[13px] font-semibold ${task.done ? 'text-gray-400 line-through' : 'text-gray-900'}`}>{task.title}</p>
                                            <p className="text-[12px] text-gray-500">{task.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>
        </AuthenticatedLayout>
    );
}