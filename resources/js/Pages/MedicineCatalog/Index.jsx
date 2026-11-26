import { useState, useEffect } from "react";
import { Head, router, usePage } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import StatCard from "@/Components/StatCard";
import ConfirmDialog from "@/Components/ConfirmDialog";
import MedicineFormModal from "@/Components/MedicineFormModal";
import AddMedicineForm from "./Partials/AddMedicineForm";
import MedicineTables from "./Partials/MedicineTables";

export default function Index({
    medicines,
    batches,
    stats,
    activeFilter,
    attention = [],
    filters = {},
}) {
    const { auth, errors } = usePage().props;
    const role = auth.user?.role;
    const canEdit = ["admin", "pharmacist"].includes(role);
    const canDelete = role === "admin";

    const [showAddForm, setShowAddForm] = useState(false);
    const [editingMedicine, setEditingMedicine] = useState(null);
    const [pendingDelete, setPendingDelete] = useState(null);
    const [selectedBatches, setSelectedBatches] = useState([]);

    const [search, setSearch] = useState(filters?.search || "");
    const [category, setCategory] = useState(filters?.category || "");
    const [type, setType] = useState(filters?.type || "");

    useEffect(() => {
        setSearch(filters?.search ?? "");
        setCategory(filters?.category ?? "");
        setType(filters?.type ?? "");
    }, [filters?.search, filters?.category, filters?.type]);

    const isFilteredView = activeFilter !== "all";

    function applyFilters(e) {
        if (e) e.preventDefault();
        router.get(
            "/medicine-list",
            { filter: activeFilter, search, category, type },
            { preserveScroll: true, preserveState: true },
        );
    }

    function clearFilters() {
        setSearch("");
        setCategory("");
        setType("");
        router.get(
            "/medicine-list",
            { filter: activeFilter, search: "", category: "", type: "" },
            { preserveScroll: true, preserveState: true },
        );
    }

    function confirmDelete(reason) {
        router.delete(`/medicine-list/${pendingDelete.medicine_id}`, {
            data: { reason },
            preserveScroll: true,
            onFinish: () => setPendingDelete(null),
        });
    }

    function toggleBatch(id) {
        setSelectedBatches((prev) =>
            prev.includes(id) ? prev.filter((b) => b !== id) : [...prev, id],
        );
    }

    function confirmDispose() {
        if (selectedBatches.length === 0) return;
        router.post(
            "/medicine-list/dispose",
            { batch_ids: selectedBatches },
            {
                onSuccess: () => {
                    setSelectedBatches([]);
                    applyFilters();
                },
            },
        );
    }

    return (
        <AuthenticatedLayout>
            <Head title="Medicine Catalog" />

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
                        Medicine Catalog
                    </h1>
                    <p className="text-[13px] text-gray-500">
                        Manage the master list of medicines, prices, and stock
                        levels.
                    </p>
                </div>
                {canEdit && !isFilteredView && (
                    <button
                        onClick={() => setShowAddForm(!showAddForm)}
                        className="rounded-full px-5 py-2 text-[14px] font-semibold bg-gray-900 text-white hover:bg-black transition-colors shadow-sm whitespace-nowrap"
                    >
                        {showAddForm ? "× Close Form" : "+ Add Medicine"}
                    </button>
                )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4 mb-4">
                <StatCard
                    label="Total"
                    value={stats.total}
                    icon="fa-capsules"
                    onClick={() =>
                        router.get("/medicine-list", { filter: "all" })
                    }
                    active={activeFilter === "all"}
                />
                <StatCard
                    label="Low Stock"
                    value={stats.lowstock}
                    icon="fa-triangle-exclamation"
                    tone="warning"
                    onClick={() =>
                        router.get("/medicine-list", { filter: "lowstock" })
                    }
                    active={activeFilter === "lowstock"}
                />
                <StatCard
                    label="Out of Stock"
                    value={stats.outofstock}
                    icon="fa-circle-xmark"
                    tone="danger"
                    onClick={() =>
                        router.get("/medicine-list", { filter: "outofstock" })
                    }
                    active={activeFilter === "outofstock"}
                />
                <StatCard
                    label="Expiring (30D)"
                    value={stats.expiring}
                    icon="fa-hourglass-half"
                    tone="warning"
                    onClick={() =>
                        router.get("/medicine-list", { filter: "expiring" })
                    }
                    active={activeFilter === "expiring"}
                />
                <StatCard
                    label="Expired"
                    value={stats.expired ?? 0}
                    icon="fa-ban"
                    tone="danger"
                    onClick={() =>
                        router.get("/medicine-list", { filter: "expired" })
                    }
                    active={activeFilter === "expired"}
                />
            </div>

            {attention.length > 0 && (
                <div className="mb-4 bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-[16px] text-[13px] shadow-sm">
                    <h4 className="font-semibold mb-1">
                        <i className="fas fa-triangle-exclamation mr-2" />
                        Attention Required
                    </h4>
                    <ul className="space-y-1">
                        {attention.map((a, i) => (
                            <li key={i}>
                                <button
                                    onClick={() => router.get(a.link)}
                                    className="text-left hover:underline font-medium"
                                >
                                    <i
                                        className={`fas ${a.icon} mr-1.5 opacity-70`}
                                    />{" "}
                                    {a.message}
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {(errors?.delete || errors?.generic_name || errors?.message) && (
                <div className="mb-4 bg-red-50 text-red-700 border border-red-200 rounded-xl p-3 text-[13px] font-medium flex items-start gap-2">
                    <i className="fas fa-circle-exclamation mt-0.5" />
                    <span>
                        {errors.delete || errors.generic_name || errors.message}
                    </span>
                </div>
            )}

            {/* Retained State Design */}
            <div className={showAddForm ? "block" : "hidden"}>
                <AddMedicineForm
                    onClose={() => setShowAddForm(false)}
                    types={stats.types ?? []}
                    categories={stats.categories ?? []}
                />
            </div>

            <MedicineTables
                medicines={medicines}
                batches={batches}
                activeFilter={activeFilter}
                canEdit={canEdit}
                canDelete={canDelete}
                onEdit={setEditingMedicine}
                onDelete={setPendingDelete}
                selectedBatches={selectedBatches}
                toggleBatch={toggleBatch}
                confirmDispose={confirmDispose}
                search={search}
                setSearch={setSearch}
                category={category}
                setCategory={setCategory}
                type={type}
                setType={setType}
                applyFilters={applyFilters}
                clearFilters={clearFilters}
                categoriesList={stats.categories}
                typesList={stats.types}
            />

            <MedicineFormModal
                open={!!editingMedicine}
                onOpenChange={(open) => !open && setEditingMedicine(null)}
                medicine={editingMedicine}
                types={stats.types ?? []}
                categories={stats.categories ?? []}
            />

            <ConfirmDialog
                open={!!pendingDelete}
                onOpenChange={(o) => !o && setPendingDelete(null)}
                title="Delete this medicine?"
                description={
                    pendingDelete
                        ? `"${pendingDelete.generic_name}" will be permanently removed.`
                        : ""
                }
                confirmLabel="Delete"
                tone="danger"
                withReason={true}
                onConfirmWithReason={confirmDelete}
            />
        </AuthenticatedLayout>
    );
}
