import { useState } from 'react';
import { Head, router, usePage, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import StatCard from '@/Components/StatCard';
import Badge from '@/Components/Badge';
import ConfirmDialog from '@/Components/ConfirmDialog';
import ExpiryWarning from '@/Components/ExpiryWarning';
import Pagination from '@/Components/Pagination';

const emptyForm = { generic_name: '', brand_name: '', type: '', category: '', dosage: '', price: '' };

export default function Index({ medicines, totalMedicines, lowStockCount, outOfStockCount, expiryWarning, activeFilter, expiringBatches }) {
    const { auth, flash, errors } = usePage().props;
    const role = auth.user.role;
    const canEdit = role !== 'assistant';

    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState(emptyForm);
    const [message, setMessage] = useState(flash?.message || null);
    const [pendingDelete, setPendingDelete] = useState(null);
    const [selectedBatches, setSelectedBatches] = useState([]);

    const rows = medicines?.data ?? [];
    const batches = expiringBatches?.data ?? [];

    function applyFilter(filter) {
        router.get('/medicine-list', { filter }, { preserveScroll: true, preserveState: true });
    }

    function openAdd() { setForm(emptyForm); setEditingId(null); setShowForm(true); }
    function openEdit(m) {
        setForm({ generic_name: m.generic_name, brand_name: m.brand_name, type: m.type, category: m.category, dosage: m.dosage, price: m.price });
        setEditingId(m.medicine_id);
        setShowForm(true);
    }

    function submitForm(e) {
        e.preventDefault();
        const url = editingId ? `/medicine-list/${editingId}` : '/medicine-list';
        const method = editingId ? 'put' : 'post';
        router[method](url, form, {
            onSuccess: () => { setShowForm(false); setMessage('Saved.'); },
            preserveScroll: true,
        });
    }

    function confirmDelete() {
        router.delete(`/medicine-list/${pendingDelete.medicine_id}`, {
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
            onSuccess: () => { setSelectedBatches([]); applyFilter('all'); }
        });
    }

    const isExpiringView = activeFilter === 'expiring';

    return (
        <AuthenticatedLayout>
            <Head title="Medicine Catalog" />

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
    <div>
        <h1 className="text-2xl font-semibold text-charcoal-blue mb-1">Medicine Catalog</h1>
        <p className="text-sm text-charcoal-blue opacity-70">Manage the master list of medicines, prices, and stock levels.</p>
    </div>
    {canEdit && !isExpiringView && (
                    <button onClick={openAdd} className="rounded-lg px-4 py-1.5 text-sm font-medium bg-cherry-blossom text-charcoal-blue transition-colors hover:bg-burnt-rose hover:text-white whitespace-nowrap">
                        Add Medicine
                    </button>
                )}
            </div>

            {message && <div className="bg-green-50 text-green-800 border border-green-200 rounded-lg p-3 text-sm">{message}</div>}
            {errors?.generic_name && <div className="bg-red-50 text-red-800 border border-red-200 rounded-lg p-3 text-sm">{errors.generic_name}</div>}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard label="Total Medicines" value={totalMedicines} icon="fa-capsules" onClick={() => applyFilter('all')} active={activeFilter === 'all'} />
                <StatCard label="Low Stock" value={lowStockCount} icon="fa-triangle-exclamation" tone="warning" onClick={() => applyFilter('lowstock')} active={activeFilter === 'lowstock'} />
                <StatCard label="Out of Stock" value={outOfStockCount} icon="fa-circle-xmark" tone="danger" onClick={() => applyFilter('outofstock')} active={activeFilter === 'outofstock'} />
                <StatCard label="Expiring (30 Days)" value={expiringBatches?.total ?? 0} icon="fa-hourglass-half" tone="warning" onClick={() => applyFilter('expiring')} active={activeFilter === 'expiring'} />
            </div>

            <ExpiryWarning data={expiryWarning} storageKey="expiry-warning-catalog" />

            {showForm && (
                <div className="bg-white border border-eggshell rounded-[15px] p-5 space-y-4">
                    <h2 className="font-medium text-charcoal-blue text-lg">{editingId ? 'Edit Medicine' : 'Add Medicine'}</h2>
                    <form onSubmit={submitForm} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1 text-charcoal-blue">Generic Name<span className="text-critical-red">*</span></label>
                                <input className="w-full rounded-lg border-gray-300 text-sm focus:border-cherry-blossom focus:ring-cherry-blossom" value={form.generic_name} onChange={(e) => setForm({ ...form, generic_name: e.target.value })} required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1 text-charcoal-blue">Brand Name</label>
                                <input className="w-full rounded-lg border-gray-300 text-sm focus:border-cherry-blossom focus:ring-cherry-blossom" value={form.brand_name} onChange={(e) => setForm({ ...form, brand_name: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1 text-charcoal-blue">Type</label>
                                <input className="w-full rounded-lg border-gray-300 text-sm focus:border-cherry-blossom focus:ring-cherry-blossom" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1 text-charcoal-blue">Category</label>
                                <input className="w-full rounded-lg border-gray-300 text-sm focus:border-cherry-blossom focus:ring-cherry-blossom" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1 text-charcoal-blue">Dosage</label>
                                <input className="w-full rounded-lg border-gray-300 text-sm focus:border-cherry-blossom focus:ring-cherry-blossom" value={form.dosage} onChange={(e) => setForm({ ...form, dosage: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1 text-charcoal-blue">Price<span className="text-critical-red">*</span></label>
                                <input type="number" step="0.01" className="w-full rounded-lg border-gray-300 text-sm focus:border-cherry-blossom focus:ring-cherry-blossom" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
                            </div>
                        </div>
                        {!editingId && <p className="text-xs text-gray-500">New medicines start at 0 stock — add stock via Stock Receiving.</p>}
                        <div className="flex gap-2">
                            <button type="submit" className="rounded-lg bg-success-green text-white text-sm px-4 py-2 hover:opacity-90">Save</button>
                            <button type="button" onClick={() => setShowForm(false)} className="rounded-lg border border-gray-300 text-sm px-4 py-2 hover:bg-gray-50">Cancel</button>
                        </div>
                    </form>
                </div>
            )}

            {isExpiringView ? (
                <div className="bg-white rounded-[15px] border border-eggshell w-full overflow-hidden">
                    <div className="p-4 border-b border-eggshell bg-amber-50 flex justify-between items-center">
                        <h3 className="font-medium text-amber-800"><i className="fas fa-hourglass-half mr-2" /> Batches Expiring Within 30 Days</h3>
                        <button onClick={confirmDispose} disabled={selectedBatches.length === 0} className="rounded-lg bg-critical-red text-white text-sm px-4 py-2 disabled:opacity-50 hover:opacity-90">
                            Dispose Selected ({selectedBatches.length})
                        </button>
                    </div>
                    <div className="overflow-x-auto w-full">
                        <table className="w-full min-w-[700px] text-sm">
                            <thead>
                                <tr className="text-left border-b border-eggshell text-charcoal-blue">
                                    <th className="p-4 w-10"></th>
                                    <th className="p-4 whitespace-nowrap">Medicine</th>
                                    <th className="p-4 whitespace-nowrap">Batch No</th>
                                    <th className="p-4 whitespace-nowrap">Expiry Date</th>
                                    <th className="p-4 whitespace-nowrap">Qty Left</th>
                                    <th className="p-4 whitespace-nowrap">Days Left</th>
                                </tr>
                            </thead>
                            <tbody>
                                {batches.map((b) => (
                                    <tr key={b.stock_in_id} className="border-b border-eggshell last:border-0 hover:bg-eggshell/30">
                                        <td className="p-4"><input type="checkbox" checked={selectedBatches.includes(b.stock_in_id)} onChange={() => toggleBatch(b.stock_in_id)} className="rounded border-gray-300 text-cherry-blossom focus:ring-cherry-blossom" /></td>
                                        <td className="p-4 text-charcoal-blue font-medium">{b.medicine?.generic_name} {b.medicine?.brand_name && `(${b.medicine.brand_name})`}</td>
                                        <td className="p-4 text-charcoal-blue">{b.batch_no}</td>
                                        <td className="p-4 text-charcoal-blue">{b.expiry_date}</td>
                                        <td className="p-4 text-charcoal-blue">{b.remaining_quantity}</td>
                                        <td className="p-4"><Badge tone="warning">{b.days_left} days</Badge></td>
                                    </tr>
                                ))}
                                {batches.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-gray-400">No batches expiring within 30 days.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                    <Pagination meta={expiringBatches} label="batches" />
                </div>
            ) : (
                <div className="bg-white rounded-[15px] border border-eggshell w-full overflow-hidden">
                    <div className="overflow-x-auto w-full">
                        <table className="w-full min-w-[800px] text-sm">
                            <thead>
                                <tr className="text-left border-b border-eggshell text-charcoal-blue">
                                    <th className="p-4 whitespace-nowrap">Generic</th>
                                    <th className="p-4 whitespace-nowrap">Brand</th>
                                    <th className="p-4 whitespace-nowrap">Type</th>
                                    <th className="p-4 whitespace-nowrap">Category</th>
                                    <th className="p-4 whitespace-nowrap">Dosage</th>
                                    <th className="p-4 whitespace-nowrap">Price</th>
                                    <th className="p-4 whitespace-nowrap">Stock</th>
                                    {canEdit && <th className="p-4 text-right whitespace-nowrap">Actions</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((m) => (
                                    <tr key={m.medicine_id} className="border-b border-eggshell last:border-0 hover:bg-eggshell/30">
                                        <td className="p-4 text-charcoal-blue font-medium">{m.generic_name}</td>
                                        <td className="p-4 text-charcoal-blue">{m.brand_name}</td>
                                        <td className="p-4 text-charcoal-blue">{m.type}</td>
                                        <td className="p-4 text-charcoal-blue">{m.category}</td>
                                        <td className="p-4 text-charcoal-blue">{m.dosage}</td>
                                        <td className="p-4 text-charcoal-blue">₱{Number(m.price).toFixed(2)}</td>
                                        <td className="p-4 text-charcoal-blue">
                                            <span className="mr-2">{m.current_stock}</span>
                                            {m.current_stock === 0 && <Badge tone="danger">Out</Badge>}
                                            {m.current_stock > 0 && m.current_stock < 50 && <Badge tone="warning">Low</Badge>}
                                        </td>
                                        {canEdit && (
                                            <td className="p-4 text-right space-x-3 whitespace-nowrap">
                                                <button className="text-burnt-rose text-sm font-medium hover:underline" onClick={() => openEdit(m)}>Edit</button>
                                                <button className="text-critical-red text-sm font-medium hover:underline" onClick={() => setPendingDelete(m)}>Delete</button>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                                {rows.length === 0 && <tr><td colSpan={canEdit ? 8 : 7} className="p-8 text-center text-gray-400">No medicines found.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                    <Pagination meta={medicines} label="medicines" />
                </div>
            )}

            <ConfirmDialog
                open={!!pendingDelete}
                onOpenChange={(o) => !o && setPendingDelete(null)}
                title="Delete this medicine?"
                description={pendingDelete ? `"${pendingDelete.generic_name}" will be permanently removed from the catalog.` : ''}
                confirmLabel="Delete"
                tone="danger"
                onConfirm={confirmDelete}
            />
        </AuthenticatedLayout>
    );
}