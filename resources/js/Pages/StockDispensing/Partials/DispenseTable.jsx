import Pagination from "@/Components/Pagination";

export default function DispenseTable({ records, canDelete, onDelete }) {
    const rows = records?.data ?? [];

    return (
        <div className="bg-white rounded-[16px] shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100">
                <h2 className="font-semibold text-gray-900 text-[15px]">
                    Recent Dispense Records
                </h2>
            </div>
            <div className="overflow-x-auto w-full">
                <table className="w-full min-w-[800px] text-left text-[13px]">
                    <thead>
                        <tr className="border-b border-gray-100">
                            <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                                Medicine
                            </th>
                            <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                                Qty
                            </th>
                            <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                                Patient
                            </th>
                            <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                                Prescription
                            </th>
                            <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                                Batch
                            </th>
                            <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                                By
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
                                key={r.stock_out_id}
                                className="hover:bg-gray-50/50 transition-colors"
                            >
                                <td className="px-4 py-3 text-gray-900 font-medium">
                                    {r.medicine?.generic_name}
                                </td>
                                <td className="px-4 py-3 text-gray-600">
                                    {r.quantity}
                                </td>
                                <td className="px-4 py-3 text-gray-600">
                                    {r.patient_name || "—"}
                                </td>
                                <td className="px-4 py-3 text-gray-600">
                                    {r.prescription_no || "—"}
                                </td>
                                <td className="px-4 py-3 text-gray-600">
                                    {r.stock_in?.batch_no}
                                </td>
                                <td className="px-4 py-3 text-gray-600">
                                    {r.dispensed_by?.full_name}
                                </td>
                                {canDelete && (
                                    <td className="px-4 py-3 text-right">
                                        <button
                                            className="text-critical-red hover:underline text-[13px] font-semibold"
                                            onClick={() =>
                                                onDelete(r.stock_out_id)
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
                                    colSpan={canDelete ? 7 : 6}
                                    className="px-4 py-8 text-center text-gray-400"
                                >
                                    No dispensing records yet.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            <Pagination meta={records} label="dispenses" />
        </div>
    );
}
