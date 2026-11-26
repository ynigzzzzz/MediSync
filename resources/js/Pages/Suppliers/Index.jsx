import { useState } from "react";
import { Head, router, useForm } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import StatCard from "@/Components/StatCard";
import ConfirmDialog from "@/Components/ConfirmDialog";
import Modal from "@/Components/Modal";
import AddSupplierForm from "./Partials/AddSupplierForm";
import SupplierTable from "./Partials/SupplierTable";

const inputCls =
    "w-full rounded-xl border border-transparent bg-[#F2F2F7] px-3 py-2.5 text-[14px] text-gray-900 focus:border-[#FF4D79] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF4D79]/20 transition-all";

export default function Index({ suppliers, stats, filters = {} }) {
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState(null);
    const [pendingDelete, setPendingDelete] = useState(null);

    const [search, setSearch] = useState(filters?.search || "");
    const [statusFilter, setStatusFilter] = useState(filters?.status || "all");

    const applyFilters = (e) => {
        e.preventDefault();
        router.get(
            "/suppliers",
            { search, status: statusFilter },
            { preserveState: true, preserveScroll: true },
        );
    };

    const clearFilters = () => {
        setSearch("");
        setStatusFilter("all");
        router.get("/suppliers");
    };

    const editForm = useForm({
        name: "",
        contact_person: "",
        phone: "",
        email: "",
        address: "",
        status: "active",
    });

    const openEdit = (supplier) => {
        setEditingSupplier(supplier);
        editForm.setData({
            name: supplier.name,
            contact_person: supplier.contact_person || "",
            phone: supplier.phone || "",
            email: supplier.email || "",
            address: supplier.address || "",
            status: supplier.status,
        });
    };

    const submitEdit = (e) => {
        e.preventDefault();
        editForm.put(`/suppliers/${editingSupplier.supplier_id}`, {
            onSuccess: () => {
                setEditingSupplier(null);
                editForm.reset();
            },
        });
    };

    const confirmDelete = (reason) => {
        router.delete(`/suppliers/${pendingDelete.supplier_id}`, {
            data: { reason },
            onFinish: () => setPendingDelete(null),
        });
    };

    return (
        <AuthenticatedLayout>
            <Head title="Suppliers" />

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
                        Suppliers
                    </h1>
                    <p className="text-[13px] text-gray-500">
                        Manage vendor information and contact details.
                    </p>
                </div>
                <button
                    onClick={() => setShowAddForm(!showAddForm)}
                    className="rounded-full px-5 py-2 text-[14px] font-semibold bg-gray-900 text-white hover:bg-black transition-colors shadow-sm whitespace-nowrap"
                >
                    {showAddForm ? "× Close Form" : "+ Add Supplier"}
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <StatCard
                    label="Total Suppliers"
                    value={stats.total}
                    icon="fa-truck"
                />
                <StatCard
                    label="Active"
                    value={stats.active}
                    icon="fa-check-circle"
                    tone="success"
                />
                <StatCard
                    label="Inactive"
                    value={stats.inactive}
                    icon="fa-ban"
                    tone="danger"
                />
            </div>

            {/* Retained State Design */}
            <div className={showAddForm ? "block" : "hidden"}>
                <AddSupplierForm onClose={() => setShowAddForm(false)} />
            </div>

            <SupplierTable
                suppliers={suppliers}
                onEdit={openEdit}
                onDelete={setPendingDelete}
                search={search}
                setSearch={setSearch}
                statusFilter={statusFilter}
                setStatusFilter={setStatusFilter}
                applyFilters={applyFilters}
                clearFilters={clearFilters}
            />

            <Modal
                show={!!editingSupplier}
                onClose={() => setEditingSupplier(null)}
                maxWidth="md"
            >
                <div className="p-6">
                    <h2 className="text-lg font-semibold mb-4">
                        Edit Supplier
                    </h2>
                    <form onSubmit={submitEdit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">
                                Name *
                            </label>
                            <input
                                type="text"
                                className={inputCls}
                                value={editForm.data.name}
                                onChange={(e) =>
                                    editForm.setData("name", e.target.value)
                                }
                                required
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">
                                    Contact Person
                                </label>
                                <input
                                    type="text"
                                    className={inputCls}
                                    value={editForm.data.contact_person}
                                    onChange={(e) =>
                                        editForm.setData(
                                            "contact_person",
                                            e.target.value,
                                        )
                                    }
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">
                                    Phone
                                </label>
                                <input
                                    type="text"
                                    className={inputCls}
                                    value={editForm.data.phone}
                                    onChange={(e) =>
                                        editForm.setData(
                                            "phone",
                                            e.target.value,
                                        )
                                    }
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">
                                Email
                            </label>
                            <input
                                type="email"
                                className={inputCls}
                                value={editForm.data.email}
                                onChange={(e) =>
                                    editForm.setData("email", e.target.value)
                                }
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">
                                Status
                            </label>
                            <select
                                className={inputCls}
                                value={editForm.data.status}
                                onChange={(e) =>
                                    editForm.setData("status", e.target.value)
                                }
                            >
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
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
                title="Delete this supplier?"
                description="Are you sure? This action cannot be undone."
                confirmLabel="Delete"
                tone="danger"
                withReason={true}
                onConfirmWithReason={confirmDelete}
            />
        </AuthenticatedLayout>
    );
}
