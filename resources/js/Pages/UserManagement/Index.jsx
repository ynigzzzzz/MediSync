// resources/js/Pages/UserManagement/Index.jsx
import { useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

const emptyForm = { 
    full_name: '', 
    email: '', 
    password: '', 
    role: 'pharmacist', 
    status: 'active', 
    profile_image: null 
};

const ROLE_STYLES = {
    admin: { backgroundColor: 'rgba(118,66,72,0.12)', color: '#764248', border: '1px solid rgba(118,66,72,0.25)' },
    pharmacist: { backgroundColor: 'rgba(46,125,100,0.12)', color: '#2E7D64', border: '1px solid rgba(46,125,100,0.25)' },
    assistant: { backgroundColor: 'rgba(44,62,80,0.1)', color: '#2C3E50', border: '1px solid rgba(44,62,80,0.2)' },
};

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

    function deleteUser(u) {
        if (u.user_id === currentUserId) return;
        if (!confirm(`Delete user "${u.full_name}"?`)) return;
        router.delete(`/user-management/${u.user_id}`);
    }

    function toggleStatus(u) {
        if (u.user_id === currentUserId) {
            alert('You cannot change your own status.');
            return;
        }
        router.post(`/user-management/${u.user_id}/toggle-status`, {}, { preserveScroll: true });
    }

    return (
        <AuthenticatedLayout>
            <Head title="User Management" />

            {/* ✅ CORRECT: Container with padding and max-width */}
            <>
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
                    <StatCard label="Active Users" value={stats.activeUsers} color="text-success-green" />
                    <StatCard label="Inactive Users" value={stats.inactiveUsers} color="text-warning-orange" />
                    <StatCard label="Admins" value={stats.adminCount} color="text-burnt-rose" />
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
                        <button type="submit" className="rounded-lg border border-gray-300 text-sm px-4 py-2">
                            Search
                        </button>
                    </form>

                    <button
                        onClick={openAdd}
                        className="rounded-lg bg-burnt-rose text-white text-sm font-medium px-4 py-2 hover:opacity-90 whitespace-nowrap"
                    >
                        + Add User
                    </button>
                </div>

                {showForm && (
                    <form onSubmit={submitForm} className="bg-white rounded-xl border border-gray-100 p-5 space-y-3" encType="multipart/form-data">
                        <h3 className="font-medium text-charcoal-blue">{editingId ? 'Edit User' : 'Add User'}</h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                                <input
                                    className="w-full rounded-lg border-gray-300 text-sm"
                                    placeholder="Full name *"
                                    value={form.full_name}
                                    onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                                    required
                                />
                                {errors.full_name && <p className="text-red-500 text-xs mt-1">{errors.full_name}</p>}
                            </div>
                            
                            <div>
                                <input
                                    type="email"
                                    className="w-full rounded-lg border-gray-300 text-sm"
                                    placeholder="Email *"
                                    value={form.email}
                                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                                    required
                                />
                                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                            </div>
                            
                            <div>
                                <input
                                    type="password"
                                    className="w-full rounded-lg border-gray-300 text-sm"
                                    placeholder={editingId ? 'New password (leave blank to keep current)' : 'Password * (min. 6 characters)'}
                                    value={form.password}
                                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                                    required={!editingId}
                                    minLength={6}
                                />
                                {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
                            </div>
                            
                            <div>
                                <select
                                    className="w-full rounded-lg border-gray-300 text-sm"
                                    value={form.role}
                                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                                    required
                                >
                                    <option value="">Select Role *</option>
                                    <option value="admin">Admin</option>
                                    <option value="pharmacist">Pharmacist</option>
                                    <option value="assistant">Assistant</option>
                                </select>
                                {errors.role && <p className="text-red-500 text-xs mt-1">{errors.role}</p>}
                            </div>
                            
                            <div>
                                <select
                                    className="w-full rounded-lg border-gray-300 text-sm"
                                    value={form.status}
                                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                                    required
                                >
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                </select>
                                {errors.status && <p className="text-red-500 text-xs mt-1">{errors.status}</p>}
                            </div>
                            
                            <div>
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="text-sm"
                                    onChange={(e) => setForm({ ...form, profile_image: e.target.files[0] || null })}
                                />
                                <p className="text-xs text-gray-400 mt-1">Optional profile image (max 2MB)</p>
                                {errors.profile_image && <p className="text-red-500 text-xs mt-1">{errors.profile_image}</p>}
                            </div>
                        </div>
                        
                        <div className="flex gap-2 pt-2">
                            <button type="submit" className="rounded-lg bg-success-green text-white text-sm px-4 py-2 hover:opacity-90">
                                {editingId ? 'Update User' : 'Create User'}
                            </button>
                            <button 
                                type="button" 
                                onClick={() => { setShowForm(false); setErrors({}); }} 
                                className="rounded-lg border border-gray-300 text-sm px-4 py-2"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                )}

                <div className="bg-white rounded-xl border border-gray-100 overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-left border-b border-gray-100 text-charcoal-blue">
                                <th className="p-3">Name</th><th>Email</th><th>Role</th><th>Status</th><th>Joined</th><th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((u) => (
                                <tr key={u.user_id} className="border-b border-gray-50">
                                    <td className="p-3 flex items-center gap-2">
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
                                    <td>{u.email}</td>
                                    <td>
                                        <span
                                            className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold capitalize"
                                            style={ROLE_STYLES[u.role] || {}}
                                        >
                                            {u.role}
                                        </span>
                                    </td>
                                    <td>
                                        <button
                                            onClick={() => toggleStatus(u)}
                                            className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold text-white"
                                            style={{ backgroundColor: u.status === 'active' ? '#2E7D64' : '#E67E22' }}
                                        >
                                            {u.status}
                                        </button>
                                    </td>
                                    <td>{new Date(u.created_at).toLocaleDateString()}</td>
                                    <td className="space-x-2 text-right pr-3">
                                        <button onClick={() => openEdit(u)} className="text-burnt-rose text-xs font-medium">
                                            Edit
                                        </button>
                                        {u.user_id !== currentUserId && (
                                            <button onClick={() => deleteUser(u)} className="text-critical-red text-xs font-medium">
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
            </>
        </AuthenticatedLayout>
    );
}

function StatCard({ label, value, color }) {
    return (
        <div className="bg-white rounded-xl border border-gray-100 p-4">
            <div className="text-xs uppercase tracking-wide text-charcoal-blue opacity-60">{label}</div>
            <div className={`text-2xl font-bold mt-1 ${color}`}>{value}</div>
        </div>
    );
}