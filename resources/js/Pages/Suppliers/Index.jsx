import { useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import StatCard from '@/Components/StatCard';
import Badge from '@/Components/Badge';
import ConfirmDialog from '@/Components/ConfirmDialog';
import Pagination from '@/Components/Pagination';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/Components/ui/dialog';
import { Button } from '@/Components/ui/button';

const emptyForm = {
    name: '', contact_person: '', phone: '', email: '', address: '', status: 'active',
};

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

    function openAdd() {
        setForm(emptyForm);
        setEditingId(null);
        setFormErrors({});
        setShowForm(true);
    }

    function openEdit(s) {
        setForm({
            name: s.name || '',
            contact_person: s.contact_person || '',
            phone: s.phone || '',
            email: s.email || '',
            address: s.address || '',
            status: s.status || 'active',
        });
        setEditingId(s.supplier_id);
        setFormErrors({});
        setShowForm(true);
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
        router.delete(`/suppliers/${pendingDelete.supplier_id}`, {
            preserveScroll: true,
            onFinish: () => setPendingDelete(null),
        });
    }

    return (
        <AuthenticatedLayout>
            <Head title="Suppliers" />

            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-charcoal-blue">Suppliers</h1>
                    <p className="text-sm text-charcoal-blue opacity-70">
                        Manage the vendors your pharmacy receives stock from.
                    </p>
                </div>
                {canEdit && (
                    <button
                        onClick={openAdd}
                        className="rounded-lg px-4 py-1.5 text-sm font-medium bg-cherry-blossom text-charcoal-blue transition-colors hover:bg-burnt-rose hover:text-white"
                    >
                        <i className="fas fa-plus mr-1" /> Add Supplier
                    </button>
                )}
            </div>

            {flash?.success && (
                <div className="bg-green-50 text-green-800 border border-green-200 rounded-lg p-3 text-sm">
                    {flash.success}
                </div>
            )}

            <div className="grid grid-cols-3 gap-4">
                <StatCard icon="fa-truck"              label="Total Suppliers" value={stats.total} />
                <StatCard icon="fa-circle-check"       label="Active"          value={stats.active}   tone="success" />
                <StatCard icon="fa-circle-pause"       label="Inactive"        value={stats.inactive} tone="warning" />
            </div>

            <form onSubmit={applyFilters} className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-white rounded-[15px] border border-eggshell p-4">
                <input
                    className="md:col-span-3 rounded-lg border-gray-300 text-sm focus:border-cherry-blossom focus:ring-cherry-blossom"
                    placeholder="Search name, contact, email, phone..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
                <select
                    className="rounded-lg border-gray-300 text-sm focus:border-cherry-blossom focus:ring-cherry-blossom"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                >
                    <option value="all">All Statuses</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                </select>
                <button type="submit" className="md:col-span-4 rounded-lg bg-burnt-rose text-white text-sm font-medium px-4 py-2 hover:opacity-90">
                    Apply Filters
                </button>
            </form>

            <div className="bg-white rounded-[15px] border border-eggshell overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="text-left border-b border-eggshell text-charcoal-blue">
                            <th className="p-3">Name</th>
                            <th>Contact Person</th>
                            <th>Phone</th>
                            <th>Email</th>
                            <th>Address</th>
                            <th>Status</th>
                            {canEdit && <th></th>}
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((s) => (
                            <tr key={s.supplier_id} className="border-b border-eggshell last:border-0 hover:bg-[rgba(223,226,207,0.3)]">
                                <td className="p-3 text-charcoal-blue font-medium">{s.name}</td>
                                <td className="text-charcoal-blue">{s.contact_person || '—'}</td>
                                <td className="text-charcoal-blue">{s.phone || '—'}</td>
                                <td className="text-charcoal-blue">{s.email || '—'}</td>
                                <td className="text-charcoal-blue">{s.address || '—'}</td>
                                <td>
                                    <Badge tone={s.status === 'active' ? 'success' : 'warning'} outline>
                                        {s.status}
                                    </Badge>
                                </td>
                                {canEdit && (
                                    <td className="space-x-2 pr-3 text-right">
                                        <button
                                            className="text-burnt-rose text-xs font-medium hover:underline"
                                            onClick={() => openEdit(s)}
                                        >
                                            Edit
                                        </button>
                                        {canDelete && (
                                            <button
                                                className="text-critical-red text-xs font-medium hover:underline"
                                                onClick={() => setPendingDelete(s)}
                                            >
                                                Delete
                                            </button>
                                        )}
                                    </td>
                                )}
                            </tr>
                        ))}
                        {rows.length === 0 && (
                            <tr>
                                <td colSpan={canEdit ? 7 : 6} className="p-6 text-center text-gray-400">
                                    No suppliers yet.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <Pagination meta={suppliers} label="suppliers" />

            {/* Add/Edit dialog */}
            <Dialog open={showForm} onOpenChange={(o) => { if (!o) setShowForm(false); }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingId ? 'Edit Supplier' : 'Add Supplier'}</DialogTitle>
                        <DialogDescription>
                            {editingId
                                ? 'Update the details for this supplier.'
                                : 'Add a new vendor your pharmacy receives stock from.'}
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={submitForm} className="space-y-3">
                        <div>
                            <label className="block text-sm font-medium text-charcoal-blue mb-1">Name *</label>
                            <input
                                className="w-full rounded-lg border-gray-300 text-sm focus:border-cherry-blossom focus:ring-cherry-blossom"
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                required
                            />
                            {formErrors.name && <p className="text-critical-red text-xs mt-1">{formErrors.name}</p>}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                                <label className="block text-sm font-medium text-charcoal-blue mb-1">Contact Person</label>
                                <input
                                    className="w-full rounded-lg border-gray-300 text-sm focus:border-cherry-blossom focus:ring-cherry-blossom"
                                    value={form.contact_person}
                                    onChange={(e) => setForm({ ...form, contact_person: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-charcoal-blue mb-1">Phone</label>
                                <input
                                    className="w-full rounded-lg border-gray-300 text-sm focus:border-cherry-blossom focus:ring-cherry-blossom"
                                    value={form.phone}
                                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-charcoal-blue mb-1">Email</label>
                            <input
                                type="email"
                                className="w-full rounded-lg border-gray-300 text-sm focus:border-cherry-blossom focus:ring-cherry-blossom"
                                value={form.email}
                                onChange={(e) => setForm({ ...form, email: e.target.value })}
                            />
                            {formErrors.email && <p className="text-critical-red text-xs mt-1">{formErrors.email}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-charcoal-blue mb-1">Address</label>
                            <input
                                className="w-full rounded-lg border-gray-300 text-sm focus:border-cherry-blossom focus:ring-cherry-blossom"
                                value={form.address}
                                onChange={(e) => setForm({ ...form, address: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-charcoal-blue mb-1">Status</label>
                            <select
                                className="w-full rounded-lg border-gray-300 text-sm focus:border-cherry-blossom focus:ring-cherry-blossom"
                                value={form.status}
                                onChange={(e) => setForm({ ...form, status: e.target.value })}
                            >
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                                Cancel
                            </Button>
                            <Button type="submit">
                                {editingId ? 'Save Changes' : 'Create Supplier'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <ConfirmDialog
                open={!!pendingDelete}
                onOpenChange={(o) => !o && setPendingDelete(null)}
                title="Delete this supplier?"
                description={pendingDelete ? `"${pendingDelete.name}" will be removed. Stock-in records that referenced it will keep their free-text supplier name.` : ''}
                confirmLabel="Delete"
                tone="danger"
                onConfirm={confirmDelete}
            />
        </AuthenticatedLayout>
    );
}