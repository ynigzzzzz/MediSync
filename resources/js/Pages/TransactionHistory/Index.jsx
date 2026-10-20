import { useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import StatCard from '@/Components/StatCard';
import Pagination from '@/Components/Pagination';

const inputCls = "w-full rounded-xl border border-transparent bg-[#F2F2F7] px-3 py-2 text-[14px] text-gray-900 placeholder-gray-400 focus:border-gray-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-gray-100 transition-all";

export default function Index({ transactions, totalFilteredRecords, stockInTotal, stockOutTotal, totalTransactions, users, filters }) {
    const [form, setForm] = useState({
        search: filters?.search || '',
        type: filters?.type || 'all',
        date_from: filters?.date_from || '',
        date_to: filters?.date_to || '',
        user: filters?.user || 'all',
    });

    const rows = transactions?.data ?? [];

    const applyFilters = (e) => {
        e.preventDefault();
        router.get(route('transaction-history.index'), form, { preserveState: true });
    };

    const exportCsv = () => {
        const params = new URLSearchParams(form).toString();
        window.location.href = `${route('transaction-history.export')}?${params}`;
    };

    return (
        <AuthenticatedLayout>
            <Head title="Transaction History" />

            <div className="mb-5">
                <h2 className="text-2xl font-semibold tracking-tight text-gray-900">Transaction History</h2>
                <p className="text-[13px] text-gray-500">All stock-in and stock-out activity across the system.</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <StatCard icon="fa-receipt" label="Total Transactions" value={totalTransactions.toLocaleString()} />
                <StatCard icon="fa-arrow-down" label="Stock-In (Month)" value={stockInTotal.toLocaleString()} tone="success" />
                <StatCard icon="fa-arrow-up" label="Stock-Out (Month)" value={stockOutTotal.toLocaleString()} tone="rose" />
                <StatCard icon="fa-chart-line" label="Net Change" value={(stockInTotal - stockOutTotal).toLocaleString()} />
            </div>

            <form onSubmit={applyFilters} className="grid grid-cols-1 md:grid-cols-6 gap-4 bg-white rounded-[16px] shadow-sm border border-gray-100 p-5 mb-4 items-end">
    <div className="md:col-span-2">
        <label className="block text-[12px] font-semibold text-gray-700 mb-1">Search</label>
        <input className={inputCls} placeholder="Medicine, Patient, Supplier..." value={form.search} onChange={(e) => setForm({ ...form, search: e.target.value })} />
    </div>
    <div>
        <label className="block text-[12px] font-semibold text-gray-700 mb-1">Type</label>
        <select className={inputCls} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
            <option value="all">All Types</option>
            <option value="Stock-In">Stock-In</option>
            <option value="Stock-Out">Stock-Out</option>
        </select>
    </div>
    <div>
        <label className="block text-[12px] font-semibold text-gray-700 mb-1">Date From</label>
        <input type="date" className={inputCls} value={form.date_from} onChange={(e) => setForm({ ...form, date_from: e.target.value })} />
    </div>
    <div>
        <label className="block text-[12px] font-semibold text-gray-700 mb-1">Date To</label>
        <input type="date" className={inputCls} value={form.date_to} onChange={(e) => setForm({ ...form, date_to: e.target.value })} />
    </div>
    <div>
        <label className="block text-[12px] font-semibold text-gray-700 mb-1">User</label>
        <select className={inputCls} value={form.user} onChange={(e) => setForm({ ...form, user: e.target.value })}>
            <option value="all">All Users</option>
            {users.map((u) => <option key={u} value={u}>{u}</option>)}
        </select>
    </div>
    <div className="md:col-span-6 flex justify-end pt-1">
        <button type="submit" className="rounded-full bg-gray-900 text-white text-[13px] font-semibold px-6 py-2.5 hover:bg-black transition-colors shadow-sm">
            Apply Filters
        </button>
    </div>
</form>

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
                <p className="text-[13px] text-gray-500 font-medium">
                    {totalFilteredRecords} record(s) match filters.
                </p>
                <div className="flex gap-2">
                    <button className="rounded-full border border-gray-200 text-gray-700 text-[13px] font-semibold px-4 py-2 hover:bg-gray-50 transition-colors shadow-sm" onClick={exportCsv}>
                        <i className="fas fa-file-csv mr-1.5 text-gray-400" /> Export CSV
                    </button>
                    <button className="rounded-full bg-gray-900 text-white text-[13px] font-semibold px-4 py-2 hover:bg-black transition-colors shadow-sm" onClick={() => window.print()}>
                        <i className="fas fa-print mr-1.5" /> Print
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-[16px] shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto w-full">
                    <table className="w-full min-w-[1000px] text-left text-[13px]">
                        <thead>
                            <tr className="border-b border-gray-100">
                                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">#</th>
                                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">Date & Time</th>
                                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">Type</th>
                                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">Medicine</th>
                                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">Dosage</th>
                                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">Qty</th>
                                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">Price</th>
                                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">Batch #</th>
                                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">Reference</th>
                                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">Party</th>
                                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">User</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {rows.length === 0 ? (
                                <tr><td colSpan={11} className="px-4 py-8 text-center text-gray-400">No transactions found.</td></tr>
                            ) : rows.map((t, i) => (
                                <tr key={`${t.source_table}-${t.record_id}`} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-4 py-3 text-gray-400">{(transactions.from ?? 1) + i}</td>
                                    <td className="px-4 py-3 text-gray-600">{new Date(t.date_time).toLocaleString()}</td>
                                    <td className="px-4 py-3">
                                        <span className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-wide ${t.transaction_type === 'Stock-In' ? 'bg-success-green/10 text-success-green' : 'bg-burnt-rose/10 text-burnt-rose'}`}>
                                            {t.transaction_type}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-gray-900 font-medium">{t.generic_name}</td>
                                    <td className="px-4 py-3 text-gray-600">{t.dosage ?? 'N/A'}</td>
                                    <td className={`px-4 py-3 font-semibold ${t.transaction_type === 'Stock-In' ? 'text-success-green' : 'text-burnt-rose'}`}>
                                        {t.transaction_type === 'Stock-In' ? '+' : '-'}{Math.abs(t.quantity)}
                                    </td>
                                    <td className="px-4 py-3 text-gray-600">₱{Number(t.selling_price ?? 0).toFixed(2)}</td>
                                    <td className="px-4 py-3 text-gray-600">{t.batch_reference ?? '—'}</td>
                                    <td className="px-4 py-3 text-gray-600">{t.transaction_type === 'Stock-Out' ? (t.prescription_no ?? 'N/A') : (t.invoice_no ?? 'N/A')}</td>
                                    <td className="px-4 py-3 text-gray-600">{t.transaction_type === 'Stock-Out' ? (t.patient_name ?? 'N/A') : (t.supplier ?? 'N/A')}</td>
                                    <td className="px-4 py-3 text-gray-600">{t.user_name ?? 'System'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <Pagination meta={transactions} label="transactions" />
            </div>
        </AuthenticatedLayout>
    );
}