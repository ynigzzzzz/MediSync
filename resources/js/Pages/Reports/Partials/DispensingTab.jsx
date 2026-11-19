import { useState } from "react";
import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
} from "@/Components/ui/card";
import {
    Tabs,
    TabsList,
    TabsTrigger,
} from "@/Components/ui/tabs";
import StatCard from "@/Components/StatCard";
import { BarChart } from "@/Components/Charts/BarChart";
import { ReportLineChart } from "@/Components/ReportChart";
import { CHART_COLORS } from "@/lib/chart-palette";

const inputCls =
    "w-full rounded-xl border border-transparent bg-[#F2F2F7] px-3 py-2 text-[14px] text-gray-900 placeholder-gray-400 focus:border-gray-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-gray-100 transition-all";

function peso(n) {
    return (
        "₱" +
        Number(n || 0).toLocaleString("en-PH", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })
    );
}

export default function DispensingTab({
    dispensing,
    userId,
    onUserChange,
}) {
    const [dispTab, setDispTab] = useState("summary");

    return (
        <div className="mt-0">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3">
                <Tabs value={dispTab} onValueChange={setDispTab}>
                    <TabsList className="border-b-0 bg-gray-100 p-1 rounded-lg inline-flex w-auto">
                        <TabsTrigger
                            value="summary"
                            className="rounded-md px-4 py-1.5 text-[12px] font-semibold text-gray-500 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm transition-all"
                        >
                            Summary
                        </TabsTrigger>

                        <TabsTrigger
                            value="user"
                            className="rounded-md px-4 py-1.5 text-[12px] font-semibold text-gray-500 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm transition-all"
                        >
                            By User
                        </TabsTrigger>
                    </TabsList>
                </Tabs>

                <select
                    className={`${inputCls} sm:w-48`}
                    value={userId || "all"}
                    onChange={(e) => onUserChange(e.target.value)}
                >
                    <option value="all">All Users</option>

                    {(dispensing.users_list || []).map((user) => (
                        <option key={user.user_id} value={user.user_id}>
                            {user.full_name}
                        </option>
                    ))}
                </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                <StatCard
                    icon="fa-receipt"
                    label="Records"
                    value={dispensing.total_records}
                />

                <StatCard
                    icon="fa-arrow-up"
                    label="Total Units"
                    value={dispensing.total_units}
                    tone="rose"
                />

                <StatCard
                    icon="fa-sack-dollar"
                    label="Total Value"
                    value={peso(dispensing.total_value)}
                    tone="success"
                />
            </div>

            {dispTab === "summary" && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle>Daily Dispensing</CardTitle>
                        </CardHeader>

                        <CardContent>
                            <ReportLineChart
                                data={dispensing.daily}
                                xKey="label"
                                series={[
                                    {
                                        key: "value",
                                        label: "Units dispensed",
                                        color: CHART_COLORS.rose,
                                    },
                                ]}
                            />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Top Dispensed</CardTitle>
                        </CardHeader>

                        <CardContent>
                            <BarChart
                                data={(dispensing.by_medicine || []).slice(0, 5)}
                                xKey="name"
                                yKey="units"
                                label="Units"
                                color="#FF4D79"
                            />
                        </CardContent>
                    </Card>
                </div>
            )}

            {dispTab === "user" && (
                <Card>
                    <CardHeader>
                        <CardTitle>Dispensed by User</CardTitle>
                    </CardHeader>

                    <CardContent className="p-0 overflow-x-auto">
                        <table className="w-full text-left text-[13px]">
                            <thead>
                                <tr className="border-b border-gray-100">
                                    <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                                        User
                                    </th>

                                    <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                                        Records
                                    </th>

                                    <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                                        Units
                                    </th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-gray-50">
                                {(dispensing.by_user || []).length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={3}
                                            className="px-4 py-8 text-center text-gray-400"
                                        >
                                            No records.
                                        </td>
                                    </tr>
                                ) : (
                                    dispensing.by_user.map((row, index) => (
                                        <tr
                                            key={row.user_id ?? index}
                                            className="hover:bg-gray-50/50 transition-colors"
                                        >
                                            <td className="px-4 py-3 text-gray-900 font-medium">
                                                {row.user}
                                            </td>

                                            <td className="px-4 py-3 text-gray-600">
                                                {row.records}
                                            </td>

                                            <td className="px-4 py-3 text-gray-600">
                                                {row.units}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
