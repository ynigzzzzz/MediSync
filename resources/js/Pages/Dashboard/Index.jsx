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

    if (trend.current === 0 && trend.previous === 0) {
        return null;
    }

    if (trend.previous === 0) {
        return {
            direction: "up",
            label: `+${trend.current}`,
        };
    }

    const pct = Math.round(
        ((trend.current - trend.previous) / trend.previous) * 100,
    );

    if (pct === 0) {
        return {
            direction: "flat",
            label: "0% vs yesterday",
        };
    }

    if (pct > 0) {
        return {
            direction: "up",
            label: `+${pct}% vs yesterday`,
        };
    }

    return {
        direction: "down",
        label: `${Math.abs(pct)}% vs yesterday`,
    };
}

export default function Index({
    stats,
    trends,
    attention,
    activity,
    recentActivity,
    categoryBreakdown = [],
    inventoryHealth = {
        percentage: 0,
        usableStock: 0,
        totalStock: 0,
    },
}) {
    const dispensedTrend = computeTrend(trends?.dispensed);
    const receivedTrend = computeTrend(trends?.received);

    const [timeRange, setTimeRange] = useState("14d");

    // Daily activity filter
    const filteredActivity = useMemo(() => {
        if (!activity) return [];

        if (timeRange === "7d") {
            return activity.slice(-7);
        }

        if (timeRange === "14d") {
            return activity.slice(-14);
        }

        return activity;
    }, [activity, timeRange]);

    // Category data
    const categories = Array.isArray(categoryBreakdown)
        ? categoryBreakdown
        : [];

    // Display only the top 5 categories.
    // Combine all remaining categories into Others.
    const topCategories = useMemo(() => {
        const sorted = [...categories].sort(
            (a, b) => Number(b.value ?? 0) - Number(a.value ?? 0),
        );

        const topFive = sorted.slice(0, 5);
        const remaining = sorted.slice(5);

        if (remaining.length === 0) {
            return topFive;
        }

        const othersValue = remaining.reduce(
            (total, item) => total + Number(item.value ?? 0),
            0,
        );

        const othersPercentage = remaining.reduce(
            (total, item) => total + Number(item.percentage ?? 0),
            0,
        );

        return [
            ...topFive,
            {
                name: "Others",
                value: othersValue,
                percentage: othersPercentage,
                fill: "#94A3B8",
            },
        ];
    }, [categories]);

    // Inventory health
    const healthPercentage = Math.min(
        100,
        Math.max(0, Number(inventoryHealth?.percentage ?? 0)),
    );

    return (
        <AuthenticatedLayout>
            <Head title="Dashboard" />

            <div className="w-full min-w-0 overflow-x-hidden">
                {/* PAGE HEADER */}
                <div className="mb-5">
                    <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
                        Dashboard
                    </h1>

                    <p className="text-[13px] text-gray-500">
                        Overview of pharmacy operations and recent activity.
                    </p>
                </div>

                {/* STATISTICS */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-4">
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
                            router.get("/medicine-list", {
                                filter: "lowstock",
                            })
                        }
                    />

                    <StatCard
                        icon="fa-circle-xmark"
                        label="Out of Stock"
                        value={stats.outOfStockCount}
                        tone="danger"
                        onClick={() =>
                            router.get("/medicine-list", {
                                filter: "outofstock",
                            })
                        }
                    />

                    <StatCard
                        icon="fa-hourglass-half"
                        label="Expiring"
                        value={stats.expiringSoonCount}
                        tone="warning"
                        onClick={() =>
                            router.get("/medicine-list", {
                                filter: "expiring",
                            })
                        }
                    />

                    <StatCard
                        icon="fa-ban"
                        label="Expired"
                        value={stats.expiredCount}
                        tone="danger"
                        onClick={() =>
                            router.get("/medicine-list", {
                                filter: "expired",
                            })
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

                    <StatCard
                        icon="fa-users"
                        label="Active Users"
                        value={stats.totalUsers}
                        tone="success"
                        onClick={() =>
                            router.get("/user-management", {
                                status: "active",
                                role: "all",
                            })
                        }
                    />
                </div>

                {/* NEEDS ATTENTION AND DAILY ACTIVITY */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
                    <NeedsAttentionList attention={attention} />

                    {/* DAILY INTAKE VS OUTTAKE */}
                    <Card className="lg:col-span-2 min-w-0">
                        <CardHeader className="pb-2 flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Daily Intake vs Outtake</CardTitle>
                            </div>

                            <div className="flex bg-gray-100 p-1 rounded-lg">
                                {["7d", "14d", "30d"].map((range) => (
                                    <button
                                        key={range}
                                        type="button"
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
                        </CardHeader>

                        <CardContent>
                            <StackedBarChart data={filteredActivity} />
                        </CardContent>
                    </Card>
                </div>

                {/* CATEGORY BREAKDOWN AND INVENTORY HEALTH */}
                {/* IMPORTANT: This is a separate grid. */}

                {/* CATEGORY BREAKDOWN AND INVENTORY HEALTH */}
                <div className="grid grid-cols-1 lg:grid-cols-3 items-stretch gap-4 mb-4">
                    {/* CATEGORY BREAKDOWN */}
                    <Card className="lg:col-span-2 min-w-0 h-full flex flex-col">
                        <CardHeader className="pb-2">
                            <CardTitle>Category Breakdown</CardTitle>

                            <p className="text-xs text-gray-500">
                                Top 5 categories by number of medicines.
                            </p>
                        </CardHeader>

                        <CardContent className="flex flex-1 flex-col sm:flex-row sm:items-center gap-4">
                            {topCategories.length > 0 ? (
                                <>
                                    {/* DONUT CHART */}
                                    <div className="w-full sm:w-[42%] min-w-0">
                                        <DonutChart
                                            data={topCategories}
                                            innerRadius={65}
                                            outerRadius={85}
                                        />
                                    </div>

                                    {/* CATEGORY LEGEND */}
                                    <div className="w-full sm:w-[58%] min-w-0 space-y-3">
                                        {topCategories.map((item) => (
                                            <div
                                                key={item.name}
                                                className="flex items-center justify-between gap-3 text-[13px]"
                                            >
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <div
                                                        className="w-2.5 h-2.5 rounded-full shrink-0"
                                                        style={{
                                                            background:
                                                                item.fill,
                                                        }}
                                                    />

                                                    <span className="text-gray-600 font-medium truncate">
                                                        {item.name}
                                                    </span>
                                                </div>

                                                <span className="font-bold text-gray-900 shrink-0">
                                                    {Number(
                                                        item.percentage ?? 0,
                                                    ).toFixed(1)}
                                                    %
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            ) : (
                                <div className="w-full py-12 text-center text-sm text-gray-500">
                                    No medicine categories available.
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* INVENTORY HEALTH */}
                    <Card className="lg:col-span-1 min-w-0 h-full flex flex-col">
                        <CardHeader className="pb-1">
                            <CardTitle>Inventory Health</CardTitle>
                        </CardHeader>

                        <CardContent className="flex flex-1 flex-col items-center justify-center pt-2 pb-5">
                            {/* RADIAL CHART */}
                            <div className="w-full max-w-[260px]">
                                <RadialChart
                                    data={[
                                        {
                                            name: "Usable Stock",
                                            value: healthPercentage,
                                        },
                                    ]}
                                    value={`${healthPercentage.toFixed(1)}%`}
                                    label="Usable Stock"
                                    color="#2E7D64"
                                />
                            </div>

                            {/* INVENTORY DETAILS */}
                            <p className="text-xs text-gray-500 text-center mt-1 max-w-[280px] leading-relaxed">
                                {Number(
                                    inventoryHealth.usableStock ?? 0,
                                ).toLocaleString()}{" "}
                                of{" "}
                                {Number(
                                    inventoryHealth.totalStock ?? 0,
                                ).toLocaleString()}{" "}
                                units are unexpired and undisposed.
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* RECENT DISPENSING */}
                <RecentDispensingTable recentActivity={recentActivity} />
            </div>
        </AuthenticatedLayout>
    );
}
