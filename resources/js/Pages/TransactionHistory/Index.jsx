import { Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import StatCard from '@/Components/StatCard';
import HistoryFilters from '@/Pages/TransactionHistory/Partials/HistoryFilters';
import HistoryTable from '@/Pages/TransactionHistory/Partials/HistoryTable';

export default function Index({
    transactions,
    totalFilteredRecords = 0,
    stockInTotal = 0,
    stockOutTotal = 0,
    totalTransactions = 0,
    users = [],
    filters = {},
    canPrint = false,
    canExport = false,
}) {
    const queryString = new URLSearchParams(
        Object.entries(filters).filter(([, value]) => value !== null && value !== undefined && value !== ''),
    ).toString();

    const exportCsv = () => {
        window.location.href = `${route('transaction-history.export')}${queryString ? `?${queryString}` : ''}`;
    };

    const printReport = () => {
        const printUrl = `${route('transaction-history.print')}${queryString ? `?${queryString}` : ''}`;
        window.open(printUrl, '_blank', 'noopener,noreferrer');
    };

    return (
        <AuthenticatedLayout>
            <Head title="Transaction History" />

            <div className="no-print mb-5 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
                        Transaction History
                    </h1>
                    <p className="text-[13px] text-gray-500">
                        All stock-in and stock-out activity across the system.
                    </p>
                </div>
            </div>

            <div className="no-print mb-4 grid grid-cols-2 gap-4 md:grid-cols-4">
                <StatCard
                    icon="fa-receipt"
                    label="Total Transactions"
                    value={Number(totalTransactions).toLocaleString()}
                />
                <StatCard
                    icon="fa-arrow-down"
                    label="Stock-In (Month)"
                    value={Number(stockInTotal).toLocaleString()}
                    tone="success"
                />
                <StatCard
                    icon="fa-arrow-up"
                    label="Stock-Out (Month)"
                    value={Number(stockOutTotal).toLocaleString()}
                    tone="rose"
                />
                <StatCard
                    icon="fa-chart-line"
                    label="Net Change"
                    value={(Number(stockInTotal) - Number(stockOutTotal)).toLocaleString()}
                />
            </div>

            <div className="no-print mb-4">
                <HistoryFilters users={users} initialFilters={filters} />
            </div>

            <div className="no-print mb-4 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
                <p className="text-[13px] font-medium text-gray-500">
                    {Number(totalFilteredRecords).toLocaleString()} record(s) match filters.
                </p>

                {(canExport || canPrint) && (
                    <div className="flex gap-2">
                        {canExport && (
                            <button
                                type="button"
                                onClick={exportCsv}
                                className="rounded-full border border-gray-200 px-4 py-2 text-[13px] font-semibold text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
                            >
                                <i className="fas fa-file-csv mr-1.5 text-gray-400" />
                                Export CSV
                            </button>
                        )}

                        {canPrint && (
                            <button
                                type="button"
                                onClick={printReport}
                                className="rounded-full bg-gray-900 px-4 py-2 text-[13px] font-semibold text-white shadow-sm transition-colors hover:bg-black"
                            >
                                <i className="fas fa-print mr-1.5" />
                                Print
                            </button>
                        )}
                    </div>
                )}
            </div>

            <HistoryTable transactions={transactions} />
        </AuthenticatedLayout>
    );
}
