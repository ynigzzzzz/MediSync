import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
} from "@/Components/ui/card";
import Badge from "@/Components/Badge";

export default function DeletionsTab({ deletions }) {
    return (
        <div className="mt-0">
            <Card>
                <CardHeader>
                    <CardTitle>Deletion History</CardTitle>
                    <CardDescription>
                        {deletions.total} deletion(s) recorded in this period.
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-0 overflow-x-auto">
                    <table className="w-full min-w-[800px] text-left text-[13px]">
                        <thead>
                            <tr className="border-b border-gray-100">
                                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                                    Date
                                </th>
                                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                                    Type
                                </th>
                                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                                    Description
                                </th>
                                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                                    Reason
                                </th>
                                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                                    Deleted By
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {deletions.rows.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={5}
                                        className="px-4 py-8 text-center text-gray-400"
                                    >
                                        No deletions in this period.
                                    </td>
                                </tr>
                            ) : (
                                deletions.rows.map((d) => (
                                    <tr
                                        key={d.log_id}
                                        className="hover:bg-gray-50/50 transition-colors"
                                    >
                                        <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                                            {new Date(
                                                d.created_at,
                                            ).toLocaleString()}
                                        </td>
                                        <td className="px-4 py-3">
                                            <Badge
                                                tone={
                                                    d.type === "Stock-In"
                                                        ? "success"
                                                        : d.type === "Stock-Out"
                                                          ? "warning"
                                                          : d.type ===
                                                              "Medicine"
                                                            ? "rose"
                                                            : d.type ===
                                                                "Supplier"
                                                              ? "neutral"
                                                              : "danger"
                                                }
                                                outline
                                            >
                                                {d.type}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3 text-gray-900">
                                            {d.description}
                                        </td>
                                        <td className="px-4 py-3 text-gray-600 italic">
                                            {d.reason}
                                        </td>
                                        <td className="px-4 py-3 text-gray-600">
                                            {d.user_name}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </CardContent>
            </Card>
        </div>
    );
}
