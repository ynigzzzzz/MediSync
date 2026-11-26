import { useEffect } from "react";
import { Head } from "@inertiajs/react";
import HistoryTable from "@/Pages/TransactionHistory/Partials/HistoryTable";

export default function Print({
    transactions = [],
    filters = {},
    generatedAt,
}) {
    useEffect(() => {
        const frame = window.requestAnimationFrame(() => {
            window.requestAnimationFrame(() => window.print());
        });

        return () => window.cancelAnimationFrame(frame);
    }, []);

    const filterLabels = [];

    if (filters.search) filterLabels.push(`Search: "${filters.search}"`);
    if (filters.type && filters.type !== "all")
        filterLabels.push(`Type: ${filters.type}`);
    if (filters.user && filters.user !== "all")
        filterLabels.push(`User ID: ${filters.user}`);
    if (filters.date_from) filterLabels.push(`From: ${filters.date_from}`);
    if (filters.date_to) filterLabels.push(`To: ${filters.date_to}`);

    return (
        <>
            <Head title="Print Transaction History">
                <style>{`
                    @page {
                        size: landscape;
                        margin: 12mm;
                    }

                    @media print {
                        html, body {
                            background: white !important;
                            print-color-adjust: exact;
                            -webkit-print-color-adjust: exact;
                        }

                        .print-actions {
                            display: none !important;
                        }

                        .print-page {
                            width: 100%;
                            max-width: none;
                            margin: 0;
                            padding: 0;
                        }

                        .print-area {
                            overflow: visible !important;
                            border: 0 !important;
                            box-shadow: none !important;
                        }

                        .print-area > div {
                            overflow: visible !important;
                        }

                        .print-area table {
                            width: 100%;
                            min-width: 0 !important;
                            border-collapse: collapse;
                            font-size: 9px;
                        }

                        .print-area thead {
                            display: table-header-group;
                        }

                        .print-area tr {
                            break-inside: avoid;
                            page-break-inside: avoid;
                        }

                        .print-area th,
                        .print-area td {
                            padding: 5px 4px !important;
                            border-bottom: 1px solid lightgray;
                        }
                    }
                `}</style>
            </Head>

            <main className="print-page mx-auto max-w-[1400px] bg-white p-6 text-gray-900">
                <div className="mb-5 flex items-start justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold">
                            MediSync — Transaction History
                        </h1>
                        <p className="mt-1 text-sm text-gray-500">
                            Generated: {generatedAt}
                        </p>
                        <p className="mt-1 text-xs text-gray-500">
                            {filterLabels.length
                                ? `Filters: ${filterLabels.join(" · ")}`
                                : "Filters: All transactions"}
                        </p>
                        <p className="mt-1 text-xs text-gray-500">
                            {transactions.length.toLocaleString()}{" "}
                            transaction(s)
                        </p>
                    </div>

                    <div className="print-actions flex gap-2">
                        <button
                            type="button"
                            onClick={() => window.print()}
                            className="rounded-full bg-gray-900 px-4 py-2 text-sm font-semibold text-white"
                        >
                            <i className="fas fa-print mr-2" />
                            Print
                        </button>
                        <button
                            type="button"
                            onClick={() => window.close()}
                            className="rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700"
                        >
                            Close
                        </button>
                    </div>
                </div>

                <HistoryTable
                    transactions={transactions}
                    showPagination={false}
                />
            </main>
        </>
    );
}
