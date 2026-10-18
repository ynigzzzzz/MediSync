import { useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import StatCard from '@/Components/StatCard';
import Badge from '@/Components/Badge';
import ConfirmDialog from '@/Components/ConfirmDialog';
import Pagination from '@/Components/Pagination';

const emptyForm = {
    full_name: '',
    email: '',
    password: '',
    role: 'pharmacist',
    status: 'active',
    profile_image: null,
};

const ROLE_TONE = { admin: 'rose', pharmacist: 'success', assistant: 'neutral' };

export default function Index({ users, stats, filters }) {
    const { auth, flash } = usePage().props;
    const currentUserId = auth.user.user_id;

    const [search, setSearch] = useState(filters.search || '');
    const [roleFilter, setRoleFilter] = useState(filters.role || 'all');
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState(emptyForm);
    const [message, setMessage] = useState(flash?.success || null);
    const [errors, setErrors] = useState({});
    const [pendingDelete, setPendingDelete] = useState(null);
    const [showSelfStatusInfo, setShowSelfStatusInfo] = useState(false);

    const rows = users?.data ?? [];

    function applyFilters(e) {
        e.preventDefault();
        router.get('/user-management', { search, role: roleFilter }, { preserveState: true, preserveScroll: true });
    }

    function openAdd() {
        setForm(emptyForm);
        setEditingId(null);
        setShowForm(true);
        setErrors({});
    }

    function openEdit(u) {
        setForm({
            full_name: u.full_name,
            email: u.email,
            password: '',
            role: u.role,
            status: u.status,
            profile_image: null
        });
        setEditingId(u.user_id);
        setShowForm(true);
        setErrors({});
    }

    function submitForm(e) {
        e.preventDefault();
        setErrors({});
        const data = new FormData();
        Object.entries(form).forEach(([key, value]) => {
            if (value !== null && value !== '' && value !== undefined) {
                data.append(key, value);
            }
        });

        if (editingId) {
            data.append('_method', 'put');
            router.post(`/user-management/${editingId}`, data, {
                forceFormData: true,
                onSuccess: () => { setShowForm(false); setMessage('User updated successfully.'); setForm(emptyForm); },
                onError: (err) => setErrors(err),
            });
        } else {
            router.post('/user-management', data, {
                forceFormData: true,
                onSuccess: () => { setShowForm(false); setMessage('User added successfully.'); setForm(emptyForm); },
                onError: (err) => setErrors(err),
            });
        }
    }

    function confirmDelete() {
        router.delete(`/user-management/${pendingDelete.user_id}`, {
            onFinish: () => setPendingDelete(null),
        });
    }

    function toggleStatus(u) {
        if (u.user_id === currentUserId) {
            setShowSelfStatusInfo(true);
            return;
        }
        // FIX: Route to toggle-status, not update
        router.post(`/user-management/${u.user_id}/toggle-status`, {}, { preserveScroll: true });
    }

    return (
        <AuthenticatedLayout>
            <Head title="User Management" />

            <div>
                <h2 className="text-charcoal-blue font-semibold text-2xl mb-1">User Management</h2>
                <p className="text-charcoal-blue opacity-70 text-sm">Manage system users, roles, and access permissions.</p>
            </div>

            {message && <div className="bg-green-50 text-green-800 border border-green-200 rounded-lg p-3 text-sm">{message}</div>}
            {errors?.message && <div className="bg-red-50 text-red-800 border border-red-200 rounded-lg p-3 text-sm">{errors.message}</div>}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <StatCard icon="fa-user-check" label="Active Users" value={stats.activeUsers} tone="success" />
                <StatCard icon="fa-user-xmark" label="Inactive Users" value={stats.inactiveUsers} tone="warning" />
                <StatCard icon="fa-user-shield" label="Admins" value={stats.adminCount} tone="rose" />
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <form onSubmit={applyFilters} className="flex flex-col sm:flex-row gap-2 flex-1 w-full">
                    <input
                        className="flex-1 rounded-lg border-gray-300 text-sm focus:border-cherry-blossom focus:ring-cherry-blossom"
                        placeholder="Search name or email..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    <select
                        className="rounded-lg border-gray-300 text-sm focus:border-cherry-blossom focus:ring-cherry-blossom"
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                    >
                        <option value="all">All Roles</option>
                        <option value="admin">Admin</option>
                        <option value="pharmacist">Pharmacist</option>
                        <option value="assistant">Assistant</option>
                    </select>
                    <button type="submit" className="rounded-lg border border-gray-300 text-sm px-4 py-2 hover:bg-gray-50">
                        Search
                    </button>
                </form>

                <button
                    onClick={openAdd}
                    className="rounded-lg px-4 py-2 text-sm font-medium bg-cherry-blossom text-charcoal-blue transition-colors hover:bg-burnt-rose hover:text-white whitespace-nowrap"
                >
                    + Add User
                </button>
            </div>

            {showForm && (
                <div className="bg-white rounded-[15px] border border-eggshell p-5 space-y-4">
                    <h3 className="font-medium text-charcoal-blue text-lg">{editingId ? 'Edit User' : 'Add User'}</h3>
                    <form onSubmit={submitForm} className="space-y-4" encType="multipart/form-data">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1 text-charcoal-blue">Full Name<span className="text-critical-red">*</span></label>
                                <input type="text" className="w-full rounded-lg border-gray-300 text-sm focus:border-cherry-blossom focus:ring-cherry-blossom"
                                    value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required />
                                {errors.full_name && <p className="text-critical-red text-xs mt-1">{errors.full_name}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1 text-charcoal-blue">Email Address<span className="text-critical-red">*</span></label>
                                <input type="email" className="w-full rounded-lg border-gray-300 text-sm focus:border-cherry-blossom focus:ring-cherry-blossom"
                                    value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
                                {errors.email && <p className="text-critical-red text-xs mt-1">{errors.email}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1 text-charcoal-blue">
                                    Password {editingId ? '(Leave blank to keep current)' : ''}
                                    {!editingId && <span className="text-critical-red">*</span>}
                                </label>
                                <input type="password" className="w-full rounded-lg border-gray-300 text-sm focus:border-cherry-blossom focus:ring-cherry-blossom"
                                    value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required={!editingId} minLength={6} />
                                {errors.password && <p className="text-critical-red text-xs mt-1">{errors.password}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1 text-charcoal-blue">Role<span className="text-critical-red">*</span></label>
                                <select className="w-full rounded-lg border-gray-300 text-sm focus:border-cherry-blossom focus:ring-cherry-blossom"
                                    value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} required>
                                    <option value="admin">Admin</option>
                                    <option value="pharmacist">Pharmacist</option>
                                    <option value="assistant">Assistant</option>
                                </select>
                                {errors.role && <p className="text-critical-red text-xs mt-1">{errors.role}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1 text-charcoal-blue">Status<span className="text-critical-red">*</span></label>
                                <select className="w-full rounded-lg border-gray-300 text-sm focus:border-cherry-blossom focus:ring-cherry-blossom"
                                    value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} required>
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                </select>
                                {errors.status && <p className="text-critical-red text-xs mt-1">{errors.status}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1 text-charcoal-blue">Profile Image (Optional)</label>
                                <input type="file" accept="image/*" className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-cherry-blossom/20 file:text-charcoal-blue hover:file:bg-cherry-blossom/30"
                                    onChange={(e) => setForm({ ...form, profile_image: e.target.files[0] })} />
                                {errors.profile_image && <p className="text-critical-red text-xs mt-1">{errors.profile_image}</p>}
                            </div>
                        </div>
                        <div className="flex gap-2 pt-2">
                            <button type="submit" className="rounded-lg bg-success-green text-white text-sm px-4 py-2 hover:opacity-90">
                                {editingId ? 'Update User' : 'Create User'}
                            </button>
                            <button type="button" onClick={() => { setShowForm(false); setErrors({}); }} className="rounded-lg border border-gray-300 text-sm px-4 py-2 hover:bg-gray-50">
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="bg-white rounded-[15px] border border-eggshell w-full overflow-hidden">
                <div className="overflow-x-auto w-full">
                    <table className="w-full min-w-[800px] text-sm">
                        <thead>
                            <tr className="text-left border-b border-eggshell text-charcoal-blue">
                                <th className="p-4 whitespace-nowrap">Name</th>
                                <th className="p-4 whitespace-nowrap">Email</th>
                                <th className="p-4 whitespace-nowrap">Role</th>
                                <th className="p-4 whitespace-nowrap">Status</th>
                                <th className="p-4 whitespace-nowrap">Joined</th>
                                <th className="p-4 text-right whitespace-nowrap">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((u) => (
                                <tr key={u.user_id} className="border-b border-eggshell last:border-0 hover:bg-eggshell/30 transition-colors">
                                    <td className="p-4 flex items-center gap-3 text-charcoal-blue whitespace-nowrap">
                                        {u.profile_image ? (
                                            <img src={`/storage/${u.profile_image}`} className="w-8 h-8 rounded-full object-cover shadow-sm" alt="" />
                                        ) : (
                                            <div className="w-8 h-8 rounded-full bg-cherry-blossom flex items-center justify-center text-xs font-bold text-charcoal-blue shadow-sm">
                                                {u.full_name.charAt(0)}
                                            </div>
                                        )}
                                        <span className="font-medium">
                                            {u.full_name}
                                            {u.user_id === currentUserId && <span className="ml-2 text-xs font-normal text-gray-400">(You)</span>}
                                        </span>
                                    </td>
                                    <td className="p-4 text-charcoal-blue whitespace-nowrap">{u.email}</td>
                                    <td className="p-4 whitespace-nowrap">
                                        <Badge tone={ROLE_TONE[u.role] ?? 'neutral'} outline>{u.role}</Badge>
                                    </td>
                                    <td className="p-4 whitespace-nowrap">
                                        <button onClick={() => toggleStatus(u)} className="hover:opacity-80 transition-opacity">
                                            <Badge tone={u.status === 'active' ? 'success' : 'warning'} outline>{u.status}</Badge>
                                        </button>
                                    </td>
                                    <td className="p-4 text-charcoal-blue whitespace-nowrap">
                                        {new Date(u.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="p-4 text-right space-x-3 whitespace-nowrap">
                                        <button onClick={() => openEdit(u)} className="text-burnt-rose text-sm font-medium hover:underline">
                                            Edit
                                        </button>
                                        {u.user_id !== currentUserId && (
                                            <button onClick={() => setPendingDelete(u)} className="text-critical-red text-sm font-medium hover:underline">
                                                Delete
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {rows.length === 0 && (
                                <tr><td colSpan={6} className="p-8 text-center text-gray-400">No users found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <Pagination meta={users} label="users" />

            <ConfirmDialog
                open={!!pendingDelete}
                onOpenChange={(o) => !o && setPendingDelete(null)}
                title="Delete this user?"
                description={pendingDelete ? `"${pendingDelete.full_name}" will lose access to MediSync immediately.` : ''}
                confirmLabel="Delete"
                tone="danger"
                onConfirm={confirmDelete}
            />

            <ConfirmDialog
                open={showSelfStatusInfo}
                onOpenChange={setShowSelfStatusInfo}
                title="Action not allowed"
                description="You cannot change your own account status."
            />
        </AuthenticatedLayout>
    );
}