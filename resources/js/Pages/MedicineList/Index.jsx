import { useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import StatCard from '@/Components/StatCard';
import Badge from '@/Components/Badge';
import ConfirmDialog from '@/Components/ConfirmDialog';
import ExpiryWarning from '@/Components/ExpiryWarning';
import Pagination from '@/Components/Pagination';

const emptyForm = { generic_name: '', brand_name: '', type: '', category: '', dosage: '', price: '' };

export default function Index({ medicines, totalMedicines, lowStockCount, outOfStockCount, expiryWarning, activeFilter }) {
    const { auth, flash, errors } = usePage().props;
    const role = auth.user.role;
    const canEdit = role !== 'assistant';

    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState(emptyForm);
    const [message, setMessage] = useState(flash?.message || null);
    const [pendingDelete, setPendingDelete] = useState(null);

    const rows = medicines?.data ?? [];

    function applyFilter(filter) {
        router.get('/medicine-list', { filter }, { preserveScroll: true, preserveState: true });
    }

    function openAdd() {
        setForm(emptyForm);
        setEditingId(null);
        setShowForm(true);
    }

    function openEdit(m) {
        setForm({
            generic_name: m.generic_name, brand_name: m.brand_name, type: m.type,
            category: m.category, dosage: m.dosage, price: m.price,
        });
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

    return (
        <AuthenticatedLayout>
            <Head title="Medicine Catalog" />

            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-semibold text-charcoal-blue">Medicine Catalog</h1>
                {canEdit && (
                    <button
                        onClick={openAdd}
                        className="rounded-lg px-4 py-1.5 text-sm font-medium bg-cherry-blossom text-charcoal-blue transition-colors hover:bg-burnt-rose hover:text-white"
                    >
                        Add Medicine
                    </button>
                )}
            </div>

            {message && <div className="bg-green-50 text-green-800 border border-green-200 rounded-lg p-3 text-sm">{message}</div>}
            {errors?.generic_name && <div className="bg-red-50 text-red-800 border border-red-200 rounded-lg p-3 text-sm">{errors.generic_name}</div>}

            <div className="grid grid-cols-3 gap-4">
                <StatCard label="Total Medicines" value={totalMedicines} icon="fa-capsules"
                    onClick={() => applyFilter('all')} active={activeFilter === 'all'} />
                <StatCard label="Low Stock" value={lowStockCount} icon="fa-triangle-exclamation" color="#E67E22"
                    onClick={() => applyFilter('lowstock')} active={activeFilter === 'lowstock'} />
                <StatCard label="Out of Stock" value={outOfStockCount} icon="fa-circle-xmark" color="#DC3545"
                    onClick={() => applyFilter('outofstock')} active={activeFilter === 'outofstock'} />
            </div>

            <ExpiryWarning data={expiryWarning} storageKey="expiry-warning-catalog" />

            {showForm && (
                <div className="bg-white border border-eggshell rounded-[15px] p-4 space-y-3">
                    <h2 className="font-medium text-charcoal-blue">{editingId ? 'Edit Medicine' : 'Add Medicine'}</h2>
                    <form onSubmit={submitForm} className="space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <input className="rounded-lg border-gray-300 text-sm focus:border-cherry-blossom focus:ring-cherry-blossom" placeholder="Generic name" value={form.generic_name}
                                onChange={(e) => setForm({ ...form, generic_name: e.target.value })} required />
                            <input className="rounded-lg border-gray-300 text-sm focus:border-cherry-blossom focus:ring-cherry-blossom" placeholder="Brand name" value={form.brand_name}
                                onChange={(e) => setForm({ ...form, brand_name: e.target.value })} />
                            <input className="rounded-lg border-gray-300 text-sm focus:border-cherry-blossom focus:ring-cherry-blossom" placeholder="Type" value={form.type}
                                onChange={(e) => setForm({ ...form, type: e.target.value })} />
                            <input className="rounded-lg border-gray-300 text-sm focus:border-cherry-blossom focus:ring-cherry-blossom" placeholder="Category" value={form.category}
                                onChange={(e) => setForm({ ...form, category: e.target.value })} />
                            <input className="rounded-lg border-gray-300 text-sm focus:border-cherry-blossom focus:ring-cherry-blossom" placeholder="Dosage" value={form.dosage}
                                onChange={(e) => setForm({ ...form, dosage: e.target.value })} />
                            <input className="rounded-lg border-gray-300 text-sm focus:border-cherry-blossom focus:ring-cherry-blossom" type="number" step="0.01" placeholder="Price" value={form.price}
                                onChange={(e) => setForm({ ...form, price: e.target.value })} required />
                        </div>
                        {!editingId && <p className="text-xs text-gray-500">New medicines start at 0 stock — add stock via Stock Receiving.</p>}
                        <div className="flex gap-2">
                            <button type="submit" className="rounded-lg bg-success-green text-white text-sm px-4 py-2 hover:opacity-90">Save</button>
                            <button type="button" onClick={() => setShowForm(false)} className="rounded-lg border border-gray-300 text-sm px-4 py-2">Cancel</button>
                        </div>
                    </form>
                </div>
            )}

            <div className="bg-white rounded-[15px] border border-eggshell overflow-hidden">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="text-left border-b border-eggshell text-charcoal-blue">
                            <th className="p-3">Generic</th><th>Brand</th><th>Type</th><th>Category</th><th>Dosage</th>
                            <th>Price</th><th>Stock</th>{canEdit && <th></th>}
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((m) => (
                            <tr key={m.medicine_id} className="border-b border-eggshell last:border-0 hover:bg-[rgba(223,226,207,0.3)]">
                                <td className="p-3 text-charcoal-blue">{m.generic_name}</td>
                                <td className="text-charcoal-blue">{m.brand_name}</td>
                                <td className="text-charcoal-blue">{m.type}</td>
                                <td className="text-charcoal-blue">{m.category}</td>
                                <td className="text-charcoal-blue">{m.dosage}</td>
                                <td className="text-charcoal-blue">₱{Number(m.price).toFixed(2)}</td>
                                <td className="text-charcoal-blue">
                                    <span className="mr-2">{m.current_stock}</span>
                                    {m.current_stock === 0 && <Badge tone="danger">Out of Stock</Badge>}
                                    {m.current_stock > 0 && m.current_stock < 50 && <Badge tone="warning">Low Stock</Badge>}
                                </td>
                                {canEdit && (
                                    <td className="space-x-2">
                                        <button className="text-burnt-rose text-xs font-medium hover:underline" onClick={() => openEdit(m)}>Edit</button>
                                        <button className="text-critical-red text-xs font-medium hover:underline" onClick={() => setPendingDelete(m)}>Delete</button>
                                    </td>
                                )}
                            </tr>
                        ))}
                        {rows.length === 0 && (
                            <tr><td colSpan={canEdit ? 8 : 7} className="p-6 text-center text-gray-400">No medicines match this filter.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            <Pagination meta={medicines} label="medicines" />

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