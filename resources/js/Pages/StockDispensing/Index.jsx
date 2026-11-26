import { useState } from "react";
import { Head, router, usePage } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import StatCard from "@/Components/StatCard";
import ConfirmDialog from "@/Components/ConfirmDialog";
import AddDispenseForm from "./Partials/AddDispenseForm";
import DispenseTable from "./Partials/DispenseTable";

export default function Index({
    medicines,
    stockOutRecords,
    alerts = [],
    stats,
    filters = {},
}) {
    const { auth, errors } = usePage().props;
    const canDelete = auth.user.role === "admin";

    const [showForm, setShowForm] = useState(false);
    const [pendingDelete, setPendingDelete] = useState(null);

    const [search, setSearch] = useState(filters?.search || "");
    const [dateFrom, setDateFrom] = useState(filters?.date_from || "");
    const [dateTo, setDateTo] = useState(filters?.date_to || "");

    const alertsList = Array.isArray(alerts) ? alerts : [];

    function applyFilters(e) {
        e.preventDefault();
        router.get(
            "/dispensing",
            { search, date_from: dateFrom, date_to: dateTo },
            { preserveState: true, preserveScroll: true },
        );
    }

    function clearFilters() {
        setSearch("");
        setDateFrom("");
        setDateTo("");
        router.get("/dispensing");
    }

    function confirmDelete(reason) {
        router.delete(`/dispensing/${pendingDelete}`, {
            data: { reason },
            onFinish: () => setPendingDelete(null),
        });
    }

    return (
        <AuthenticatedLayout>
            <Head title="Stock Dispensing" />

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
                        Stock Dispensing
                    </h1>
                    <p className="text-[13px] text-gray-500">
                        Process patient transactions, manage the cart, and
                        dispense medicines
                    </p>
                </div>
                <button
                    onClick={() => setShowForm((v) => !v)}
                    className="rounded-full px-5 py-2 text-[14px] font-semibold bg-gray-900 text-white hover:bg-black transition-colors shadow-sm whitespace-nowrap"
                >
                    {showForm ? "× Close Form" : "+ New Dispense"}
                </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <StatCard
                    icon="fa-triangle-exclamation"
                    label="Low Stock"
                    value={stats?.low_stock ?? 0}
                    tone="warning"
                    onClick={() => router.get("/medicine-list?filter=lowstock")}
                />
                <StatCard
                    icon="fa-circle-xmark"
                    label="Out of Stock"
                    value={stats?.out_of_stock ?? 0}
                    tone="danger"
                    onClick={() =>
                        router.get("/medicine-list?filter=outofstock")
                    }
                />
                <StatCard
                    icon="fa-hourglass-half"
                    label="Expiring (30d)"
                    value={stats?.expiring ?? 0}
                    tone="warning"
                    onClick={() => router.get("/medicine-list?filter=expiring")}
                />
                <StatCard
                    icon="fa-arrow-up"
                    label="Recent Dispenses"
                    value={stockOutRecords?.total ?? 0}
                />
            </div>

            {errors?.dispense && (
                <div className="mb-4 bg-red-50 text-red-700 border border-red-200 rounded-xl p-3 text-[13px] font-medium flex items-start gap-2">
                    <i className="fas fa-exclamation-circle mt-0.5" />
                    <span className="whitespace-pre-line">
                        {errors.dispense}
                    </span>
                </div>
            )}

            {alertsList.length > 0 && (
                <div className="mb-4 bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-[16px] text-[13px] shadow-sm">
                    <h4 className="font-semibold mb-1">
                        <i className="fas fa-triangle-exclamation mr-2" />
                        Attention Required
                    </h4>
                    <ul className="space-y-1">
                        {alertsList.map((a, i) => (
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

            <div className={showForm ? "block" : "hidden"}>
                <AddDispenseForm
                    medicines={medicines}
                    onClose={() => setShowForm(false)}
                />
            </div>

            <DispenseTable
                records={stockOutRecords}
                canDelete={canDelete}
                onDelete={setPendingDelete}
                search={search}
                setSearch={setSearch}
                dateFrom={dateFrom}
                setDateFrom={setDateFrom}
                dateTo={dateTo}
                setDateTo={setDateTo}
                applyFilters={applyFilters}
                clearFilters={clearFilters}
            />

            <ConfirmDialog
                open={pendingDelete !== null}
                onOpenChange={(o) => !o && setPendingDelete(null)}
                title="Delete this dispense record?"
                description="The dispensed quantity will be restored to stock."
                confirmLabel="Delete"
                tone="danger"
                withReason={true}
                onConfirmWithReason={confirmDelete}
            />
        </AuthenticatedLayout>
    );
}
