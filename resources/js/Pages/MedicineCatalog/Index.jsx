import { useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import StatCard from '@/Components/StatCard';
import Badge from '@/Components/Badge';
import ConfirmDialog from '@/Components/ConfirmDialog';
import ExpiryWarning from '@/Components/ExpiryWarning';
import Pagination from '@/Components/Pagination';
import { SearchableSelect } from '@/Components/ui/searchable-select';

const emptyForm = { generic_name: '', brand_name: '', type: '', category: '', dosage: '', price: '' };
const inputCls = "w-full rounded-xl border border-transparent bg-[#F2F2F7] px-3 py-2 text-[14px] text-gray-900 placeholder-gray-400 focus:border-gray-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-gray-100 transition-all";

// Swapped: Type is physical form, Category is therapeutic use
const DEFAULT_TYPES = ['Tablet', 'Capsule', 'Syrup', 'Suspension', 'Injection', 'Ointment', 'Drops'];
const DEFAULT_CATEGORIES = ['Allergies', 'Stomach Pain', 'Headache', 'Fever', 'Cough', 'Antibiotic', 'Vitamins'];

export default function Index({ medicines, totalMedicines, lowStockCount, outOfStockCount, expiryWarning, activeFilter, expiringBatches, categories, types }) {
    const { auth, flash, errors } = usePage().props;
    const role = auth.user.role;
    const canEdit = role !== 'assistant';

    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState(emptyForm);
    const [message, setMessage] = useState(flash?.message || null);
    const [pendingDelete, setPendingDelete] = useState(null);
    const [selectedBatches, setSelectedBatches] = useState([]);
    const [localError, setLocalError] = useState('');

    const rows = medicines?.data ?? [];
    const batches = expiringBatches?.data ?? [];
    
    const allCategories = [...new Set([...DEFAULT_CATEGORIES, ...(categories || [])])];
    const allTypes = [...new Set([...DEFAULT_TYPES, ...(types || [])])];

    function applyFilter(filter) {
        router.get('/medicine-list', { filter }, { preserveScroll: true, preserveState: true });
    }

    function openAdd() { 
        setForm(emptyForm); 
        setEditingId(null); 
        setLocalError('');
        setShowForm(true); 
    }
    
    function openEdit(m) {
        setForm({ 
            generic_name: m.generic_name, 
            brand_name: m.brand_name, 
            type: m.type, 
            category: m.category, 
            dosage: m.dosage, 
            price: m.price 
        });
        setEditingId(m.medicine_id);
        setLocalError('');
        setShowForm(true);
    }

    function submitForm(e) {
        e.preventDefault();
        
        // Manual check for custom dropdowns
        if (!form.type || !form.category) {
            setLocalError('Please select a Type and Category.');
            return;
        }
        setLocalError('');

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

            {message && <div className="mb-4 bg-green-50 text-green-700 border border-green-200 rounded-xl p-3 text-[13px] font-medium">{message}</div>}
            {(errors?.generic_name || localError) && (
                <div className="mb-4 bg-red-50 text-red-700 border border-red-200 rounded-xl p-3 text-[13px] font-medium">
                    {localError || errors.generic_name}
                </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <StatCard label="Total Medicines" value={totalMedicines} icon="fa-capsules" onClick={() => applyFilter('all')} active={activeFilter === 'all'} />
                <StatCard label="Low Stock" value={lowStockCount} icon="fa-triangle-exclamation" tone="warning" onClick={() => applyFilter('lowstock')} active={activeFilter === 'lowstock'} />
                <StatCard label="Out of Stock" value={outOfStockCount} icon="fa-circle-xmark" tone="danger" onClick={() => applyFilter('outofstock')} active={activeFilter === 'outofstock'} />
                <StatCard label="Expiring (30 Days)" value={expiringBatches?.total ?? 0} icon="fa-hourglass-half" tone="warning" onClick={() => applyFilter('expiring')} active={activeFilter === 'expiring'} />
            </div>

            <ExpiryWarning data={expiryWarning} storageKey="expiry-warning-catalog" />

            {showForm && (
                <div className="bg-white rounded-[16px] shadow-sm border border-gray-100 p-5 mb-4 space-y-4">
                    <h2 className="font-semibold text-gray-900 text-[15px]">{editingId ? 'Edit Medicine' : 'Add Medicine'}</h2>
                    <form onSubmit={submitForm} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-[12px] font-semibold text-gray-700 mb-1">Generic Name<span className="text-critical-red">*</span></label>
                                <input className={inputCls} value={form.generic_name} onChange={(e) => setForm({ ...form, generic_name: e.target.value })} required />
                            </div>
                            <div>
                                <label className="block text-[12px] font-semibold text-gray-700 mb-1">Brand Name<span className="text-critical-red">*</span></label>
                                <input className={inputCls} value={form.brand_name} onChange={(e) => setForm({ ...form, brand_name: e.target.value })} required />
                            </div>
                            <div>
                                <label className="block text-[12px] font-semibold text-gray-700 mb-1">Type<span className="text-critical-red">*</span></label>
                                <SearchableSelect 
                                    value={form.type} 
                                    onChange={(val) => setForm({ ...form, type: val })} 
                                    options={allTypes} 
                                    placeholder="Select type..." 
                                    allowCustom={true}
                                />
                            </div>
                            <div>
                                <label className="block text-[12px] font-semibold text-gray-700 mb-1">Category<span className="text-critical-red">*</span></label>
                                <SearchableSelect 
                                    value={form.category} 
                                    onChange={(val) => setForm({ ...form, category: val })} 
                                    options={allCategories} 
                                    placeholder="Select category..." 
                                    allowCustom={true}
                                />
                            </div>
                            <div>
                                <label className="block text-[12px] font-semibold text-gray-700 mb-1">Dosage<span className="text-critical-red">*</span></label>
                                <input className={inputCls} value={form.dosage} onChange={(e) => setForm({ ...form, dosage: e.target.value })} required placeholder="e.g. 500mg" />
                            </div>
                            <div>
                                <label className="block text-[12px] font-semibold text-gray-700 mb-1">Selling Price (₱)<span className="text-critical-red">*</span></label>
                                <input type="number" step="0.01" min="0" className={inputCls} value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
                            </div>
                        </div>
                        {!editingId && <p className="text-[12px] text-gray-500">New medicines start at 0 stock — add stock via Stock Receiving.</p>}
                        <div className="flex gap-2 pt-2">
                            <button type="submit" className="rounded-full bg-gray-900 text-white font-semibold text-[13px] px-5 py-2 hover:bg-black transition-colors shadow-sm">Save</button>
                            <button type="button" onClick={() => setShowForm(false)} className="rounded-full border border-gray-200 text-gray-700 font-semibold text-[13px] px-5 py-2 hover:bg-gray-50 transition-colors">Cancel</button>
                        </div>
                    </form>
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