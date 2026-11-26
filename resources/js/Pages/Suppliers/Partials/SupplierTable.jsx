import Pagination from "@/Components/Pagination";

const inputCls =
    "rounded-xl border border-transparent bg-[#F2F2F7] px-3 py-1.5 text-[13px] text-gray-900 focus:border-[#FF4D79] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF4D79]/20 transition-all";

export default function SupplierTable({
    suppliers,
    onEdit,
    onDelete,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    applyFilters,
    clearFilters,
}) {
    const rows = suppliers?.data ?? [];

    return (
        <div className="bg-white rounded-[16px] shadow-sm border border-gray-100 overflow-hidden mb-4">
            {/* Table Header with integrated filters */}
            <div className="p-4 border-b border-gray-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <h2 className="font-semibold text-gray-900 text-[15px] whitespace-nowrap">
                    Supplier Directory
                </h2>

                <form
                    onSubmit={applyFilters}
                    className="flex flex-wrap items-center gap-2 w-full lg:w-auto"
                >
                    <input
                        type="text"
                        className={`${inputCls} w-full sm:w-48`}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search name, email..."
                    />
                    <select
                        className={`${inputCls} w-full sm:w-32`}
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="all">All Statuses</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                    </select>
                    <div className="flex gap-2 w-full sm:w-auto">
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
            </div>

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
