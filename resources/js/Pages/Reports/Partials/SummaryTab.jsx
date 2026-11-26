import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
} from "@/Components/ui/card";
import StatCard from "@/Components/StatCard";
import { DonutChart } from "@/Components/Charts/DonutChart";
import { BarChart } from "@/Components/Charts/BarChart";

function peso(n) {
    return (
        "₱" +
        Number(n || 0).toLocaleString("en-PH", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })
    );
}

function percentage(value) {
    if (value === null || value === undefined) {
        return "N/A";
    }

    return `${Number(value).toFixed(1)}%`;
}

export default function SummaryTab({ overall }) {
    const uncostedUnits = Number(overall?.uncosted_dispensed_units || 0);

    const uncostedRevenue = Number(overall?.uncosted_revenue || 0);

    const unitCoverage = overall?.cogs_coverage_percentage;

    const revenueCoverage = overall?.cogs_revenue_coverage_percentage;

    const grossProfit = Number(overall?.profit || 0);

    const isPartial = Boolean(overall?.profit_is_partial);

    const totalDispensed = Number(overall?.total_dispensed_units || 0);

    const colors = ["#3B82F6", "#2E7D64", "#FF4D79", "#E67E22", "#8B5CF6"];

    const topMedicines = overall?.top_medicines || [];

    const grossProfitTooltip =
        totalDispensed === 0
            ? "No dispensing transactions have been recorded."
            : `Gross profit from costed sales only: costed revenue minus COGS. Revenue coverage: ${percentage(revenueCoverage)}. Unit coverage: ${percentage(unitCoverage)}. Uncosted revenue: ${peso(uncostedRevenue)}. Uncosted units: ${uncostedUnits.toLocaleString()}. Operating expenses are not included.`;

    return (
        <div className="mt-0">
            {/* Financial Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <StatCard
                    icon="fa-sack-dollar"
                    label="Total Revenue"
                    value={peso(overall?.total_revenue)}
                    tone="success"
                    tooltip="Total recorded sales revenue from all dispensing transactions."
                />

                <StatCard
                    icon="fa-money-bill-transfer"
                    label="Total Spent"
                    value={peso(overall?.total_spent)}
                    tone="danger"
                    tooltip="Total recorded acquisition cost of all received inventory. This is purchasing cost, not cost of goods sold."
                />

                <StatCard
                    icon="fa-chart-line"
                    label={isPartial ? "Gross Profit*" : "Gross Profit"}
                    value={peso(grossProfit)}
                    tone={grossProfit >= 0 ? "success" : "danger"}
                    tooltip={grossProfitTooltip}
                />

                <StatCard
                    icon="fa-boxes-stacked"
                    label="Units Dispensed"
                    value={totalDispensed.toLocaleString()}
                    tooltip={`${Number(overall?.total_received_units || 0).toLocaleString()} units received in total.`}
                />
            </div>

            {/* Gross Profit Qualification */}
            {isPartial && (
                <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                    <div className="flex items-start gap-2">
                        <i className="fas fa-triangle-exclamation text-amber-600 mt-0.5" />

                        <div>
                            <p className="text-[13px] font-semibold text-amber-900">
                                Gross Profit Is Partially Calculated
                            </p>

                            <p className="text-[12px] text-amber-800 mt-1">
                                Some dispensing transactions have no verified
                                acquisition cost. These transactions are
                                excluded from the gross profit calculation.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Cost Coverage */}
            <Card className="mb-4">
                <CardHeader>
                    <CardTitle>Cost Coverage</CardTitle>
                    <CardDescription>
                        Completeness of recorded acquisition costs for
                        dispensing transactions.
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div>
                            <p className="text-[12px] text-gray-500 mb-1">
                                Unit-Based Coverage
                            </p>

                            <p className="text-2xl font-bold text-gray-900">
                                {percentage(unitCoverage)}
                            </p>

                            <p className="text-[11px] text-gray-500 mt-1">
                                {Number(
                                    overall?.costed_dispensed_units || 0,
                                ).toLocaleString()}{" "}
                                of {totalDispensed.toLocaleString()} dispensed
                                units have verified batch costs.
                            </p>
                        </div>

                        <div>
                            <p className="text-[12px] text-gray-500 mb-1">
                                Revenue-Based Coverage
                            </p>

                            <p className="text-2xl font-bold text-gray-900">
                                {percentage(revenueCoverage)}
                            </p>

                            <p className="text-[11px] text-gray-500 mt-1">
                                Revenue supported by verified batch acquisition
                                costs.
                            </p>
                        </div>
                    </div>

                    {uncostedUnits > 0 && (
                        <div className="mt-4 pt-4 border-t border-gray-100">
                            <p className="text-[12px] text-gray-600">
                                <strong>Uncosted Dispensing:</strong>{" "}
                                {uncostedUnits.toLocaleString()} units
                            </p>

                            <p className="text-[12px] text-gray-600 mt-1">
                                <strong>Uncosted Revenue:</strong>{" "}
                                {peso(uncostedRevenue)}
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
                <Card className="lg:col-span-1">
                    <CardHeader>
                        <CardTitle>Most Dispensed</CardTitle>

                        <CardDescription>
                            All-time top 5 medicines.
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="flex flex-col items-center">
                        <DonutChart
                            data={topMedicines.map((medicine, index) => ({
                                name: medicine.name,
                                value: medicine.value,
                                fill: colors[index % colors.length],
                            }))}
                        />

                        <div className="w-full mt-4 space-y-2">
                            {topMedicines.map((medicine, index) => (
                                <div
                                    key={`${medicine.name}-${index}`}
                                    className="flex justify-between text-[12px]"
                                >
                                    <div className="flex items-center gap-2">
                                        <div
                                            className="w-2 h-2 rounded-full"
                                            style={{
                                                background:
                                                    colors[
                                                        index % colors.length
                                                    ],
                                            }}
                                        />

                                        <span className="text-gray-600">
                                            {medicine.name}
                                        </span>
                                    </div>

                                    <span className="font-semibold text-gray-900">
                                        {medicine.value} units
                                    </span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Operational Summary</CardTitle>

                        <CardDescription>
                            All-time receiving vs dispensing totals.
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="flex items-center justify-center h-[250px]">
                        <BarChart
                            data={[
                                {
                                    name: "Received",
                                    units: Number(
                                        overall?.total_received_units || 0,
                                    ),
                                },
                                {
                                    name: "Dispensed",
                                    units: totalDispensed,
                                },
                            ]}
                            xKey="name"
                            yKey="units"
                            label="Total Volume"
                            color="#3B82F6"
                        />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
