import { useState } from "react";
import { Head, router, usePage } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import StatCard from "@/Components/StatCard";
import ConfirmDialog from "@/Components/ConfirmDialog";
import MedicineFormModal from "@/Components/MedicineFormModal";
import AddMedicineForm from "./Partials/AddMedicineForm";
import MedicineTables from "./Partials/MedicineTables";

export default function Index({
    medicines,
    stats,
    activeFilter,
    expiringBatches,
    attention = [],
}) {
    const { auth } = usePage().props;
    const canEdit = auth.user.role !== "assistant";

    const [showAddForm, setShowAddForm] = useState(false);
    const [editingMedicine, setEditingMedicine] = useState(null);
    const [pendingDelete, setPendingDelete] = useState(null);
    const [selectedBatches, setSelectedBatches] = useState([]);

    const isExpiringView =
        activeFilter === "expiring" || activeFilter === "expired";

    function applyFilter(filter) {
        router.get(
            "/medicine-list",
            { filter },
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
                    applyFilter("all");
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
                {canEdit && !isExpiringView && (
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
                    onClick={() => applyFilter("all")}
                    active={activeFilter === "all"}
                />
                <StatCard
                    label="Low Stock"
                    value={stats.lowstock}
                    icon="fa-triangle-exclamation"
                    tone="warning"
                    onClick={() => applyFilter("lowstock")}
                    active={activeFilter === "lowstock"}
                />
                <StatCard
                    label="Out of Stock"
                    value={stats.outofstock}
                    icon="fa-circle-xmark"
                    tone="danger"
                    onClick={() => applyFilter("outofstock")}
                    active={activeFilter === "outofstock"}
                />
                <StatCard
                    label="Expiring (30D)"
                    value={stats.expiring}
                    icon="fa-hourglass-half"
                    tone="warning"
                    onClick={() => applyFilter("expiring")}
                    active={activeFilter === "expiring"}
                />
                <StatCard
                    label="Expired"
                    value={stats.expired}
                    icon="fa-ban"
                    tone="danger"
                    onClick={() => applyFilter("expired")}
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
                                    />
                                    {a.message}
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {showAddForm && (
                <AddMedicineForm onClose={() => setShowAddForm(false)} />
            )}

            <MedicineTables
                medicines={medicines}
                expiringBatches={expiringBatches}
                activeFilter={activeFilter}
                canEdit={canEdit}
                onEdit={setEditingMedicine}
                onDelete={setPendingDelete}
                selectedBatches={selectedBatches}
                toggleBatch={toggleBatch}
                confirmDispose={confirmDispose}
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
                        ? `"${pendingDelete.generic_name}" will be permanently removed from the catalog.`
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
