import Pagination from "@/Components/Pagination";

export default function ReceivingTable({ records, canDelete, onDelete }) {
    const rows = records?.data ?? [];

    return (
        <div className="bg-white rounded-[16px] shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto w-full">
                <table className="w-full min-w-[900px] text-left text-[13px]">
                    <thead>
                        <tr className="border-b border-gray-100">
                            <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                                Medicine
                            </th>
                            <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                                Batch
                            </th>
                            <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                                Qty
                            </th>
                            <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                                Cost
                            </th>
                            <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                                Expiry
                            </th>
                            <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                                Supplier
                            </th>
                            <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                                Received By
                            </th>
                            {canDelete && (
                                <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                                    Actions
                                </th>
                            )}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {rows.map((r) => (
                            <tr
                                key={r.stock_in_id}
                                className="hover:bg-gray-50/50 transition-colors"
                            >
                                <td className="px-4 py-3 text-gray-900 font-medium">
                                    {r.medicine?.generic_name}
                                </td>
                                <td className="px-4 py-3 text-gray-600">
                                    {r.batch_no}
                                </td>
                                <td className="px-4 py-3 text-gray-600">
                                    {r.quantity}{" "}
                                    <span className="text-gray-400 text-[11px]">
                                        ({r.remaining_quantity} left)
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-gray-600">
                                    ₱{r.cost_price}
                                </td>
                                <td className="px-4 py-3 text-gray-600">
                                    {r.expiry_date}
                                </td>
                                <td className="px-4 py-3 text-gray-600">
                                    {r.supplier?.name ?? "—"}
                                </td>
                                <td className="px-4 py-3 text-gray-600">
                                    {r.received_by?.full_name}
                                </td>
                                {canDelete && (
                                    <td className="px-4 py-3 text-right">
                                        <button
                                            className="text-critical-red hover:underline text-[13px] font-semibold"
                                            onClick={() =>
                                                onDelete(r.stock_in_id)
                                            }
                                        >
                                            Delete
                                        </button>
                                    </td>
                                )}
                            </tr>
                        ))}
                        {rows.length === 0 && (
                            <tr>
                                <td
                                    colSpan={canDelete ? 8 : 7}
                                    className="px-4 py-8 text-center text-gray-400"
                                >
                                    No records found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            <Pagination meta={records} label="records" />
        </div>
    );
}
