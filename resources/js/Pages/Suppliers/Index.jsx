import { useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import StatCard from '@/Components/StatCard';
import Badge from '@/Components/Badge';
import ConfirmDialog from '@/Components/ConfirmDialog';
import Pagination from '@/Components/Pagination'; // <-- Keep only one
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/Components/ui/dialog';
import { Button } from '@/Components/ui/button';

const emptyForm = { name: '', contact_person: '', phone: '', email: '', address: '', status: 'active' };
const inputCls = "w-full rounded-xl border border-transparent bg-[#F2F2F7] px-3 py-2 text-[14px] text-gray-900 placeholder-gray-400 focus:border-gray-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-gray-100 transition-all";

export default function Index({ suppliers, stats, filters }) {
    const { auth, flash, errors } = usePage().props;
    const role = auth.user.role;
    const canEdit = role !== 'assistant';
    const canDelete = role === 'admin';

    const [search, setSearch] = useState(filters?.search || '');
    const [status, setStatus] = useState(filters?.status || 'all');
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState(emptyForm);
    const [formErrors, setFormErrors] = useState({});
    const [pendingDelete, setPendingDelete] = useState(null);

    const rows = suppliers?.data ?? [];

    function applyFilters(e) {
        if (e) e.preventDefault();
        router.get('/suppliers', { search, status }, { preserveState: true, preserveScroll: true });
    }

    function openAdd() { setForm(emptyForm); setEditingId(null); setFormErrors({}); setShowForm(true); }
    function openEdit(s) {
        setForm({ name: s.name || '', contact_person: s.contact_person || '', phone: s.phone || '', email: s.email || '', address: s.address || '', status: s.status || 'active' });
        setEditingId(s.supplier_id); setFormErrors({}); setShowForm(true);
    }

    function submitForm(e) {
        e.preventDefault();
        setFormErrors({});
        const url = editingId ? `/suppliers/${editingId}` : '/suppliers';
        const method = editingId ? 'put' : 'post';
        router[method](url, form, {
            preserveScroll: true,
            onSuccess: () => { setShowForm(false); setEditingId(null); },
            onError: (err) => setFormErrors(err),
        });
    }

    function confirmDelete() {
        router.delete(`/suppliers/${pendingDelete.supplier_id}`, { preserveScroll: true, onFinish: () => setPendingDelete(null) });
    }

    return (
        <AuthenticatedLayout>
            <Head title="Suppliers" />

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Suppliers</h1>
                    <p className="text-[13px] text-gray-500">Manage the vendors your pharmacy receives stock from.</p>
                </div>
                {canEdit && (
                    <button onClick={openAdd} className="rounded-full px-5 py-2 text-[13px] font-semibold bg-gray-900 text-white hover:bg-black transition-colors shadow-sm whitespace-nowrap">
                        + Add Supplier
                    </button>
                )}
            </div>

            {flash?.success && <div className="mb-4 bg-green-50 text-green-700 border border-green-200 rounded-xl p-3 text-[13px] font-medium">{flash.success}</div>}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                <StatCard icon="fa-truck" label="Total Suppliers" value={stats.total} />
                <StatCard icon="fa-circle-check" label="Active" value={stats.active} tone="success" />
                <StatCard icon="fa-circle-pause" label="Inactive" value={stats.inactive} tone="warning" />
            </div>

            <form onSubmit={applyFilters} className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-white rounded-[16px] shadow-sm border border-gray-100 p-4 mb-4">
                <input className={`${inputCls} md:col-span-3`} placeholder="Search name, contact, email, phone..." value={search} onChange={(e) => setSearch(e.target.value)} />
                <select className={inputCls} value={status} onChange={(e) => setStatus(e.target.value)}>
                    <option value="all">All Statuses</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                </select>
                <div className="md:col-span-4 flex justify-end">
                    <button type="submit" className="rounded-full bg-gray-900 text-white text-[13px] font-semibold px-5 py-2 hover:bg-black transition-colors shadow-sm">Apply Filters</button>
                </div>
            </form>

            <div className="bg-white rounded-[16px] shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto w-full">
                    <table className="w-full min-w-[800px] text-left text-[13px]">
                        <thead>
                            <tr className="border-b border-gray-100">
                                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">Name</th>
                                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">Contact Person</th>
                                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">Phone</th>
                                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">Email</th>
                                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">Status</th>
                                {canEdit && <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-gray-500">Actions</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {rows.map((s) => (
                                <tr key={s.supplier_id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-4 py-3 text-gray-900 font-medium">{s.name}</td>
                                    <td className="px-4 py-3 text-gray-600">{s.contact_person || '—'}</td>
                                    <td className="px-4 py-3 text-gray-600">{s.phone || '—'}</td>
                                    <td className="px-4 py-3 text-gray-600">{s.email || '—'}</td>
                                    <td className="px-4 py-3"><Badge tone={s.status === 'active' ? 'success' : 'warning'} outline>{s.status}</Badge></td>
                                    {canEdit && (
                                        <td className="px-4 py-3 text-right space-x-3">
                                            <button onClick={() => openEdit(s)} className="text-[#FF4D79] text-[13px] font-semibold hover:underline">Edit</button>
                                            {canDelete && <button onClick={() => setPendingDelete(s)} className="text-critical-red text-[13px] font-semibold hover:underline">Delete</button>}
                                        </td>
                                    )}
                                </tr>
                            ))}
                            {rows.length === 0 && <tr><td colSpan={canEdit ? 6 : 5} className="px-4 py-8 text-center text-gray-400">No suppliers found.</td></tr>}
                        </tbody>
                    </table>
                </div>
                <Pagination meta={suppliers} label="suppliers" />
            </div>

            <Dialog open={showForm} onOpenChange={(o) => !o && setShowForm(false)}>
                <DialogContent className="rounded-[20px] max-w-md p-6">
                    <DialogHeader>
                        <DialogTitle className="text-lg">{editingId ? 'Edit Supplier' : 'Add Supplier'}</DialogTitle>
                        <DialogDescription className="text-[13px]">Update the details for this vendor.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={submitForm} className="space-y-4 mt-2">
                        <div>
                            <label className="block text-[12px] font-semibold text-gray-700 mb-1">Name<span className="text-critical-red">*</span></label>
                            <input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                            {formErrors.name && <p className="text-critical-red text-[11px] mt-1">{formErrors.name}</p>}
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-[12px] font-semibold text-gray-700 mb-1">Contact Person</label>
                                <input className={inputCls} value={form.contact_person} onChange={(e) => setForm({ ...form, contact_person: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-[12px] font-semibold text-gray-700 mb-1">Phone</label>
                                <input className={inputCls} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                            </div>
                        </div>
                        <div>
                            <label className="block text-[12px] font-semibold text-gray-700 mb-1">Email</label>
                            <input type="email" className={inputCls} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                        </div>
                        <div>
                            <label className="block text-[12px] font-semibold text-gray-700 mb-1">Status</label>
                            <select className={inputCls} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
                        </div>
                        <DialogFooter className="mt-6">
                            <Button type="button" variant="outline" onClick={() => setShowForm(false)} className="rounded-full text-[13px] h-9">Cancel</Button>
                            <Button type="submit" className="rounded-full text-[13px] h-9 bg-gray-900 text-white hover:bg-black">{editingId ? 'Save Changes' : 'Create Supplier'}</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <ConfirmDialog open={!!pendingDelete} onOpenChange={(o) => !o && setPendingDelete(null)} title="Delete this supplier?" description={pendingDelete ? `"${pendingDelete.name}" will be removed.` : ''} confirmLabel="Delete" tone="danger" onConfirm={confirmDelete} />
        </AuthenticatedLayout>
    );
}