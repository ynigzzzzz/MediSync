import { Link } from "@inertiajs/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/Components/ui/card";

export default function RecentDispensingTable({ recentActivity = [] }) {
    return (
        <Card className="mt-4">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle>Recent Dispensing</CardTitle>
                <Link
                    href="/transaction-history"
                    className="text-xs font-semibold text-[#FF4D79] hover:text-[#E63E66] transition-colors"
                >
                    View all →
                </Link>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
                <table className="w-full text-xs min-w-[500px] text-left">
                    <thead>
                        <tr className="border-b border-gray-100">
                            <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                                Medicine
                            </th>
                            <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                                Qty
                            </th>
                            <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                                By
                            </th>
                            <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                                When
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {recentActivity.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={4}
                                    className="px-4 py-6 text-center text-gray-400"
                                >
                                    No activity yet.
                                </td>
                            </tr>
                        ) : (
                            recentActivity.map((r) => (
                                <tr
                                    key={r.stock_out_id}
                                    className="hover:bg-gray-50/50 transition-colors"
                                >
                                    <td className="px-4 py-3 font-medium text-gray-900">
                                        {r.medicine?.generic_name}
                                    </td>
                                    <td className="px-4 py-3 text-gray-600">
                                        {r.quantity}
                                    </td>
                                    <td className="px-4 py-3 text-gray-600">
                                        {r.dispensed_by?.full_name}
                                    </td>
                                    <td className="px-4 py-3 text-gray-600">
                                        {new Date(
                                            r.dispensed_at,
                                        ).toLocaleString()}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </CardContent>
        </Card>
    );
}
