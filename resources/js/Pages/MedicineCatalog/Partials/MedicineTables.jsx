import { router } from "@inertiajs/react";
import Badge from "@/Components/Badge";
import Pagination from "@/Components/Pagination";

export default function MedicineTables({
    medicines,
    expiringBatches,
    activeFilter,
    canEdit,
    onEdit,
    onDelete,
    selectedBatches,
    toggleBatch,
    confirmDispose,
}) {
    const rows = medicines?.data ?? [];
    const batches = expiringBatches?.data ?? [];
    const isExpiringView =
        activeFilter === "expiring" || activeFilter === "expired";

    if (isExpiringView) {
        return (
            <div className="bg-white rounded-[16px] shadow-sm border border-gray-100 overflow-hidden">
                <div
                    className={`p-4 border-b border-gray-100 flex justify-between items-center ${activeFilter === "expired" ? "bg-red-50" : "bg-amber-50"}`}
                >
                    <h3
                        className={`font-semibold text-[14px] ${activeFilter === "expired" ? "text-critical-red" : "text-amber-800"}`}
                    >
                        <i
                            className={`fas mr-2 ${activeFilter === "expired" ? "fa-ban" : "fa-hourglass-half"}`}
                        />
                        {activeFilter === "expired"
                            ? "Expired Batches (Still in Stock)"
                            : "Batches Expiring Within 30 Days"}
                    </h3>
                    <button
                        onClick={confirmDispose}
                        disabled={selectedBatches.length === 0}
                        className="rounded-full bg-critical-red text-white text-[13px] font-semibold px-4 py-2 disabled:opacity-50 hover:bg-red-600 transition-colors shadow-sm"
                    >
                        Dispose Selected ({selectedBatches.length})
                    </button>
                </div>
                <div className="overflow-x-auto w-full">
                    <table className="w-full min-w-[700px] text-left text-[13px]">
                        <thead>
                            <tr className="border-b border-gray-100">
                                <th className="px-4 py-3 w-10"></th>
                                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                                    Medicine
                                </th>
                                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                                    Batch No
                                </th>
                                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                                    Expiry Date
                                </th>
                                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                                    Qty Left
                                </th>
                                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                                    Days Left
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {batches.map((b) => (
                                <tr
                                    key={b.stock_in_id}
                                    className="hover:bg-gray-50/50 transition-colors"
                                >
                                    <td className="px-4 py-3">
                                        <input
                                            type="checkbox"
                                            checked={selectedBatches.includes(
                                                b.stock_in_id,
                                            )}
                                            onChange={() =>
                                                toggleBatch(b.stock_in_id)
                                            }
                                            className="rounded border-gray-300 text-[#FF4D79] focus:ring-[#FF4D79]"
                                        />
                                    </td>
                                    <td className="px-4 py-3 text-gray-900 font-medium">
                                        {b.medicine?.generic_name}{" "}
                                        {b.medicine?.brand_name &&
                                            `(${b.medicine.brand_name})`}
                                    </td>
                                    <td className="px-4 py-3 text-gray-600">
                                        {b.batch_no}
                                    </td>
                                    <td className="px-4 py-3 text-gray-600">
                                        {b.expiry_date}
                                    </td>
                                    <td className="px-4 py-3 text-gray-600">
                                        {b.remaining_quantity}
                                    </td>
                                    <td className="px-4 py-3">
                                        <Badge
                                            tone={
                                                activeFilter === "expired"
                                                    ? "danger"
                                                    : "warning"
                                            }
                                        >
                                            {b.days_left} days
                                        </Badge>
                                    </td>
                                </tr>
                            ))}
                            {batches.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={6}
                                        className="px-4 py-8 text-center text-gray-400"
                                    >
                                        No batches found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                <Pagination meta={expiringBatches} label="batches" />
            </div>
        );
    }

    return (
        <div className="bg-white rounded-[16px] shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto w-full">
                <table className="w-full min-w-[800px] text-left text-[13px]">
                    <thead>
                        <tr className="border-b border-gray-100">
                            <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                                Generic
                            </th>
                            <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                                Brand
                            </th>
                            <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                                Type
                            </th>
                            <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                                Category
                            </th>
                            <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                                Dosage
                            </th>
                            <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                                Selling Price
                            </th>
                            <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                                Stock
                            </th>
                            {canEdit && (
                                <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                                    Actions
                                </th>
                            )}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {rows.map((m) => (
                            <tr
                                key={m.medicine_id}
                                className="hover:bg-gray-50/50 transition-colors"
                            >
                                <td className="px-4 py-3 text-gray-900 font-medium">
                                    {m.generic_name}
                                </td>
                                <td className="px-4 py-3 text-gray-600">
                                    {m.brand_name}
                                </td>
                                <td className="px-4 py-3 text-gray-600">
                                    {m.type}
                                </td>
                                <td className="px-4 py-3 text-gray-600">
                                    {m.category}
                                </td>
                                <td className="px-4 py-3 text-gray-600">
                                    {m.dosage}
                                </td>
                                <td className="px-4 py-3 text-gray-600">
                                    ₱{Number(m.price || 0).toFixed(2)}
                                </td>
                                <td className="px-4 py-3 text-gray-900">
                                    <span className="mr-2 font-medium">
                                        {m.current_stock}
                                    </span>
                                    {m.current_stock === 0 && (
                                        <Badge tone="danger">Out</Badge>
                                    )}
                                    {m.current_stock > 0 &&
                                        m.current_stock < 50 && (
                                            <Badge tone="warning">Low</Badge>
                                        )}
                                </td>
                                {canEdit && (
                                    <td className="px-4 py-3 text-right space-x-3 whitespace-nowrap">
                                        <button
                                            className="text-[#FF4D79] text-[13px] font-semibold hover:underline"
                                            onClick={() => onEdit(m)}
                                        >
                                            Edit
                                        </button>
                                        <button
                                            className="text-critical-red text-[13px] font-semibold hover:underline"
                                            onClick={() => onDelete(m)}
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
                                    colSpan={canEdit ? 8 : 7}
                                    className="px-4 py-8 text-center text-gray-400"
                                >
                                    No medicines found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            <Pagination meta={medicines} label="medicines" />
        </div>
    );
}
