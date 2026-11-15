import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/Components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/Components/ui/tabs";
import StatCard from "@/Components/StatCard";
import Badge from "@/Components/Badge";
import { RadialChart } from "@/Components/Charts/RadialChart";

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

export default function InventoryTab({ inventory }) {
    const [invTab, setInvTab] = useState("overview");
    const [invFilter, setInvFilter] = useState("all");

    return (
        <div className="mt-0">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3">
                <Tabs value={invTab} onValueChange={setInvTab}>
                    <TabsList className="border-b-0 bg-gray-100 p-1 rounded-lg inline-flex w-auto">
                        <TabsTrigger
                            value="overview"
                            className="rounded-md px-4 py-1.5 text-[12px] font-semibold text-gray-500 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm transition-all"
                        >
                            Overview
                        </TabsTrigger>
                        <TabsTrigger
                            value="lowout"
                            className="rounded-md px-4 py-1.5 text-[12px] font-semibold text-gray-500 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm transition-all"
                        >
                            Low & Out of Stock
                        </TabsTrigger>
                    </TabsList>
                </Tabs>
                <select
                    className={`${inputCls} sm:w-48`}
                    value={invFilter}
                    onChange={(e) => setInvFilter(e.target.value)}
                >
                    <option value="all">All Categories</option>
                    {inventory.categories.map((c) => (
                        <option key={c} value={c}>
                            {c}
                        </option>
                    ))}
                </select>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <StatCard
                    icon="fa-capsules"
                    label="Total Medicines"
                    value={inventory.total_medicines}
                />
                <StatCard
                    icon="fa-triangle-exclamation"
                    label="Low Stock"
                    value={inventory.low_stock}
                    tone="warning"
                />
                <StatCard
                    icon="fa-circle-xmark"
                    label="Out of Stock"
                    value={inventory.out_of_stock}
                    tone="danger"
                />
                <StatCard
                    icon="fa-sack-dollar"
                    label="Inventory Value"
                    value={peso(inventory.valuation)}
                    tone="success"
                />
            </div>

            {invTab === "overview" && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle>Full Inventory</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0 overflow-x-auto">
                            <table className="w-full text-left text-[13px]">
                                <thead>
                                    <tr className="border-b border-gray-100">
                                        <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                                            Generic
                                        </th>
                                        <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                                            Category
                                        </th>
                                        <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                                            Stock
                                        </th>
                                        <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                                            Status
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {inventory.rows.slice(0, 15).map((r) => (
                                        <tr
                                            key={r.medicine_id}
                                            className="hover:bg-gray-50/50 transition-colors"
                                        >
                                            <td className="px-4 py-3 text-gray-900 font-medium">
                                                {r.generic_name}{" "}
                                                {r.brand_name && (
                                                    <span className="text-[11px] font-normal text-gray-400">
                                                        ({r.brand_name})
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-gray-600">
                                                {r.category}
                                            </td>
                                            <td className="px-4 py-3 text-gray-600">
                                                {r.current_stock}
                                            </td>
                                            <td className="px-4 py-3">
                                                {r.status === "out" && (
                                                    <Badge tone="danger">
                                                        Out
                                                    </Badge>
                                                )}
                                                {r.status === "low" && (
                                                    <Badge tone="warning">
                                                        Low
                                                    </Badge>
                                                )}
                                                {r.status === "ok" && (
                                                    <Badge
                                                        tone="success"
                                                        outline
                                                    >
                                                        OK
                                                    </Badge>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </CardContent>
                    </Card>

                    <Card className="lg:col-span-1 flex flex-col items-center">
                        <CardHeader className="w-full text-center pb-0">
                            <CardTitle>Inventory Health</CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-col items-center w-full">
                            <RadialChart
                                data={[
                                    {
                                        name: "Health",
                                        value:
                                            Math.round(
                                                ((inventory.total_medicines -
                                                    inventory.out_of_stock) /
                                                    inventory.total_medicines) *
                                                    100,
                                            ) || 0,
                                        fill: "#2E7D64",
                                    },
                                ]}
                                value={`${Math.round(((inventory.total_medicines - inventory.out_of_stock) / inventory.total_medicines) * 100) || 0}%`}
                                label="Healthy"
                            />
                            <p className="text-[12px] text-gray-500 text-center mt-2">
                                {inventory.total_medicines -
                                    inventory.out_of_stock}{" "}
                                out of {inventory.total_medicines} items are in
                                stock.
                            </p>
                        </CardContent>
                    </Card>
                </div>
            )}

            {invTab === "lowout" && (
                <Card>
                    <CardHeader>
                        <CardTitle>Low & Out of Stock</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0 overflow-x-auto">
                        <table className="w-full text-left text-[13px]">
                            <thead>
                                <tr className="border-b border-gray-100">
                                    <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                                        Generic
                                    </th>
                                    <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                                        Brand
                                    </th>
                                    <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                                        Dosage
                                    </th>
                                    <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                                        Stock
                                    </th>
                                    <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                                        Status
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {inventory.rows
                                    .filter((r) => r.status !== "ok")
                                    .map((r) => (
                                        <tr
                                            key={r.medicine_id}
                                            className="hover:bg-gray-50/50 transition-colors"
                                        >
                                            <td className="px-4 py-3 text-gray-900 font-medium">
                                                {r.generic_name}
                                            </td>
                                            <td className="px-4 py-3 text-gray-600">
                                                {r.brand_name}
                                            </td>
                                            <td className="px-4 py-3 text-gray-600">
                                                {r.dosage}
                                            </td>
                                            <td className="px-4 py-3 text-gray-600">
                                                {r.current_stock}
                                            </td>
                                            <td className="px-4 py-3">
                                                {r.status === "out" && (
                                                    <Badge tone="danger">
                                                        Out
                                                    </Badge>
                                                )}
                                                {r.status === "low" && (
                                                    <Badge tone="warning">
                                                        Low
                                                    </Badge>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                {inventory.rows.filter((r) => r.status !== "ok")
                                    .length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={5}
                                            className="px-4 py-8 text-center text-gray-400"
                                        >
                                            All stock is OK.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
