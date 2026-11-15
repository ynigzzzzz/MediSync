import { useState } from "react";
import { Head, router, useForm, usePage } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import StatCard from "@/Components/StatCard";
import ConfirmDialog from "@/Components/ConfirmDialog";
import Modal from "@/Components/Modal";
import AddUserForm from "./Partials/AddUserForm";
import UserTable from "./Partials/UserTable";

const inputCls =
    "w-full rounded-xl border border-transparent bg-[#F2F2F7] px-3 py-2.5 text-[14px] text-gray-900 focus:border-[#FF4D79] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF4D79]/20 transition-all";

export default function Index({ users, stats }) {
    const { auth } = usePage().props;

    const [showAddForm, setShowAddForm] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [pendingDelete, setPendingDelete] = useState(null);

    const editForm = useForm({
        full_name: "",
        email: "",
        password: "",
        role: "assistant",
        status: "active",
    });

    const openEdit = (user) => {
        setEditingUser(user);
        editForm.setData({
            full_name: user.full_name,
            email: user.email,
            password: "",
            role: user.role,
            status: user.status,
        });
    };

    const submitEdit = (e) => {
        e.preventDefault();
        editForm.put(`/user-management/${editingUser.user_id}`, {
            onSuccess: () => {
                setEditingUser(null);
                editForm.reset();
            },
        });
    };

    const toggleStatus = (user) => {
        if (confirm(`Change status for ${user.full_name}?`)) {
            router.post(`/user-management/${user.user_id}/toggle-status`);
        }
    };

    const confirmDelete = (reason) => {
        router.delete(`/user-management/${pendingDelete.user_id}`, {
            data: { reason },
            onFinish: () => setPendingDelete(null),
        });
    };

    return (
        <AuthenticatedLayout>
            <Head title="User Management" />

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
                        User Management
                    </h1>
                    <p className="text-[13px] text-gray-500">
                        Manage system access, roles, and account statuses.
                    </p>
                </div>
                <button
                    onClick={() => setShowAddForm(!showAddForm)}
                    className="rounded-full px-5 py-2 text-[14px] font-semibold bg-gray-900 text-white hover:bg-black transition-colors shadow-sm whitespace-nowrap"
                >
                    {showAddForm ? "× Close Form" : "+ Add User"}
                </button>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-4">
                <StatCard
                    label="Active Users"
                    value={stats.activeUsers}
                    icon="fa-users"
                    tone="success"
                />
                <StatCard
                    label="Inactive Users"
                    value={stats.inactiveUsers}
                    icon="fa-user-slash"
                    tone="danger"
                />
                <StatCard
                    label="Administrators"
                    value={stats.adminCount}
                    icon="fa-user-shield"
                    tone="warning"
                />
            </div>

            {showAddForm && (
                <AddUserForm onClose={() => setShowAddForm(false)} />
            )}

            <UserTable
                users={users}
                auth={auth}
                onEdit={openEdit}
                onDelete={setPendingDelete}
                onToggleStatus={toggleStatus}
            />

            <Modal
                show={!!editingUser}
                onClose={() => setEditingUser(null)}
                maxWidth="md"
            >
                <div className="p-6">
                    <h2 className="text-lg font-semibold mb-4">Edit User</h2>
                    <form onSubmit={submitEdit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">
                                Full Name *
                            </label>
                            <input
                                type="text"
                                className={inputCls}
                                value={editForm.data.full_name}
                                onChange={(e) =>
                                    editForm.setData(
                                        "full_name",
                                        e.target.value,
                                    )
                                }
                                required
                            />
                            {editForm.errors.full_name && (
                                <p className="text-red-500 text-xs mt-1">
                                    {editForm.errors.full_name}
                                </p>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">
                                Email *
                            </label>
                            <input
                                type="email"
                                className={inputCls}
                                value={editForm.data.email}
                                onChange={(e) =>
                                    editForm.setData("email", e.target.value)
                                }
                                required
                            />
                            {editForm.errors.email && (
                                <p className="text-red-500 text-xs mt-1">
                                    {editForm.errors.email}
                                </p>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">
                                New Password (leave blank to keep)
                            </label>
                            <input
                                type="password"
                                className={inputCls}
                                value={editForm.data.password}
                                onChange={(e) =>
                                    editForm.setData("password", e.target.value)
                                }
                            />
                            {editForm.errors.password && (
                                <p className="text-red-500 text-xs mt-1">
                                    {editForm.errors.password}
                                </p>
                            )}
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">
                                    Role
                                </label>
                                <select
                                    className={inputCls}
                                    value={editForm.data.role}
                                    onChange={(e) =>
                                        editForm.setData("role", e.target.value)
                                    }
                                >
                                    <option value="admin">Admin</option>
                                    <option value="pharmacist">
                                        Pharmacist
                                    </option>
                                    <option value="assistant">Assistant</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">
                                    Status
                                </label>
                                <select
                                    className={inputCls}
                                    value={editForm.data.status}
                                    onChange={(e) =>
                                        editForm.setData(
                                            "status",
                                            e.target.value,
                                        )
                                    }
                                >
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex justify-end pt-4">
                            <button
                                type="submit"
                                disabled={editForm.processing}
                                className="rounded-full bg-gray-900 text-white px-6 py-2 font-semibold hover:bg-black"
                            >
                                {editForm.processing
                                    ? "Saving..."
                                    : "Save Changes"}
                            </button>
                        </div>
                    </form>
                </div>
            </Modal>

            <ConfirmDialog
                open={!!pendingDelete}
                onOpenChange={(o) => !o && setPendingDelete(null)}
                title="Delete this user?"
                description="This user will be permanently removed from the system."
                confirmLabel="Delete"
                tone="danger"
                withReason={true}
                onConfirmWithReason={confirmDelete}
            />
        </AuthenticatedLayout>
    );
}
