import Pagination from "@/Components/Pagination";

export default function SupplierTable({ suppliers, onEdit, onDelete }) {
    const rows = suppliers?.data ?? [];

    return (
        <div className="bg-white rounded-[16px] shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto w-full">
                <table className="w-full min-w-[800px] text-left text-[13px]">
                    <thead>
                        <tr className="border-b border-gray-100">
                            <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                                Name
                            </th>
                            <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                                Contact Person
                            </th>
                            <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                                Email
                            </th>
                            <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                                Status
                            </th>
                            <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {rows.map((s) => (
                            <tr
                                key={s.supplier_id}
                                className="hover:bg-gray-50/50 transition-colors"
                            >
                                <td className="px-4 py-3 text-gray-900 font-medium">
                                    {s.name}
                                </td>
                                <td className="px-4 py-3 text-gray-600">
                                    {s.contact_person || "—"}
                                </td>
                                <td className="px-4 py-3 text-gray-600">
                                    {s.email || "—"}
                                </td>
                                <td className="px-4 py-3 text-gray-600 capitalize">
                                    {s.status}
                                </td>
                                <td className="px-4 py-3 text-right space-x-3">
                                    <button
                                        onClick={() => onEdit(s)}
                                        className="text-[#FF4D79] font-semibold hover:underline"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => onDelete(s)}
                                        className="text-critical-red font-semibold hover:underline"
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {rows.length === 0 && (
                            <tr>
                                <td
                                    colSpan={5}
                                    className="px-4 py-8 text-center text-gray-400"
                                >
                                    No suppliers found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            <Pagination meta={suppliers} label="suppliers" />
        </div>
    );
}
