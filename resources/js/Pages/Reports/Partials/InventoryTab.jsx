import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/Components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/Components/ui/tabs";
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

export default function InventoryTab({
    inventory,
    category,
    onCategoryChange,
}) {
    const [invTab, setInvTab] = useState("overview");

    const selectedCategory = category || "all";

    const healthPercentage =
        inventory.total_medicines > 0
            ? Math.round(
                  ((inventory.total_medicines - inventory.out_of_stock) /
                      inventory.total_medicines) *
                      100,
              )
            : 0;

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
                    value={selectedCategory}
                    onChange={(e) => onCategoryChange(e.target.value)}
                >
                    <option value="all">All Categories</option>

                    {(inventory.categories || []).map((categoryName) => (
                        <option key={categoryName} value={categoryName}>
                            {categoryName}
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
                    label="Inventory Cost Value"
                    value={peso(inventory.valuation)}
                    tone="success"
                    tooltip="Total acquisition cost of usable, unexpired and undisposed remaining stock."
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
                                            Available Stock
                                        </th>

                                        <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500 whitespace-nowrap">
                                            Acquisition Value
                                        </th>

                                        <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                                            Status
                                        </th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-gray-50">
                                    {(inventory.rows || []).map((row) => (
                                        <tr
                                            key={row.medicine_id}
                                            className="hover:bg-gray-50/50 transition-colors"
                                        >
                                            <td className="px-4 py-3 text-gray-900 font-medium">
                                                {row.generic_name}{" "}
                                                {row.brand_name && (
                                                    <span className="text-[11px] font-normal text-gray-400">
                                                        ({row.brand_name})
                                                    </span>
                                                )}
                                            </td>

                                            <td className="px-4 py-3 text-gray-600">
                                                {row.category || "—"}
                                            </td>

                                            <td className="px-4 py-3 text-gray-600">
                                                {row.available_stock}
                                            </td>

                                            <td className="px-4 py-3 text-gray-900 font-medium whitespace-nowrap">
                                                {peso(row.stock_value)}
                                            </td>

                                            <td className="px-4 py-3">
                                                {row.status === "out" && (
                                                    <Badge tone="danger">
                                                        Out
                                                    </Badge>
                                                )}

                                                {row.status === "low" && (
                                                    <Badge tone="warning">
                                                        Low
                                                    </Badge>
                                                )}

                                                {row.status === "ok" && (
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

                                    {(inventory.rows || []).length === 0 && (
                                        <tr>
                                            <td
                                                colSpan={5}
                                                className="px-4 py-8 text-center text-gray-400"
                                            >
                                                No inventory records found.
                                            </td>
                                        </tr>
                                    )}
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
                                        value: healthPercentage,
                                        fill: "#2E7D64",
                                    },
                                ]}
                                value={`${healthPercentage}%`}
                                label="Healthy"
                            />

                            <p className="text-[12px] text-gray-500 text-center mt-2">
                                {inventory.total_medicines -
                                    inventory.out_of_stock}{" "}
                                out of {inventory.total_medicines} medicines
                                have usable stock.
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
                                        Available Stock
                                    </th>

                                    <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                                        Status
                                    </th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-gray-50">
                                {(inventory.rows || [])
                                    .filter((row) => row.status !== "ok")
                                    .map((row) => (
                                        <tr
                                            key={row.medicine_id}
                                            className="hover:bg-gray-50/50 transition-colors"
                                        >
                                            <td className="px-4 py-3 text-gray-900 font-medium">
                                                {row.generic_name}
                                            </td>

                                            <td className="px-4 py-3 text-gray-600">
                                                {row.brand_name || "—"}
                                            </td>

                                            <td className="px-4 py-3 text-gray-600">
                                                {row.dosage || "—"}
                                            </td>

                                            <td className="px-4 py-3 text-gray-600">
                                                {row.available_stock}
                                            </td>

                                            <td className="px-4 py-3">
                                                {row.status === "out" && (
                                                    <Badge tone="danger">
                                                        Out
                                                    </Badge>
                                                )}

                                                {row.status === "low" && (
                                                    <Badge tone="warning">
                                                        Low
                                                    </Badge>
                                                )}
                                            </td>
                                        </tr>
                                    ))}

                                {(inventory.rows || []).filter(
                                    (row) => row.status !== "ok",
                                ).length === 0 && (
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
