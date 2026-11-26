import Badge from "@/Components/Badge";
import Pagination from "@/Components/Pagination";

const inputCls =
    "rounded-xl border border-transparent bg-[#F2F2F7] px-3 py-1.5 text-[13px] text-gray-900 focus:border-[#FF4D79] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF4D79]/20 transition-all";

export default function UserTable({
    users,
    auth,
    onEdit,
    onDelete,
    onToggleStatus,
    search,
    setSearch,
    roleFilter,
    setRoleFilter,
    applyFilters,
    clearFilters,
}) {
    const rows = users?.data ?? [];

    return (
        <div className="bg-white rounded-[16px] shadow-sm border border-gray-100 overflow-hidden mb-4">
            {/* Table Header with integrated filters */}
            <div className="p-4 border-b border-gray-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <h2 className="font-semibold text-gray-900 text-[15px] whitespace-nowrap">
                    User Directory
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
                        placeholder="Search name or email..."
                    />
                    <select
                        className={`${inputCls} w-full sm:w-32`}
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                    >
                        <option value="all">All Roles</option>
                        <option value="admin">Admin</option>
                        <option value="pharmacist">Pharmacist</option>
                        <option value="assistant">Assistant</option>
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
                                Email
                            </th>
                            <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                                Role
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
                        {rows.map((u) => (
                            <tr
                                key={u.user_id}
                                className="hover:bg-gray-50/50 transition-colors"
                            >
                                <td className="px-4 py-3 text-gray-900 font-medium">
                                    {u.full_name}{" "}
                                    {u.user_id === auth.user.user_id && (
                                        <span className="text-xs text-gray-400">
                                            (You)
                                        </span>
                                    )}
                                </td>
                                <td className="px-4 py-3 text-gray-600">
                                    {u.email}
                                </td>
                                <td className="px-4 py-3">
                                    <Badge
                                        tone={
                                            u.role === "admin"
                                                ? "rose"
                                                : u.role === "pharmacist"
                                                  ? "success"
                                                  : "neutral"
                                        }
                                    >
                                        {u.role}
                                    </Badge>
                                </td>
                                <td className="px-4 py-3">
                                    <button
                                        onClick={() => onToggleStatus(u)}
                                        disabled={
                                            u.user_id === auth.user.user_id
                                        }
                                        className="hover:underline"
                                    >
                                        <Badge
                                            tone={
                                                u.status === "active"
                                                    ? "success"
                                                    : "danger"
                                            }
                                        >
                                            {u.status}
                                        </Badge>
                                    </button>
                                </td>
                                <td className="px-4 py-3 text-right space-x-3">
                                    <button
                                        onClick={() => onEdit(u)}
                                        className="text-[#FF4D79] font-semibold hover:underline"
                                    >
                                        Edit
                                    </button>
                                    {u.user_id !== auth.user.user_id && (
                                        <button
                                            onClick={() => onDelete(u)}
                                            className="text-critical-red font-semibold hover:underline"
                                        >
                                            Delete
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {rows.length === 0 && (
                            <tr>
                                <td
                                    colSpan={5}
                                    className="px-4 py-8 text-center text-gray-400"
                                >
                                    No users found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            <Pagination meta={users} label="users" />
        </div>
    );
}
