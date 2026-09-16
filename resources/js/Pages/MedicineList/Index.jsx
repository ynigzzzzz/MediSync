import { useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';  // ← Added Head
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

const emptyForm = { generic_name: '', brand_name: '', type: '', category: '', dosage: '', price: '' };

export default function Index({ medicines, totalMedicines, lowStockCount, outOfStockCount, activeFilter }) {
    const { auth, flash } = usePage().props;
    const role = auth.user.role;
    
    const canEdit = role === 'admin' || role === 'pharmacist';
    const canDelete = role === 'admin';

    const [filter, setFilter] = useState(activeFilter);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState(emptyForm);
    const [message, setMessage] = useState(flash?.message || null);

    const filtered = medicines.filter((m) => {
        if (filter === 'lowstock') return m.current_stock > 0 && m.current_stock < 50;
        if (filter === 'outofstock') return m.current_stock === 0;
        return true;
    });

    function openAdd() {
        if (!canEdit) return;
        setForm(emptyForm);
        setEditingId(null);
        setShowForm(true);
    }

    function openEdit(m) {
        if (!canEdit) return;
        setForm({
            generic_name: m.generic_name, brand_name: m.brand_name, type: m.type,
            category: m.category, dosage: m.dosage, price: m.price,
        });
        setEditingId(m.medicine_id);
        setShowForm(true);
    }

    function submitForm() {
        if (!canEdit) return;
        const url = editingId ? `/medicine-list/${editingId}` : '/medicine-list';
        const method = editingId ? 'put' : 'post';
        router[method](url, form, {
            onSuccess: () => { setShowForm(false); setMessage('Saved.'); },
            preserveScroll: true,
        });
    }

    function deleteMedicine(id) {
        if (!canDelete) return;
        if (!confirm('Delete this medicine?')) return;
        router.delete(`/medicine-list/${id}`, { preserveScroll: true });
    }

    return (
        <AuthenticatedLayout>
            <Head title="Medicine Catalog" />
            <>
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-semibold text-charcoal-blue">Medicine Catalog</h1>
                    {canEdit && (
                        <button className="bg-blue-600 text-white rounded px-4 py-2" onClick={openAdd}>
                            Add Medicine
                        </button>
                    )}
                    {!canEdit && (
                        <span className="text-sm text-gray-500">View-only mode</span>
                    )}
                </div>

                {message && <div className="bg-green-100 text-green-800 p-3 rounded">{message}</div>}

                <div className="flex gap-3 text-sm">
                    <button className={`px-3 py-1 rounded border ${filter === 'all' ? 'bg-gray-800 text-white' : ''}`} onClick={() => setFilter('all')}>
                        All ({totalMedicines})
                    </button>
                    <button className={`px-3 py-1 rounded border ${filter === 'lowstock' ? 'bg-amber-600 text-white' : ''}`} onClick={() => setFilter('lowstock')}>
                        Low stock ({lowStockCount})
                    </button>
                    <button className={`px-3 py-1 rounded border ${filter === 'outofstock' ? 'bg-red-600 text-white' : ''}`} onClick={() => setFilter('outofstock')}>
                        Out of stock ({outOfStockCount})
                    </button>
                </div>

                {showForm && canEdit && (
                    <div className="border rounded-lg p-4 space-y-3">
                        <h2 className="font-medium text-charcoal-blue">{editingId ? 'Edit Medicine' : 'Add Medicine'}</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <input className="border rounded p-2" placeholder="Generic name" value={form.generic_name}
                                onChange={(e) => setForm({ ...form, generic_name: e.target.value })} />
                            <input className="border rounded p-2" placeholder="Brand name" value={form.brand_name}
                                onChange={(e) => setForm({ ...form, brand_name: e.target.value })} />
                            <input className="border rounded p-2" placeholder="Type" value={form.type}
                                onChange={(e) => setForm({ ...form, type: e.target.value })} />
                            <input className="border rounded p-2" placeholder="Category" value={form.category}
                                onChange={(e) => setForm({ ...form, category: e.target.value })} />
                            <input className="border rounded p-2" placeholder="Dosage" value={form.dosage}
                                onChange={(e) => setForm({ ...form, dosage: e.target.value })} />
                            <input className="border rounded p-2" type="number" step="0.01" placeholder="Price" value={form.price}
                                onChange={(e) => setForm({ ...form, price: e.target.value })} />
                        </div>
                        {!editingId && <p className="text-xs text-gray-500">New medicines start at 0 stock — add stock via Stock Receiving.</p>}
                        <div className="flex gap-2">
                            <button className="bg-green-600 text-white rounded px-4 py-2" onClick={submitForm}>Save</button>
                            <button className="border rounded px-4 py-2" onClick={() => setShowForm(false)}>Cancel</button>
                        </div>
                    </div>
                )}

                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-left border-b">
                                <th className="py-2 text-charcoal-blue">Generic</th>
                                <th className="py-2 text-charcoal-blue">Brand</th>
                                <th className="py-2 text-charcoal-blue">Type</th>
                                <th className="py-2 text-charcoal-blue">Category</th>
                                <th className="py-2 text-charcoal-blue">Dosage</th>
                                <th className="py-2 text-charcoal-blue">Price</th>
                                <th className="py-2 text-charcoal-blue">Stock</th>
                                {(canEdit || canDelete) && <th className="py-2 text-charcoal-blue"></th>}
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((m) => (
                                <tr key={m.medicine_id} className="border-b">
                                    <td className="py-2 text-charcoal-blue">{m.generic_name}</td>
                                    <td className="py-2 text-charcoal-blue">{m.brand_name}</td>
                                    <td className="py-2 text-charcoal-blue">{m.type}</td>
                                    <td className="py-2 text-charcoal-blue">{m.category}</td>
                                    <td className="py-2 text-charcoal-blue">{m.dosage}</td>
                                    <td className="py-2 text-charcoal-blue">₱{Number(m.price).toFixed(2)}</td>
                                    <td className={`py-2 ${m.current_stock === 0 ? 'text-red-600' : m.current_stock < 50 ? 'text-amber-600' : 'text-charcoal-blue'}`}>
                                        {m.current_stock}
                                    </td>
                                    {(canEdit || canDelete) && (
                                        <td className="py-2 space-x-2">
                                            {canEdit && (
                                                <button className="text-blue-600" onClick={() => openEdit(m)}>Edit</button>
                                            )}
                                            {canDelete && (
                                                <button className="text-red-600" onClick={() => deleteMedicine(m.medicine_id)}>Delete</button>
                                            )}
                                        </td>
                                    )}
                                </tr>
                            ))}
                            {filtered.length === 0 && (
                                <tr><td colSpan={8} className="py-4 text-center text-gray-400">No medicines match the filter.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </>
        </AuthenticatedLayout>
    );
}