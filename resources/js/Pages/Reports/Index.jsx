import { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/Components/ui/tabs';
import { DateRangePicker } from '@/Components/ui/date-range-picker';

import SummaryTab from './Partials/SummaryTab';
import DeletionsTab from './Partials/DeletionsTab';
import InventoryTab from './Partials/InventoryTab';
import ReceivingTab from './Partials/ReceivingTab';
import DispensingTab from './Partials/DispensingTab';
import SuppliersTab from './Partials/SuppliersTab';

export default function Index({ inventory, receiving, dispensing, supplierSummary, deletions, overall, range, filters }) {
    const [tab, setTab] = useState('summary'); 
    const [dateRange, setDateRange] = useState({ from: new Date(range.from), to: new Date(range.to) });
    const [invFilter, setInvFilter] = useState(filters.category || 'all');
    const [supFilter, setSupFilter] = useState(filters.supplier_id || 'all');
    const [usrFilter, setUsrFilter] = useState(filters.user_id || 'all');

    function applyFilters(overrides = {}) {
        const fmt = (d) => {
            if (!d) return '';
            const date = new Date(d);
            return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
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

    function openPrint() {
        const params = new URLSearchParams({ tab, from: range.from, to: range.to }).toString();
        const url = `/reports/print?${params}`;

        // Create a hidden iframe
        const iframe = document.createElement('iframe');
        iframe.style.position = 'fixed';
        iframe.style.right = '0';
        iframe.style.bottom = '0';
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.style.border = '0';
        iframe.src = url;

        iframe.onload = () => {
            // Wait for styles to load, then trigger the print dialog
            setTimeout(() => {
                iframe.contentWindow.focus();
                iframe.contentWindow.print();
                
                // Clean up the iframe after a few seconds
                setTimeout(() => {
                    if (document.body.contains(iframe)) {
                        document.body.removeChild(iframe);
                    }
                }, 2000);
            }, 500);
        };

        document.body.appendChild(iframe);
    }

    function exportCsv() {
        const params = new URLSearchParams({ tab, from: range.from, to: range.to }).toString();
        window.location.href = `/reports/export?${params}`;
    }

    return (
        <AuthenticatedLayout>
            <Head title="Reports" />

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Reports</h1>
                    <p className="text-[13px] text-gray-500">Read-only summaries — inventory, receiving, dispensing and suppliers.</p>
                </div>
                <div className="flex items-center gap-2">
                    {(tab === 'receiving' || tab === 'dispensing' || tab === 'deletions') && (
                        <DateRangePicker 
                            dateRange={dateRange} 
                            onChange={(r) => { 
                                setDateRange(r); 
                                if (r?.from && r?.to) {
                                    const fmt = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                                    applyFilters({ from: fmt(r.from), to: fmt(r.to) }); 
                                }
                            }} 
                        />
                    )}
                    {tab !== 'summary' && tab !== 'deletions' && (
                        <div className="flex gap-2">
                            <button onClick={exportCsv} className="rounded-full border border-gray-200 bg-white text-gray-700 text-[13px] font-semibold px-4 py-2 hover:bg-gray-50 transition-colors shadow-sm flex items-center gap-2">
                                <i className="fas fa-file-csv text-gray-400" /> Export
                            </button>
                            <button onClick={openPrint} className="rounded-full bg-gray-900 text-white text-[13px] font-semibold px-4 py-2 hover:bg-black transition-colors shadow-sm flex items-center gap-2">
                                <i className="fas fa-print" /> Print
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <Tabs value={tab} onValueChange={setTab}>
                <TabsList className="border-b-0 mb-5 bg-gray-100 p-1 rounded-xl inline-flex flex-wrap w-full md:w-auto">
                    <TabsTrigger value="summary" className="rounded-lg px-4 py-1.5 text-[13px] font-semibold text-gray-500 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm transition-all"><i className="fas fa-chart-pie mr-2 opacity-50" /> Summary</TabsTrigger>
                    <TabsTrigger value="inventory" className="rounded-lg px-4 py-1.5 text-[13px] font-semibold text-gray-500 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm transition-all"><i className="fas fa-capsules mr-2 opacity-50" /> Inventory</TabsTrigger>
                    <TabsTrigger value="receiving" className="rounded-lg px-4 py-1.5 text-[13px] font-semibold text-gray-500 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm transition-all"><i className="fas fa-arrow-down mr-2 opacity-50" /> Receiving</TabsTrigger>
                    <TabsTrigger value="dispensing" className="rounded-lg px-4 py-1.5 text-[13px] font-semibold text-gray-500 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm transition-all"><i className="fas fa-arrow-up mr-2 opacity-50" /> Dispensing</TabsTrigger>
                    <TabsTrigger value="suppliers" className="rounded-lg px-4 py-1.5 text-[13px] font-semibold text-gray-500 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm transition-all"><i className="fas fa-truck mr-2 opacity-50" /> Suppliers</TabsTrigger>
                    <TabsTrigger value="deletions" className="rounded-lg px-4 py-1.5 text-[13px] font-semibold text-gray-500 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm transition-all"><i className="fas fa-trash-can mr-2 opacity-50" /> Deletions</TabsTrigger>
                </TabsList>

                <TabsContent value="summary" className="mt-0"><SummaryTab overall={overall} /></TabsContent>
                <TabsContent value="inventory" className="mt-0"><InventoryTab inventory={inventory} /></TabsContent>
                <TabsContent value="receiving" className="mt-0"><ReceivingTab receiving={receiving} /></TabsContent>
                <TabsContent value="dispensing" className="mt-0"><DispensingTab dispensing={dispensing} /></TabsContent>
                <TabsContent value="suppliers" className="mt-0"><SuppliersTab supplierSummary={supplierSummary} /></TabsContent>
                <TabsContent value="deletions" className="mt-0"><DeletionsTab deletions={deletions} /></TabsContent>
            </Tabs>
        </AuthenticatedLayout>
    );
}