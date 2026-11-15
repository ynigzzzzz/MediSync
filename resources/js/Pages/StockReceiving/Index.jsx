import { useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import StatCard from '@/Components/StatCard';
import ConfirmDialog from '@/Components/ConfirmDialog';
import AddReceivingForm from './Partials/AddReceivingForm';
import ReceivingTable from './Partials/ReceivingTable';

export default function Index({ medicines, suppliers, records, alerts = [], stats, filters = {} }) {
    const { auth } = usePage().props;
    const canDelete = auth.user.role === 'admin';

    const [showForm, setShowForm] = useState(false);
    const [pendingDelete, setPendingDelete] = useState(null);

    const [search, setSearch] = useState(filters?.search || '');
    const [dateFrom, setDateFrom] = useState(filters?.date_from || '');
    const [dateTo, setDateTo] = useState(filters?.date_to || '');

    const alertsList = Array.isArray(alerts) ? alerts : [];

    function applyFilters(e) {
        e.preventDefault();
        router.get('/stock-receiving', { search, date_from: dateFrom, date_to: dateTo }, { preserveState: true, preserveScroll: true });
    }

    function clearFilters() {
        setSearch(''); setDateFrom(''); setDateTo('');
        router.get('/stock-receiving');
    }

    function confirmDelete(reason) {
        router.delete(`/stock-receiving/${pendingDelete}`, {
            data: { reason },
            onFinish: () => setPendingDelete(null),
        });
    }

    return (
        <AuthenticatedLayout>
            <Head title="Stock Receiving" />

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Stock Receiving</h1>
                    <p className="text-[13px] text-gray-500">Record incoming medicine batches, track suppliers, and manage inventory intake.</p>
                </div>
                <button onClick={() => setShowForm((v) => !v)} className="rounded-full px-5 py-2 text-[14px] font-semibold bg-gray-900 text-white hover:bg-black transition-colors shadow-sm whitespace-nowrap">
                    {showForm ? '× Close Form' : '+ Record Stock-In'}
                </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                <StatCard icon="fa-triangle-exclamation" label="Low Stock" value={stats?.low_stock ?? 0} tone="warning" onClick={() => router.get('/medicine-list?filter=lowstock')} />
                <StatCard icon="fa-circle-xmark" label="Out of Stock" value={stats?.out_of_stock ?? 0} tone="danger" onClick={() => router.get('/medicine-list?filter=outofstock')} />
                <StatCard icon="fa-hourglass-half" label="Expiring (30d)" value={stats?.expiring ?? 0} tone="warning" onClick={() => router.get('/medicine-list?filter=expiring')} />
            </div>

            {alertsList.length > 0 && (
                <div className="mb-4 bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-[16px] text-[13px] shadow-sm">
                    <h4 className="font-semibold mb-1"><i className="fas fa-triangle-exclamation mr-2" />Attention Required</h4>
                    <ul className="space-y-1">
                        {alertsList.map((a, i) => (
                            <li key={i}>
                                <button onClick={() => router.get(a.link)} className="text-left hover:underline font-medium">
                                    <i className={`fas ${a.icon} mr-1.5 opacity-70`} /> {a.message}
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Retained State Design */}
            <div className={showForm ? 'block' : 'hidden'}>
                <AddReceivingForm medicines={medicines} suppliers={suppliers} onClose={() => setShowForm(false)} />
            </div>

            <ReceivingTable 
                records={records} 
                canDelete={canDelete} 
                onDelete={setPendingDelete} 
                search={search}
                setSearch={setSearch}
                dateFrom={dateFrom}
                setDateFrom={setDateFrom}
                dateTo={dateTo}
                setDateTo={setDateTo}
                applyFilters={applyFilters}
                clearFilters={clearFilters}
            />

            <ConfirmDialog
                open={pendingDelete !== null}
                onOpenChange={(o) => !o && setPendingDelete(null)}
                title="Delete this stock-in record?"
                description="This action cannot be undone. The stock will be deducted."
                confirmLabel="Delete"
                tone="danger"
                withReason={true}
                onConfirmWithReason={confirmDelete}
            />
        </AuthenticatedLayout>
    );
}