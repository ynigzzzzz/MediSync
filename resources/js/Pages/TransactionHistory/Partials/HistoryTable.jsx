import Badge from "@/Components/Badge";
import Pagination from "@/Components/Pagination";

export default function HistoryTable({ transactions }) {
    const rows = transactions?.data ?? [];

    return (
        <div className="bg-white rounded-[16px] shadow-sm border border-gray-100 overflow-hidden mb-4">
            <div className="overflow-x-auto w-full">
                <table className="w-full min-w-[1000px] text-left text-[13px]">
                    <thead>
                        <tr className="border-b border-gray-100">
                            <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                                Date & Time
                            </th>
                            <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                                Type
                            </th>
                            <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                                Medicine
                            </th>
                            <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                                Qty
                            </th>
                            <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                                Price
                            </th>
                            <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                                Batch / Ref
                            </th>
                            <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                                Party
                            </th>
                            <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                                User
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {rows.map((r) => {
                            const isStockIn = r.transaction_type === "Stock-In";
                            return (
                                <tr
                                    key={`${r.source_table}-${r.record_id}`}
                                    className="hover:bg-gray-50/50 transition-colors"
                                >
                                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                                        {new Date(r.date_time).toLocaleString(
                                            "en-US",
                                            {
                                                month: "short",
                                                day: "numeric",
                                                year: "numeric",
                                                hour: "numeric",
                                                minute: "2-digit",
                                            },
                                        )}
                                    </td>
                                    <td className="px-4 py-3">
                                        <Badge
                                            tone={
                                                isStockIn ? "success" : "rose"
                                            }
                                        >
                                            {r.transaction_type}
                                        </Badge>
                                    </td>
                                    <td className="px-4 py-3 text-gray-900 font-medium whitespace-nowrap">
                                        {r.generic_name}{" "}
                                        {r.brand_name && (
                                            <span className="text-gray-400 text-[11px]">
                                                ({r.brand_name})
                                            </span>
                                        )}
                                    </td>
                                    <td
                                        className={`px-4 py-3 font-bold ${isStockIn ? "text-success-green" : "text-critical-red"}`}
                                    >
                                        {isStockIn ? "+" : "-"}
                                        {r.quantity}
                                    </td>
                                    <td className="px-4 py-3 text-gray-600">
                                        ₱{r.selling_price}
                                    </td>
                                    <td className="px-4 py-3 text-gray-600">
                                        <div>{r.batch_reference || "—"}</div>
                                        <div className="text-[11px] text-gray-400">
                                            {r.expiry_date
                                                ? `Exp: ${r.expiry_date}`
                                                : ""}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-gray-600">
                                        {isStockIn
                                            ? r.supplier || "—"
                                            : r.patient_name || "Walk-in"}
                                    </td>
                                    <td className="px-4 py-3 text-gray-600">
                                        {r.user_name || "System"}
                                    </td>
                                </tr>
                            );
                        })}
                        {rows.length === 0 && (
                            <tr>
                                <td
                                    colSpan={8}
                                    className="px-4 py-8 text-center text-gray-400"
                                >
                                    No transactions found matching your filters.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            <Pagination meta={transactions} label="transactions" />
        </div>
    );
}
