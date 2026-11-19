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
import { DonutChart } from "@/Components/Charts/DonutChart";
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

export default function ReceivingTab({
    receiving,
    supplierId,
    onSupplierChange,
}) {
    const [recvTab, setRecvTab] = useState("summary");

    return (
        <div className="mt-0">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3">
                <Tabs value={recvTab} onValueChange={setRecvTab}>
                    <TabsList className="border-b-0 bg-gray-100 p-1 rounded-lg inline-flex w-auto">
                        <TabsTrigger
                            value="summary"
                            className="rounded-md px-4 py-1.5 text-[12px] font-semibold text-gray-500 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm transition-all"
                        >
                            Summary
                        </TabsTrigger>

                        <TabsTrigger
                            value="supplier"
                            className="rounded-md px-4 py-1.5 text-[12px] font-semibold text-gray-500 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm transition-all"
                        >
                            By Supplier
                        </TabsTrigger>
                    </TabsList>
                </Tabs>

                <select
                    className={`${inputCls} sm:w-48`}
                    value={supplierId || "all"}
                    onChange={(e) => onSupplierChange(e.target.value)}
                >
                    <option value="all">All Suppliers</option>

                    {(receiving.suppliers_list || []).map((supplier) => (
                        <option
                            key={supplier.supplier_id}
                            value={supplier.supplier_id}
                        >
                            {supplier.name}
                        </option>
                    ))}
                </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                <StatCard
                    icon="fa-boxes-stacked"
                    label="Total Batches"
                    value={receiving.total_batches}
                />

                <StatCard
                    icon="fa-arrow-down"
                    label="Total Units"
                    value={receiving.total_units}
                    tone="success"
                />

                <StatCard
                    icon="fa-sack-dollar"
                    label="Total Cost"
                    value={peso(receiving.total_cost)}
                />
            </div>

            {recvTab === "summary" && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle>Daily Receiving</CardTitle>
                        </CardHeader>

                        <CardContent>
                            <ReportLineChart
                                data={receiving.daily}
                                xKey="label"
                                series={[
                                    {
                                        key: "value",
                                        label: "Units received",
                                        color: CHART_COLORS.green,
                                    },
                                ]}
                            />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>By Supplier</CardTitle>
                        </CardHeader>

                        <CardContent className="flex flex-col items-center">
                            <DonutChart
                                data={(receiving.by_supplier || [])
                                    .slice(0, 4)
                                    .map((supplier, index) => ({
                                        name: supplier.supplier,
                                        value: supplier.units,
                                        fill: [
                                            "#2E7D64",
                                            "#3B82F6",
                                            "#FF4D79",
                                            "#E67E22",
                                        ][index % 4],
                                    }))}
                            />

                            <div className="w-full mt-4 space-y-2">
                                {(receiving.by_supplier || [])
                                    .slice(0, 4)
                                    .map((supplier, index) => (
                                        <div
                                            key={`${supplier.supplier}-${index}`}
                                            className="flex justify-between text-[12px]"
                                        >
                                            <div className="flex items-center gap-2">
                                                <div
                                                    className="w-2 h-2 rounded-full"
                                                    style={{
                                                        background: [
                                                            "#2E7D64",
                                                            "#3B82F6",
                                                            "#FF4D79",
                                                            "#E67E22",
                                                        ][index % 4],
                                                    }}
                                                />

                                                <span className="text-gray-600">
                                                    {supplier.supplier}
                                                </span>
                                            </div>

                                            <span className="font-semibold text-gray-900">
                                                {supplier.units} units
                                            </span>
                                        </div>
                                    ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {recvTab === "supplier" && (
                <Card>
                    <CardHeader>
                        <CardTitle>Receiving by Supplier</CardTitle>
                    </CardHeader>

                    <CardContent className="p-0 overflow-x-auto">
                        <table className="w-full text-left text-[13px]">
                            <thead>
                                <tr className="border-b border-gray-100">
                                    <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                                        Supplier
                                    </th>

                                    <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                                        Batches
                                    </th>

                                    <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                                        Units
                                    </th>

                                    <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                                        Cost
                                    </th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-gray-50">
                                {(receiving.by_supplier || []).length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={4}
                                            className="px-4 py-8 text-center text-gray-400"
                                        >
                                            No records.
                                        </td>
                                    </tr>
                                ) : (
                                    receiving.by_supplier.map(
                                        (row, index) => (
                                            <tr
                                                key={`${row.supplier}-${index}`}
                                                className="hover:bg-gray-50/50 transition-colors"
                                            >
                                                <td className="px-4 py-3 text-gray-900 font-medium">
                                                    {row.supplier}
                                                </td>

                                                <td className="px-4 py-3 text-gray-600">
                                                    {row.batches}
                                                </td>

                                                <td className="px-4 py-3 text-gray-600">
                                                    {row.units}
                                                </td>

                                                <td className="px-4 py-3 text-gray-600">
                                                    {peso(row.cost)}
                                                </td>
                                            </tr>
                                        ),
                                    )
                                )}
                            </tbody>
                        </table>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
