import { useState, useMemo } from "react";
import { Head, router } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import StatCard from "@/Components/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/Components/ui/card";
import { StackedBarChart } from "@/Components/Charts/StackedBarChart";
import { DonutChart } from "@/Components/Charts/DonutChart";
import { RadialChart } from "@/Components/Charts/RadialChart";
import { cn } from "@/lib/utils";

import NeedsAttentionList from "./Partials/NeedsAttentionList";
import RecentDispensingTable from "./Partials/RecentDispensingTable";

function computeTrend(trend) {
    if (!trend) return null;
    if (trend.current === 0 && trend.previous === 0) return null;
    if (trend.previous === 0)
        return { direction: "up", label: `+${trend.current}` };
    const pct = Math.round(
        ((trend.current - trend.previous) / trend.previous) * 100,
    );
    if (pct === 0) return { direction: "flat", label: "0% vs yesterday" };
    if (pct > 0) return { direction: "up", label: `+${pct}% vs yesterday` };
    return { direction: "down", label: `${Math.abs(pct)}% vs yesterday` };
}

export default function Index({
    stats,
    trends,
    attention,
    activity,
    recentActivity,
}) {
    const dispensedTrend = computeTrend(trends?.dispensed);
    const receivedTrend = computeTrend(trends?.received);
    const [timeRange, setTimeRange] = useState("14d");

    const filteredActivity = useMemo(() => {
        if (!activity) return [];
        if (timeRange === "7d") return activity.slice(-7);
        if (timeRange === "14d") return activity.slice(-14);
        return activity;
    }, [activity, timeRange]);

    return (
        <AuthenticatedLayout>
            <Head title="Dashboard" />
            <div className="overflow-x-hidden">
                <div className="mb-5 flex items-end justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
                            Dashboard
                        </h1>
                        <p className="text-[13px] text-gray-500">
                            Overview of pharmacy operations and recent activity.
                        </p>
                    </div>
                    <div className="flex bg-gray-100 p-1 rounded-lg">
                        {["7d", "14d", "30d"].map((range) => (
                            <button
                                key={range}
                                onClick={() => setTimeRange(range)}
                                className={cn(
                                    "px-3 py-1 text-[11px] font-semibold rounded-md transition-all",
                                    timeRange === range
                                        ? "bg-white text-gray-900 shadow-sm"
                                        : "text-gray-500 hover:text-gray-900",
                                )}
                            >
                                {range.toUpperCase()}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                    <StatCard
                        icon="fa-capsules"
                        label="Total Meds"
                        value={stats.totalMedicines}
                        onClick={() => router.get("/medicine-list")}
                    />
                    <StatCard
                        icon="fa-triangle-exclamation"
                        label="Low Stock"
                        value={stats.lowStockCount}
                        tone="warning"
                        onClick={() =>
                            router.get("/medicine-list?filter=lowstock")
                        }
                    />
                    <StatCard
                        icon="fa-circle-xmark"
                        label="Out of Stock"
                        value={stats.outOfStockCount}
                        tone="danger"
                        onClick={() =>
                            router.get("/medicine-list?filter=outofstock")
                        }
                    />
                    <StatCard
                        icon="fa-hourglass-half"
                        label="Expiring"
                        value={stats.expiringSoonCount}
                        tone="warning"
                        onClick={() =>
                            router.get("/medicine-list?filter=expiring")
                        }
                    />
                    <StatCard
                        icon="fa-pills"
                        label="Dispensed"
                        value={stats.dispensedToday}
                        trend={dispensedTrend}
                    />
                    <StatCard
                        icon="fa-truck-fast"
                        label="Received"
                        value={stats.receivedToday}
                        trend={receivedTrend}
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <NeedsAttentionList attention={attention} />

                    <Card className="lg:col-span-2">
                        <CardHeader className="pb-2">
                            <CardTitle>Daily Intake vs Outtake</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <StackedBarChart data={filteredActivity} />
                        </CardContent>
                    </Card>

                    <Card className="lg:col-span-2">
                        <CardHeader className="pb-2">
                            <CardTitle>Category Breakdown</CardTitle>
                        </CardHeader>
                        <CardContent className="flex items-center">
                            <div className="w-1/2">
                                <DonutChart
                                    data={[
                                        {
                                            name: "Antibiotics",
                                            value: 400,
                                            fill: "#3B82F6",
                                        },
                                        {
                                            name: "Vitamins",
                                            value: 300,
                                            fill: "#2E7D64",
                                        },
                                        {
                                            name: "Painkillers",
                                            value: 300,
                                            fill: "#FF4D79",
                                        },
                                        {
                                            name: "Allergies",
                                            value: 200,
                                            fill: "#E67E22",
                                        },
                                    ]}
                                />
                            </div>
                            <div className="w-1/2 space-y-3 pl-4">
                                {[
                                    {
                                        label: "Antibiotics",
                                        value: "40%",
                                        color: "#3B82F6",
                                    },
                                    {
                                        label: "Vitamins",
                                        value: "30%",
                                        color: "#2E7D64",
                                    },
                                    {
                                        label: "Painkillers",
                                        value: "30%",
                                        color: "#FF4D79",
                                    },
                                    {
                                        label: "Allergies",
                                        value: "20%",
                                        color: "#E67E22",
                                    },
                                ].map((item) => (
                                    <div
                                        key={item.label}
                                        className="flex items-center justify-between text-[13px]"
                                    >
                                        <div className="flex items-center gap-2">
                                            <div
                                                className="w-2.5 h-2.5 rounded-full"
                                                style={{
                                                    background: item.color,
                                                }}
                                            />
                                            <span className="text-gray-600 font-medium">
                                                {item.label}
                                            </span>
                                        </div>
                                        <span className="font-bold text-gray-900">
                                            {item.value}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="lg:col-span-1">
                        <CardHeader className="pb-2">
                            <CardTitle>Inventory Health</CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-col items-center justify-center pt-4">
                            <RadialChart
                                data={[
                                    {
                                        name: "Health",
                                        value: 82,
                                        fill: "#2E7D64",
                                    },
                                ]}
                                value="82%"
                                label="Healthy"
                            />
                        </CardContent>
                    </Card>
                </div>

                <RecentDispensingTable recentActivity={recentActivity} />
            </div>
        </AuthenticatedLayout>
    );
}
