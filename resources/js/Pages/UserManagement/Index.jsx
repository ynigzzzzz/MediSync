import { useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import StatCard from '@/Components/StatCard';
import Badge from '@/Components/Badge';
import ConfirmDialog from '@/Components/ConfirmDialog';
import Pagination from '@/Components/Pagination';

const emptyForm = { full_name: '', email: '', password: '', role: 'pharmacist', status: 'active', profile_image: null };
const ROLE_TONE = { admin: 'rose', pharmacist: 'success', assistant: 'neutral' };
const inputCls = "w-full rounded-xl border border-transparent bg-[#F2F2F7] px-3 py-2 text-[14px] text-gray-900 placeholder-gray-400 focus:border-gray-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-gray-100 transition-all";

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
        setForm(emptyForm); setEditingId(null); setShowForm(true); setErrors({});
    }

    function openEdit(u) {
        setForm({ full_name: u.full_name, email: u.email, password: '', role: u.role, status: u.status, profile_image: null });
        setEditingId(u.user_id); setShowForm(true); setErrors({});
    }

    function submitForm(e) {
        e.preventDefault();
        setErrors({});
        const data = new FormData();
        Object.entries(form).forEach(([key, value]) => {
            if (value !== null && value !== '' && value !== undefined) data.append(key, value);
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
        router.delete(`/user-management/${pendingDelete.user_id}`, { onFinish: () => setPendingDelete(null) });
    }

    function toggleStatus(u) {
        if (u.user_id === currentUserId) { setShowSelfStatusInfo(true); return; }
        router.post(`/user-management/${u.user_id}/toggle-status`, {}, { preserveScroll: true });
    }

    return (
        <AuthenticatedLayout>
            <Head title="User Management" />

            <div className="mb-5">
                <h1 className="text-2xl font-semibold tracking-tight text-gray-900">User Management</h1>
                <p className="text-[13px] text-gray-500">Manage system users, roles, and access permissions.</p>
            </div>

            {message && <div className="mb-4 bg-green-50 text-green-700 border border-green-200 rounded-xl p-3 text-[13px] font-medium">{message}</div>}
            {errors?.message && <div className="mb-4 bg-red-50 text-red-700 border border-red-200 rounded-xl p-3 text-[13px] font-medium">{errors.message}</div>}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                <StatCard icon="fa-user-check" label="Active Users" value={stats.activeUsers} tone="success" />
                <StatCard icon="fa-user-xmark" label="Inactive Users" value={stats.inactiveUsers} tone="warning" />
                <StatCard icon="fa-user-shield" label="Admins" value={stats.adminCount} tone="rose" />
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
                <form onSubmit={applyFilters} className="flex flex-col sm:flex-row gap-2 flex-1 w-full">
                    <input className={`${inputCls} flex-1`} placeholder="Search name or email..." value={search} onChange={(e) => setSearch(e.target.value)} />
                    <select className={`${inputCls} sm:w-40`} value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
                        <option value="all">All Roles</option>
                        <option value="admin">Admin</option>
                        <option value="pharmacist">Pharmacist</option>
                        <option value="assistant">Assistant</option>
                    </select>
                    <button type="submit" className="rounded-full bg-gray-900 text-white text-[13px] font-semibold px-5 py-2 hover:bg-black transition-colors shadow-sm">Search</button>
                </form>
                <button onClick={openAdd} className="rounded-full px-5 py-2 text-[13px] font-semibold bg-[#FF4D79] text-white hover:bg-[#E63E66] transition-colors shadow-sm whitespace-nowrap">
                    + Add User
                </button>
            </div>

            {showForm && (
                <div className="bg-white rounded-[16px] shadow-sm border border-gray-100 p-5 mb-4 space-y-4">
                    <h3 className="font-semibold text-gray-900 text-[15px]">{editingId ? 'Edit User' : 'Add User'}</h3>
                    <form onSubmit={submitForm} className="space-y-4" encType="multipart/form-data">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[12px] font-semibold text-gray-700 mb-1">Full Name<span className="text-critical-red">*</span></label>
                                <input type="text" className={inputCls} value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required />
                                {errors.full_name && <p className="text-critical-red text-[11px] mt-1">{errors.full_name}</p>}
                            </div>
                            <div>
                                <label className="block text-[12px] font-semibold text-gray-700 mb-1">Email Address<span className="text-critical-red">*</span></label>
                                <input type="email" className={inputCls} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
                                {errors.email && <p className="text-critical-red text-[11px] mt-1">{errors.email}</p>}
                            </div>
                            <div>
                                <label className="block text-[12px] font-semibold text-gray-700 mb-1">Password {editingId ? '(Leave blank to keep)' : ''}{!editingId && <span className="text-critical-red">*</span>}</label>
                                <input type="password" className={inputCls} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required={!editingId} minLength={6} />
                                {errors.password && <p className="text-critical-red text-[11px] mt-1">{errors.password}</p>}
                            </div>
                            <div>
                                <label className="block text-[12px] font-semibold text-gray-700 mb-1">Role<span className="text-critical-red">*</span></label>
                                <select className={inputCls} value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} required>
                                    <option value="admin">Admin</option>
                                    <option value="pharmacist">Pharmacist</option>
                                    <option value="assistant">Assistant</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-[12px] font-semibold text-gray-700 mb-1">Status<span className="text-critical-red">*</span></label>
                                <select className={inputCls} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} required>
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-[12px] font-semibold text-gray-700 mb-1">Profile Image (Optional)</label>
                                <input type="file" accept="image/*" className="w-full text-[13px] text-gray-500 file:mr-3 file:py-1.5 file:px-4 file:rounded-full file:border-0 file:text-[12px] file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200 transition-colors"
                                    onChange={(e) => setForm({ ...form, profile_image: e.target.files[0] })} />
                                {errors.profile_image && <p className="text-critical-red text-[11px] mt-1">{errors.profile_image}</p>}
                            </div>
                        </div>
                        <div className="flex gap-2 pt-2">
                            <button type="submit" className="rounded-full bg-gray-900 text-white font-semibold text-[13px] px-5 py-2 hover:bg-black transition-colors shadow-sm">{editingId ? 'Update User' : 'Create User'}</button>
                            <button type="button" onClick={() => { setShowForm(false); setErrors({}); }} className="rounded-full border border-gray-200 text-gray-700 font-semibold text-[13px] px-5 py-2 hover:bg-gray-50 transition-colors">Cancel</button>
                        </div>
                    </form>
                </div>
            )}

            <div className="bg-white rounded-[16px] shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto w-full">
                    <table className="w-full min-w-[800px] text-left text-[13px]">
                        <thead>
                            <tr className="border-b border-gray-100">
                                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">Name</th>
                                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">Email</th>
                                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">Role</th>
                                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">Status</th>
                                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">Joined</th>
                                <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-gray-500">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {rows.map((u) => (
                                <tr key={u.user_id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-4 py-3 flex items-center gap-3 text-gray-900 font-medium">
                                        {u.profile_image ? (
                                            <img src={`/storage/${u.profile_image}`} className="w-7 h-7 rounded-full object-cover shadow-sm" alt="" />
                                        ) : (
                                            <div className="w-7 h-7 rounded-full bg-cherry-blossom flex items-center justify-center text-[11px] font-bold text-burnt-rose shadow-sm">
                                                {u.full_name.charAt(0)}
                                            </div>
                                        )}
                                        {u.full_name}
                                        {u.user_id === currentUserId && <span className="text-[11px] font-normal text-gray-400">(You)</span>}
                                    </td>
                                    <td className="px-4 py-3 text-gray-600">{u.email}</td>
                                    <td className="px-4 py-3"><Badge tone={ROLE_TONE[u.role] ?? 'neutral'} outline>{u.role}</Badge></td>
                                    <td className="px-4 py-3">
                                        <button onClick={() => toggleStatus(u)} className="hover:opacity-80 transition-opacity">
                                            <Badge tone={u.status === 'active' ? 'success' : 'warning'} outline>{u.status}</Badge>
                                        </button>
                                    </td>
                                    <td className="px-4 py-3 text-gray-600">{new Date(u.created_at).toLocaleDateString()}</td>
                                    <td className="px-4 py-3 text-right space-x-3">
                                        <button onClick={() => openEdit(u)} className="text-[#FF4D79] text-[13px] font-semibold hover:underline">Edit</button>
                                        {u.user_id !== currentUserId && (
                                            <button onClick={() => setPendingDelete(u)} className="text-critical-red text-[13px] font-semibold hover:underline">Delete</button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {rows.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No users found.</td></tr>}
                        </tbody>
                    </table>
                </div>
                <Pagination meta={users} label="users" />
            </div>

            <ConfirmDialog open={!!pendingDelete} onOpenChange={(o) => !o && setPendingDelete(null)} title="Delete this user?" description={pendingDelete ? `"${pendingDelete.full_name}" will lose access immediately.` : ''} confirmLabel="Delete" tone="danger" onConfirm={confirmDelete} />
            <ConfirmDialog open={showSelfStatusInfo} onOpenChange={setShowSelfStatusInfo} title="Action not allowed" description="You cannot change your own account status." />
        </AuthenticatedLayout>
    );
}