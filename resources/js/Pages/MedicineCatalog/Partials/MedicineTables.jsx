import { router } from "@inertiajs/react";
import Badge from "@/Components/Badge";
import Pagination from "@/Components/Pagination";

const inputCls =
    "rounded-xl border border-transparent bg-[#F2F2F7] px-3 py-1.5 text-[13px] text-gray-900 focus:border-[#FF4D79] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF4D79]/20 transition-all";

const BATCH_TITLES = {
    expiring: {
        icon: "fa-hourglass-half",
        text: "Batches Expiring Within 30 Days",
        bg: "bg-amber-50",
        textColor: "text-amber-800",
    },
    expired: {
        icon: "fa-ban",
        text: "Expired Batches (Still in Stock)",
        bg: "bg-red-50",
        textColor: "text-critical-red",
    },
};

const MEDICINE_TITLES = {
    lowstock: {
        icon: "fa-triangle-exclamation",
        text: "Low Stock Medicines",
        bg: "bg-amber-50",
        textColor: "text-amber-800",
    },
    outofstock: {
        icon: "fa-circle-xmark",
        text: "Out of Stock Medicines",
        bg: "bg-red-50",
        textColor: "text-critical-red",
    },
};

export default function MedicineTables({
    medicines,
    batches,
    activeFilter,
    canEdit,
    canDelete,
    onEdit,
    onDelete,
    selectedBatches,
    toggleBatch,
    confirmDispose,
    search,
    setSearch,
    category,
    setCategory,
    type,
    setType,
    applyFilters,
    clearFilters,
    categoriesList,
    typesList,
}) {
    const medicineRows = medicines?.data ?? [];
    const batchRows = batches?.data ?? [];

    const isBatchView =
        activeFilter === "expiring" || activeFilter === "expired";

    const isMedicineFilteredView =
        activeFilter === "lowstock" || activeFilter === "outofstock";

    const renderFilterHeader = () => (
        <form
            onSubmit={applyFilters}
            className="flex flex-col sm:flex-row flex-wrap items-center gap-2 w-full"
        >
            <input
                type="text"
                className={`${inputCls} w-full sm:w-48`}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name..."
            />

            {!isBatchView && (
                <>
                    <select
                        className={`${inputCls} w-full sm:w-36`}
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                    >
                        <option value="">All Categories</option>
                        {categoriesList?.map((c) => (
                            <option key={c} value={c}>
                                {c}
                            </option>
                        ))}
                    </select>

                    <select
                        className={`${inputCls} w-full sm:w-36`}
                        value={type}
                        onChange={(e) => setType(e.target.value)}
                    >
                        <option value="">All Types</option>
                        {typesList?.map((t) => (
                            <option key={t} value={t}>
                                {t}
                            </option>
                        ))}
                    </select>
                </>
            )}

            <div className="flex gap-2 w-full sm:w-auto sm:ml-auto">
                <button
                    type="button"
                    onClick={clearFilters}
                    className="px-3 py-1.5 text-[12px] font-semibold text-gray-500 hover:text-gray-900"
                >
                    Clear
                </button>

                <button
                    type="submit"
                    className="rounded-full bg-gray-900 text-white text-[12px] font-semibold px-4 py-1.5 hover:bg-black transition-colors shadow-sm"
                >
                    Filter
                </button>
            </div>
        </form>
    );

    // Batch views

    if (isBatchView) {
        const meta = BATCH_TITLES[activeFilter];

        return (
            <div className="bg-white rounded-[16px] shadow-sm border border-gray-100 overflow-hidden">
                <div
                    className={`p-4 border-b border-gray-100 flex flex-col gap-4 ${meta.bg}`}
                >
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                        <h3
                            className={`font-semibold text-[14px] ${meta.textColor}`}
                        >
                            <i className={`fas mr-2 ${meta.icon}`} />
                            {meta.text}
                        </h3>

                        <button
                            onClick={confirmDispose}
                            disabled={selectedBatches.length === 0}
                            className="rounded-full bg-critical-red text-white text-[13px] font-semibold px-4 py-2 disabled:opacity-50 hover:bg-red-600 transition-colors shadow-sm whitespace-nowrap"
                        >
                            Dispose Selected ({selectedBatches.length})
                        </button>
                    </div>

                    {renderFilterHeader()}
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
                            {batchRows.map((b) => (
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
                                                b.days_left <= 0
                                                    ? "danger"
                                                    : "warning"
                                            }
                                        >
                                            {b.days_left} days
                                        </Badge>
                                    </td>
                                </tr>
                            ))}

                            {batchRows.length === 0 && (
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

                <Pagination meta={batches} label="batches" />
            </div>
        );
    }

    // Medicine views

    const filteredMeta = isMedicineFilteredView
        ? MEDICINE_TITLES[activeFilter]
        : null;

    return (
        <div className="bg-white rounded-[16px] shadow-sm border border-gray-100 overflow-hidden">
            {filteredMeta ? (
                <div
                    className={`p-4 border-b border-gray-100 flex flex-col gap-4 ${filteredMeta.bg}`}
                >
                    <h3
                        className={`font-semibold text-[14px] ${filteredMeta.textColor}`}
                    >
                        <i className={`fas mr-2 ${filteredMeta.icon}`} />
                        {filteredMeta.text}
                    </h3>

                    {renderFilterHeader()}
                </div>
            ) : (
                <div className="p-4 border-b border-gray-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <h2 className="font-semibold text-gray-900 text-[15px] whitespace-nowrap">
                        Master Catalog
                    </h2>

                    <div className="w-full lg:w-auto">
                        {renderFilterHeader()}
                    </div>
                </div>
            )}

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
                            {(canEdit || canDelete) && (
                                <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                                    Actions
                                </th>
                            )}
                        </tr>
                    </thead>

                    <tbody className="divide-y divide-gray-50">
                        {medicineRows.map((m) => (
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
                                        {Number(m.available_stock ?? 0)}
                                    </span>
                                </td>

                                {(canEdit || canDelete) && (
                                    <td className="px-4 py-3 text-right space-x-3 whitespace-nowrap">
                                        {canEdit && (
                                            <button
                                                className="text-[#FF4D79] text-[13px] font-semibold hover:underline"
                                                onClick={() => onEdit(m)}
                                            >
                                                Edit
                                            </button>
                                        )}

                                        {canDelete && (
                                            <button
                                                className="text-critical-red text-[13px] font-semibold hover:underline"
                                                onClick={() => onDelete(m)}
                                            >
                                                Delete
                                            </button>
                                        )}
                                    </td>
                                )}
                            </tr>
                        ))}

                        {medicineRows.length === 0 && (
                            <tr>
                                <td
                                    colSpan={canEdit || canDelete ? 8 : 7}
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
