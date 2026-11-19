import Pagination from '@/Components/Pagination';

export default function HistoryTable({
    transactions,
    showPagination = true,
}) {
    const rows = Array.isArray(transactions)
        ? transactions
        : (transactions?.data ?? []);

    const rowStart = Array.isArray(transactions)
        ? 1
        : (transactions?.from ?? 1);

    return (
        <div className="print-area overflow-hidden rounded-[16px] border border-gray-100 bg-white shadow-sm">
            <div className="w-full overflow-x-auto">
                <table className="w-full min-w-[1000px] text-left text-[13px]">
                    <thead>
                        <tr className="border-b border-gray-100">
                            <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">#</th>
                            <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">Date &amp; Time</th>
                            <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">Type</th>
                            <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">Medicine</th>
                            <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">Dosage</th>
                            <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">Qty</th>
                            <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">Price</th>
                            <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">Batch #</th>
                            <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">Reference</th>
                            <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">Party</th>
                            <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">User</th>
                        </tr>
                    </thead>

                    <tbody className="divide-y divide-gray-50">
                        {rows.length === 0 ? (
                            <tr>
                                <td colSpan={11} className="px-4 py-8 text-center text-gray-400">
                                    No transactions found.
                                </td>
                            </tr>
                        ) : (
                            rows.map((transaction, index) => {
                                const isStockIn = transaction.transaction_type === 'Stock-In';

                                return (
                                    <tr
                                        key={`${transaction.source_table}-${transaction.record_id}`}
                                        className="transition-colors hover:bg-gray-50/50"
                                    >
                                        <td className="px-4 py-3 text-gray-400">
                                            {rowStart + index}
                                        </td>

                                        <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                                            {new Date(transaction.date_time).toLocaleString()}
                                        </td>

                                        <td className="px-4 py-3">
                                            <span
                                                className={`inline-block rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide ${
                                                    isStockIn
                                                        ? 'bg-success-green/10 text-success-green'
                                                        : 'bg-burnt-rose/10 text-burnt-rose'
                                                }`}
                                            >
                                                {transaction.transaction_type}
                                            </span>
                                        </td>

                                        <td className="px-4 py-3 font-medium text-gray-900">
                                            {transaction.generic_name}
                                        </td>

                                        <td className="px-4 py-3 text-gray-600">
                                            {transaction.dosage ?? 'N/A'}
                                        </td>

                                        <td
                                            className={`px-4 py-3 font-semibold ${
                                                isStockIn ? 'text-success-green' : 'text-burnt-rose'
                                            }`}
                                        >
                                            {isStockIn ? '+' : '-'}
                                            {Math.abs(Number(transaction.quantity))}
                                        </td>

                                        <td className="px-4 py-3 text-gray-600">
                                            ₱{Number(transaction.selling_price ?? 0).toFixed(2)}
                                        </td>

                                        <td className="px-4 py-3 text-gray-600">
                                            {transaction.batch_reference ?? '—'}
                                        </td>

                                        <td className="px-4 py-3 text-gray-600">
                                            {isStockIn
                                                ? (transaction.invoice_no ?? 'N/A')
                                                : (transaction.prescription_no ?? 'N/A')}
                                        </td>

                                        <td className="px-4 py-3 text-gray-600">
                                            {isStockIn
                                                ? (transaction.supplier ?? 'N/A')
                                                : (transaction.patient_name ?? 'N/A')}
                                        </td>

                                        <td className="px-4 py-3 text-gray-600">
                                            {transaction.user_name ?? 'System'}
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {showPagination && !Array.isArray(transactions) && (
                <div className="no-print">
                    <Pagination meta={transactions} label="transactions" />
                </div>
            )}
        </div>
    );
}
