import { useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import StatCard from '@/Components/StatCard';
import Pagination from '@/Components/Pagination';

export default function Index({
    transactions, totalFilteredRecords, stockInCount, stockOutCount,
    totalTransactions, stockInTotal, stockOutTotal, users,
    allExpiringBatches, filters,
}) {
    const { auth } = usePage().props;
    const role = auth?.user?.role;
    const canDispose = role === 'admin' || role === 'pharmacist';

    const [form, setForm] = useState({
        search: filters?.search || '',
        type: filters?.type || 'all',
        date_from: filters?.date_from || '',
        date_to: filters?.date_to || '',
        user: filters?.user || 'all',
    });
    const [showDispose, setShowDispose] = useState(false);
    const [selected, setSelected] = useState([]);

    const rows = transactions?.data ?? [];

    const applyFilters = (e) => {
        e.preventDefault();
        // No `page` key — lands on page 1 automatically.
        router.get(route('transaction-history.index'), form, { preserveState: true });
    };

    const exportCsv = () => {
        const params = new URLSearchParams(form).toString();
        window.location.href = `${route('transaction-history.export')}?${params}`;
    };

    const toggleSelected = (id) => {
        setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    };

    const disposeSelected = () => {
        if (selected.length === 0) return;
        router.post(route('transaction-history.dispose'), { batch_ids: selected }, {
            onSuccess: () => { setShowDispose(false); setSelected([]); },
        });
    };

    return (
        <AuthenticatedLayout>
            <Head title="Transaction History" />

            <div>
                <h2 className="text-charcoal-blue font-semibold text-2xl mb-1">Transaction History</h2>
                <p className="text-charcoal-blue opacity-70 text-sm">All stock-in and stock-out activity across the system.</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard icon="fa-receipt" label="Total Transactions" value={totalTransactions.toLocaleString()} />
                <StatCard icon="fa-arrow-down" label="Stock-In (This Month)" value={stockInTotal.toLocaleString()} tone="success" />
                <StatCard icon="fa-arrow-up" label="Stock-Out (This Month)" value={stockOutTotal.toLocaleString()} tone="rose" />
                <StatCard icon="fa-chart-line" label="Net Change" value={(stockInTotal - stockOutTotal).toLocaleString()} />
            </div>

            <form onSubmit={applyFilters} className="grid grid-cols-1 md:grid-cols-6 gap-3 bg-white rounded-[15px] border border-eggshell p-4">
                <input className="md:col-span-2 rounded-lg border-gray-300 text-sm focus:border-cherry-blossom focus:ring-cherry-blossom"
                    placeholder="Medicine, Patient, Supplier..."
                    value={form.search} onChange={(e) => setForm({ ...form, search: e.target.value })} />
                <select className="rounded-lg border-gray-300 text-sm focus:border-cherry-blossom focus:ring-cherry-blossom"
                    value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                    <option value="all">All Types</option>
                    <option value="Stock-In">Stock-In</option>
                    <option value="Stock-Out">Stock-Out</option>
                </select>
                <input type="date" className="rounded-lg border-gray-300 text-sm focus:border-cherry-blossom focus:ring-cherry-blossom"
                    value={form.date_from} onChange={(e) => setForm({ ...form, date_from: e.target.value })} />
                <input type="date" className="rounded-lg border-gray-300 text-sm focus:border-cherry-blossom focus:ring-cherry-blossom"
                    value={form.date_to} onChange={(e) => setForm({ ...form, date_to: e.target.value })} />
                <select className="rounded-lg border-gray-300 text-sm focus:border-cherry-blossom focus:ring-cherry-blossom"
                    value={form.user} onChange={(e) => setForm({ ...form, user: e.target.value })}>
                    <option value="all">All Users</option>
                    {users.map((u) => <option key={u} value={u}>{u}</option>)}
                </select>
                <button type="submit" className="rounded-lg bg-burnt-rose text-white text-sm font-medium px-4 py-2 hover:opacity-90">
                    Filter
                </button>
            </form>

            <div className="flex justify-between items-center">
                <p className="text-xs text-charcoal-blue opacity-60">
                    {totalFilteredRecords} record(s) match the current filters
                </p>
                <div className="flex gap-2">
                    <button className="rounded-lg border border-gray-300 text-charcoal-blue text-sm px-3 py-1.5 hover:bg-gray-50" onClick={exportCsv}>
                        Export CSV
                    </button>
                    {canDispose && (
                        <button className="rounded-lg bg-critical-red text-white text-sm px-3 py-1.5 hover:opacity-90" onClick={() => setShowDispose(true)}>
                            Dispose Expiring Batches
                        </button>
                    )}
                </div>
            </div>

            <div className="bg-white rounded-[15px] border border-eggshell overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="text-left border-b border-eggshell text-charcoal-blue">
                            <th className="p-3">#</th><th>Date & Time</th><th>Type</th><th>Medicine</th><th>Dosage</th>
                            <th>Qty</th><th>Price</th><th>Batch #</th><th>Reference</th><th>Party</th><th>User</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.length === 0 ? (
                            <tr><td colSpan={11} className="text-center text-gray-400 py-8">No transactions found.</td></tr>
                        ) : rows.map((t, i) => (
                            <tr key={`${t.source_table}-${t.record_id}`} className="border-b border-eggshell last:border-0 hover:bg-[rgba(223,226,207,0.3)]">
                                <td className="p-3 text-charcoal-blue">{(transactions.from ?? 1) + i}</td>
                                <td className="text-charcoal-blue">{new Date(t.date_time).toLocaleString()}</td>
                                <td>
                                    <span
    className={
        'inline-block px-2.5 py-1 rounded-full text-xs font-semibold text-white ' +
        (t.transaction_type === 'Stock-In' ? 'bg-success-green' : 'bg-burnt-rose')
    }
>
    {t.transaction_type}
</span>
                                </td>
                                <td><strong className="text-charcoal-blue">{t.generic_name}</strong><br /><small className="text-gray-500">{t.brand_name}</small></td>
                                <td className="text-charcoal-blue">{t.dosage ?? 'N/A'}</td>
                                <td className={t.transaction_type === 'Stock-In' ? 'text-success-green font-medium' : 'text-burnt-rose font-medium'}>
                                    {t.transaction_type === 'Stock-In' ? '+' : '-'}{Math.abs(t.quantity)}
                                </td>
                                <td className="text-charcoal-blue">₱{Number(t.selling_price ?? 0).toFixed(2)}</td>
                                <td className="text-charcoal-blue">{t.batch_reference ?? '—'}</td>
                                <td className="text-charcoal-blue">{t.transaction_type === 'Stock-Out' ? (t.prescription_no ?? 'N/A') : (t.invoice_no ?? 'N/A')}</td>
                                <td className="text-charcoal-blue">{t.transaction_type === 'Stock-Out' ? (t.patient_name ?? 'N/A') : (t.supplier ?? 'N/A')}</td>
                                <td className="text-charcoal-blue">{t.user_name ?? 'System'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <Pagination meta={transactions} label="transactions" />

            {showDispose && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-2xl space-y-4">
                        <h5 className="text-charcoal-blue font-semibold text-lg">Dispose Expiring Batches</h5>
                        <div className="max-h-72 overflow-y-auto border border-eggshell rounded-lg">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-left border-b border-eggshell">
                                        <th className="p-2"></th><th>Medicine</th><th>Batch No.</th><th>Expiry Date</th><th>Days Left</th><th>Remaining Qty</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {allExpiringBatches.length === 0 ? (
                                        <tr><td colSpan={6} className="text-center text-gray-400 py-4">No batches expiring within 30 days.</td></tr>
                                    ) : allExpiringBatches.map((b) => (
                                        <tr key={b.stock_in_id} className="border-b border-eggshell last:border-0">
                                            <td className="p-2">
                                                <input type="checkbox"
                                                    checked={selected.includes(b.stock_in_id)}
                                                    onChange={() => toggleSelected(b.stock_in_id)} />
                                            </td>
                                            <td className="p-2 text-charcoal-blue">{b.generic_name} ({b.brand_name})</td>
                                            <td className="text-charcoal-blue">{b.batch_no}</td>
                                            <td className="text-charcoal-blue">{new Date(b.expiry_date).toLocaleDateString()}</td>
                                            <td className="text-charcoal-blue">{b.days_left}</td>
                                            <td className="text-charcoal-blue">{b.remaining_quantity}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="flex justify-end gap-2">
                            <button className="rounded-lg border border-gray-300 text-sm px-4 py-2" onClick={() => setShowDispose(false)}>Cancel</button>
                            {canDispose && (
                                <button className="rounded-lg bg-critical-red text-white text-sm px-4 py-2 disabled:opacity-50"
                                    disabled={selected.length === 0} onClick={disposeSelected}>
                                    Dispose Selected ({selected.length})
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}