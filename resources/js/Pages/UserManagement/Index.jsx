import { useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import StatCard from '@/Components/StatCard';
import Badge from '@/Components/Badge';
import ConfirmDialog from '@/Components/ConfirmDialog';

const emptyForm = {
    full_name: '',
    email: '',
    password: '',
    role: 'pharmacist',
    status: 'active',
    profile_image: null
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

    function applyFilters(e) {
        e?.preventDefault();
        router.get('/user-management', { search, role: roleFilter }, { preserveState: true });
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
                onSuccess: () => {
                    setShowForm(false);
                    setMessage('User updated successfully.');
                    setForm(emptyForm);
                },
                onError: (err) => setErrors(err),
            });
        } else {
            router.post('/user-management', data, {
                forceFormData: true,
                onSuccess: () => {
                    setShowForm(false);
                    setMessage('User added successfully.');
                    setForm(emptyForm);
                },
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
        router.post(`/user-management/${u.user_id}/toggle-status`, {}, { preserveScroll: true });
    }

    return (
        <AuthenticatedLayout>
            <Head title="User Management" />

            <div>
                <h2 className="text-charcoal-blue font-semibold text-2xl mb-1">User Management</h2>
                <p className="text-charcoal-blue opacity-70 text-sm">Manage system users, roles, and access permissions</p>
            </div>

            {message && (
                <div className="bg-green-50 text-green-800 border border-green-200 rounded-lg p-3 text-sm">{message}</div>
            )}

            {errors?.message && (
                <div className="bg-red-50 text-red-800 border border-red-200 rounded-lg p-3 text-sm">{errors.message}</div>
            )}

            <div className="grid grid-cols-3 gap-4">
                <StatCard icon="fa-user-check" label="Active Users" value={stats.activeUsers} color="#2E7D64" />
                <StatCard icon="fa-user-xmark" label="Inactive Users" value={stats.inactiveUsers} color="#E67E22" />
                <StatCard icon="fa-user-shield" label="Admins" value={stats.adminCount} color="#764248" />
            </div>

            <div className="flex justify-between items-center gap-3">
                <form onSubmit={applyFilters} className="flex gap-2 flex-1">
                    <input
                        className="flex-1 max-w-xs rounded-lg border-gray-300 text-sm focus:border-cherry-blossom focus:ring-cherry-blossom"
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
                <form onSubmit={submitForm} className="bg-white rounded-[15px] border border-eggshell p-5 space-y-3" encType="multipart/form-data">
                    <h3 className="font-medium text-charcoal-blue">{editingId ? 'Edit User' : 'Add User'}</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                            <input
                                className="w-full rounded-lg border-gray-300 text-sm focus:border-cherry-blossom focus:ring-cherry-blossom"
                                placeholder="Full name *"
                                value={form.full_name}
                                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                                required
                            />
                            {errors.full_name && <p className="text-critical-red text-xs mt-1">{errors.full_name}</p>}
                        </div>

                        <div>
                            <input
                                type="email"
                                className="w-full rounded-lg border-gray-300 text-sm focus:border-cherry-blossom focus:ring-cherry-blossom"
                                placeholder="Email *"
                                value={form.email}
                                onChange={(e) => setForm({ ...form, email: e.target.value })}
                                required
                            />
                            {errors.email && <p className="text-critical-red text-xs mt-1">{errors.email}</p>}
                        </div>

                        <div>
                            <input
                                type="password"
                                className="w-full rounded-lg border-gray-300 text-sm focus:border-cherry-blossom focus:ring-cherry-blossom"
                                placeholder={editingId ? 'New password (leave blank to keep current)' : 'Password * (min. 6 characters)'}
                                value={form.password}
                                onChange={(e) => setForm({ ...form, password: e.target.value })}
                                required={!editingId}
                                minLength={6}
                            />
                            {errors.password && <p className="text-critical-red text-xs mt-1">{errors.password}</p>}
                        </div>

                        <div>
                            <select
                                className="w-full rounded-lg border-gray-300 text-sm focus:border-cherry-blossom focus:ring-cherry-blossom"
                                value={form.role}
                                onChange={(e) => setForm({ ...form, role: e.target.value })}
                                required
                            >
                                <option value="">Select Role *</option>
                                <option value="admin">Admin</option>
                                <option value="pharmacist">Pharmacist</option>
                                <option value="assistant">Assistant</option>
                            </select>
                            {errors.role && <p className="text-critical-red text-xs mt-1">{errors.role}</p>}
                        </div>

                        <div>
                            <select
                                className="w-full rounded-lg border-gray-300 text-sm focus:border-cherry-blossom focus:ring-cherry-blossom"
                                value={form.status}
                                onChange={(e) => setForm({ ...form, status: e.target.value })}
                                required
                            >
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
                            {errors.status && <p className="text-critical-red text-xs mt-1">{errors.status}</p>}
                        </div>

                        <div>
                            <input
                                type="file"
                                accept="image/*"
                                className="text-sm"
                                onChange={(e) => setForm({ ...form, profile_image: e.target.files[0] || null })}
                            />
                            <p className="text-xs text-gray-400 mt-1">Optional profile image (max 2MB)</p>
                            {errors.profile_image && <p className="text-critical-red text-xs mt-1">{errors.profile_image}</p>}
                        </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                        <button type="submit" className="rounded-lg bg-success-green text-white text-sm px-4 py-2 hover:opacity-90">
                            {editingId ? 'Update User' : 'Create User'}
                        </button>
                        <button
                            type="button"
                            onClick={() => { setShowForm(false); setErrors({}); }}
                            className="rounded-lg border border-gray-300 text-sm px-4 py-2 hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            )}

            <div className="bg-white rounded-[15px] border border-eggshell overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="text-left border-b border-eggshell text-charcoal-blue">
                            <th className="p-3">Name</th><th>Email</th><th>Role</th><th>Status</th><th>Joined</th><th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((u) => (
                            <tr key={u.user_id} className="border-b border-eggshell last:border-0 hover:bg-[rgba(223,226,207,0.3)]">
                                <td className="p-3 flex items-center gap-2 text-charcoal-blue">
                                    {u.profile_image ? (
                                        <img src={`/storage/${u.profile_image}`} className="w-8 h-8 rounded-full object-cover" />
                                    ) : (
                                        <div className="w-8 h-8 rounded-full bg-cherry-blossom flex items-center justify-center text-xs font-bold text-charcoal-blue">
                                            {u.full_name.charAt(0)}
                                        </div>
                                    )}
                                    {u.full_name}
                                    {u.user_id === currentUserId && <span className="text-xs text-gray-400">(you)</span>}
                                </td>
                                <td className="text-charcoal-blue">{u.email}</td>
                                <td>
                                    <Badge tone={ROLE_TONE[u.role] ?? 'neutral'} outline>{u.role}</Badge>
                                </td>
                                <td>
                                    <button onClick={() => toggleStatus(u)}>
                                        <Badge tone={u.status === 'active' ? 'success' : 'warning'}>{u.status}</Badge>
                                    </button>
                                </td>
                                <td className="text-charcoal-blue">{new Date(u.created_at).toLocaleDateString()}</td>
                                <td className="space-x-2 text-right pr-3">
                                    <button onClick={() => openEdit(u)} className="text-burnt-rose text-xs font-medium hover:underline">
                                        Edit
                                    </button>
                                    {u.user_id !== currentUserId && (
                                        <button onClick={() => setPendingDelete(u)} className="text-critical-red text-xs font-medium hover:underline">
                                            Delete
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {users.length === 0 && (
                            <tr><td colSpan={6} className="p-6 text-center text-gray-400">No users found.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

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
