import Badge from "@/Components/Badge";
import Pagination from "@/Components/Pagination";

export default function UserTable({
    users,
    auth,
    onEdit,
    onDelete,
    onToggleStatus,
}) {
    const rows = users?.data ?? [];

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
