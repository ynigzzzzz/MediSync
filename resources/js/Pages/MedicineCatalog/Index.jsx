import { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import StatCard from '@/Components/StatCard';
import Badge from '@/Components/Badge';
import ConfirmDialog from '@/Components/ConfirmDialog';
import Pagination from '@/Components/Pagination';
import MedicineFormModal from '@/Components/MedicineFormModal';
import { usePage } from '@inertiajs/react';

export default function Index({ medicines, stats, activeFilter, expiringBatches, attention = [] }) {
    const { auth } = usePage().props;
    const canEdit = auth.user.role !== 'assistant';

    const [modalOpen, setModalOpen] = useState(false);
    const [editingMedicine, setEditingMedicine] = useState(null);
    const [pendingDelete, setPendingDelete] = useState(null);
    const [selectedBatches, setSelectedBatches] = useState([]);

    const rows = medicines?.data ?? [];
    const batches = expiringBatches?.data ?? [];
    const isExpiringView = activeFilter === 'expiring';

    function applyFilter(filter) {
        router.get('/medicine-list', { filter }, { preserveScroll: true, preserveState: true });
    }

    function openAdd() {
        setEditingMedicine(null);
        setModalOpen(true);
    }

    function openEdit(m) {
        setEditingMedicine(m);
        setModalOpen(true);
    }

    function confirmDelete(reason) {
        router.delete(`/medicine-list/${pendingDelete.medicine_id}`, {
            data: { reason },
            preserveScroll: true,
            onFinish: () => setPendingDelete(null),
        });
    }

    function toggleBatch(id) {
        setSelectedBatches((prev) => prev.includes(id) ? prev.filter((b) => b !== id) : [...prev, id]);
    }

    function confirmDispose() {
        if (selectedBatches.length === 0) return;
        router.post('/medicine-list/dispose', { batch_ids: selectedBatches }, {
            onSuccess: () => {
                setSelectedBatches([]);
                applyFilter('all');
            },
        });
    }

    return (
        <AuthenticatedLayout>
            <Head title="Medicine Catalog" />

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Medicine Catalog</h1>
                    <p className="text-[13px] text-gray-500">Manage the master list of medicines, prices, and stock levels.</p>
                </div>
                {canEdit && !isExpiringView && (
                    <button onClick={openAdd} className="rounded-full px-5 py-2 text-[14px] font-semibold bg-gray-900 text-white hover:bg-black transition-colors shadow-sm whitespace-nowrap">
                        + Add Medicine
                    </button>
                )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <StatCard label="Total Medicines" value={stats.total} icon="fa-capsules" onClick={() => applyFilter('all')} active={activeFilter === 'all'} />
                <StatCard label="Low Stock" value={stats.lowstock} icon="fa-triangle-exclamation" tone="warning" onClick={() => applyFilter('lowstock')} active={activeFilter === 'lowstock'} />
                <StatCard label="Out of Stock" value={stats.outofstock} icon="fa-circle-xmark" tone="danger" onClick={() => applyFilter('outofstock')} active={activeFilter === 'outofstock'} />
                <StatCard label="Expiring (30 Days)" value={stats.expiring} icon="fa-hourglass-half" tone="warning" onClick={() => applyFilter('expiring')} active={activeFilter === 'expiring'} />
            </div>

            {attention.length > 0 && (
                <div className="mb-4 bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-[16px] text-[13px] shadow-sm">
                    <h4 className="font-semibold mb-1"><i className="fas fa-triangle-exclamation mr-2" />Attention Required</h4>
                    <ul className="space-y-1">
                        {attention.map((a, i) => (
                            <li key={i}>
                                <button onClick={() => router.get(a.link)} className="text-left hover:underline font-medium">
                                    <i className={`fas ${a.icon} mr-1.5 opacity-70`} />
                                    {a.message}
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {isExpiringView ? (
                <div className="bg-white rounded-[16px] shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-4 border-b border-gray-100 bg-amber-50 flex justify-between items-center">
                        <h3 className="font-semibold text-amber-800 text-[14px]"><i className="fas fa-hourglass-half mr-2" /> Batches Expiring Within 30 Days</h3>
                        <button onClick={confirmDispose} disabled={selectedBatches.length === 0} className="rounded-full bg-critical-red text-white text-[13px] font-semibold px-4 py-2 disabled:opacity-50 hover:bg-red-600 transition-colors shadow-sm">
                            Dispose Selected ({selectedBatches.length})
                        </button>
                    </div>
                    <div className="overflow-x-auto w-full">
                        <table className="w-full min-w-[700px] text-left text-[13px]">
                            <thead>
                                <tr className="border-b border-gray-100">
                                    <th className="px-4 py-3 w-10"></th>
                                    <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">Medicine</th>
                                    <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">Batch No</th>
                                    <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">Expiry Date</th>
                                    <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">Qty Left</th>
                                    <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">Days Left</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {batches.map((b) => (
                                    <tr key={b.stock_in_id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-4 py-3"><input type="checkbox" checked={selectedBatches.includes(b.stock_in_id)} onChange={() => toggleBatch(b.stock_in_id)} className="rounded border-gray-300 text-[#FF4D79] focus:ring-[#FF4D79]" /></td>
                                        <td className="px-4 py-3 text-gray-900 font-medium">{b.medicine?.generic_name} {b.medicine?.brand_name && `(${b.medicine.brand_name})`}</td>
                                        <td className="px-4 py-3 text-gray-600">{b.batch_no}</td>
                                        <td className="px-4 py-3 text-gray-600">{b.expiry_date}</td>
                                        <td className="px-4 py-3 text-gray-600">{b.remaining_quantity}</td>
                                        <td className="px-4 py-3"><Badge tone="warning">{b.days_left} days</Badge></td>
                                    </tr>
                                ))}
                                {batches.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No batches expiring within 30 days.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                    <Pagination meta={expiringBatches} label="batches" />
                </div>
            ) : (
                <div className="bg-white rounded-[16px] shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto w-full">
                        <table className="w-full min-w-[800px] text-left text-[13px]">
                            <thead>
                                <tr className="border-b border-gray-100">
                                    <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">Generic</th>
                                    <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">Brand</th>
                                    <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">Type</th>
                                    <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">Category</th>
                                    <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">Dosage</th>
                                    <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">Selling Price</th>
                                    <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">Stock</th>
                                    {canEdit && <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-gray-500">Actions</th>}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {rows.map((m) => (
                                    <tr key={m.medicine_id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-4 py-3 text-gray-900 font-medium">{m.generic_name}</td>
                                        <td className="px-4 py-3 text-gray-600">{m.brand_name}</td>
                                        <td className="px-4 py-3 text-gray-600">{m.type}</td>
                                        <td className="px-4 py-3 text-gray-600">{m.category}</td>
                                        <td className="px-4 py-3 text-gray-600">{m.dosage}</td>
                                        <td className="px-4 py-3 text-gray-600">₱{Number(m.price || 0).toFixed(2)}</td>
                                        <td className="px-4 py-3 text-gray-900">
                                            <span className="mr-2 font-medium">{m.current_stock}</span>
                                            {m.current_stock === 0 && <Badge tone="danger">Out</Badge>}
                                            {m.current_stock > 0 && m.current_stock < 50 && <Badge tone="warning">Low</Badge>}
                                        </td>
                                        {canEdit && (
                                            <td className="px-4 py-3 text-right space-x-3 whitespace-nowrap">
                                                <button className="text-[#FF4D79] text-[13px] font-semibold hover:underline" onClick={() => openEdit(m)}>Edit</button>
                                                <button className="text-critical-red text-[13px] font-semibold hover:underline" onClick={() => setPendingDelete(m)}>Delete</button>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                                {rows.length === 0 && <tr><td colSpan={canEdit ? 8 : 7} className="px-4 py-8 text-center text-gray-400">No medicines found.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                    <Pagination meta={medicines} label="medicines" />
                </div>
            )}

            <MedicineFormModal
                open={modalOpen}
                onOpenChange={setModalOpen}
                medicine={editingMedicine}
                types={stats.types ?? []}
                categories={stats.categories ?? []}
            />

            <ConfirmDialog
                open={!!pendingDelete}
                onOpenChange={(o) => !o && setPendingDelete(null)}
                title="Delete this medicine?"
                description={pendingDelete ? `"${pendingDelete.generic_name}" will be permanently removed from the catalog.` : ''}
                confirmLabel="Delete"
                tone="danger"
                withReason={true}
                onConfirmWithReason={confirmDelete}
            />
        </AuthenticatedLayout>
    );
}