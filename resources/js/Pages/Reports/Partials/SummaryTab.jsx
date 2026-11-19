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

export default function SummaryTab({ overall }) {
    const uncostedUnits = Number(
        overall?.uncosted_dispensed_units || 0,
    );

    const coverage = Number(
        overall?.cogs_coverage_percentage || 0,
    );

    return (
        <div className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <StatCard
                    icon="fa-sack-dollar"
                    label="Total Revenue"
                    value={peso(overall?.total_revenue)}
                    tone="success"
                    tooltip="Total sales from dispensing medicines."
                />

                <StatCard
                    icon="fa-money-bill-transfer"
                    label="Total Spent"
                    value={peso(overall?.total_spent)}
                    tone="danger"
                    tooltip="Total recorded purchasing cost of received inventory."
                />

                <StatCard
                    icon="fa-chart-line"
                    label="Gross Profit"
                    value={peso(overall?.profit)}
                    tone={overall?.profit >= 0 ? "success" : "danger"}
                    tooltip={`Revenue minus batch-linked cost of goods sold. COGS coverage: ${coverage}%. ${uncostedUnits.toLocaleString()} dispensed units have no valid batch cost and are excluded. Operating expenses are not included.`}
                />

                <StatCard
                    icon="fa-boxes-stacked"
                    label="Units Dispensed"
                    value={overall?.total_dispensed_units?.toLocaleString()}
                    tooltip={`${overall?.total_received_units?.toLocaleString()} units received in total.`}
                />
            </div>

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
                            data={
                                overall?.top_medicines?.map((medicine, index) => ({
                                    name: medicine.name,
                                    value: medicine.value,
                                    fill: [
                                        "#3B82F6",
                                        "#2E7D64",
                                        "#FF4D79",
                                        "#E67E22",
                                        "#8B5CF6",
                                    ][index % 5],
                                })) || []
                            }
                        />

                        <div className="w-full mt-4 space-y-2">
                            {overall?.top_medicines?.map((medicine, index) => (
                                <div
                                    key={`${medicine.name}-${index}`}
                                    className="flex justify-between text-[12px]"
                                >
                                    <div className="flex items-center gap-2">
                                        <div
                                            className="w-2 h-2 rounded-full"
                                            style={{
                                                background: [
                                                    "#3B82F6",
                                                    "#2E7D64",
                                                    "#FF4D79",
                                                    "#E67E22",
                                                    "#8B5CF6",
                                                ][index % 5],
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
                                    units: overall?.total_received_units || 0,
                                },
                                {
                                    name: "Dispensed",
                                    units: overall?.total_dispensed_units || 0,
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
