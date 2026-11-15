import { Head } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import StatCard from "@/Components/StatCard";
import HistoryFilters from "./Partials/HistoryFilters";
import HistoryTable from "./Partials/HistoryTable";

export default function Index({
    transactions,
    totalFilteredRecords,
    stockInTotal,
    stockOutTotal,
    totalTransactions,
    users,
    filters,
}) {
    const netChange = stockInTotal - stockOutTotal;

    return (
        <AuthenticatedLayout>
            <Head title="Transaction History" />

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
                        Transaction History
                    </h1>
                    <p className="text-[13px] text-gray-500">
                        All stock-in and stock-out activity across the system.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <StatCard
                    label="Total Transactions"
                    value={totalTransactions}
                    icon="fa-receipt"
                />
                <StatCard
                    label="Stock-In (Month)"
                    value={stockInTotal}
                    icon="fa-arrow-down"
                    tone="success"
                />
                <StatCard
                    label="Stock-Out (Month)"
                    value={stockOutTotal}
                    icon="fa-arrow-up"
                    tone="danger"
                />
                <StatCard
                    label="Net Change"
                    value={netChange > 0 ? `+${netChange}` : netChange}
                    icon="fa-chart-line"
                    tone={netChange < 0 ? "danger" : "neutral"}
                />
            </div>

            <HistoryFilters users={users} initialFilters={filters} />

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-3">
                <p className="text-[13px] text-gray-500 font-medium">
                    {totalFilteredRecords.toLocaleString()} record(s) match
                    filters.
                </p>
                <div className="flex gap-2">
                    <a
                        href="/transaction-history/export"
                        className="rounded-full border border-gray-200 bg-white text-gray-700 text-[13px] font-semibold px-4 py-2 hover:bg-gray-50 transition-colors shadow-sm flex items-center gap-2"
                    >
                        <i className="fas fa-file-csv text-gray-400" /> Export
                        CSV
                    </a>
                    <button
                        onClick={() => window.print()}
                        className="rounded-full bg-gray-900 text-white text-[13px] font-semibold px-4 py-2 hover:bg-black transition-colors shadow-sm flex items-center gap-2"
                    >
                        <i className="fas fa-print" /> Print
                    </button>
                </div>
            </div>

            <HistoryTable transactions={transactions} />
        </AuthenticatedLayout>
    );
}
