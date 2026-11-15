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
                    tooltip="Total cash spent receiving inventory."
                />
                <StatCard
                    icon="fa-chart-line"
                    label="Net Profit"
                    value={peso(overall?.profit)}
                    tone={overall?.profit >= 0 ? "success" : "danger"}
                    tooltip="Revenue minus the cost of the items sold."
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
                                overall?.top_medicines?.map((m, i) => ({
                                    name: m.name,
                                    value: m.value,
                                    fill: [
                                        "#3B82F6",
                                        "#2E7D64",
                                        "#FF4D79",
                                        "#E67E22",
                                        "#8B5CF6",
                                    ][i % 5],
                                })) || []
                            }
                        />
                        <div className="w-full mt-4 space-y-2">
                            {overall?.top_medicines?.map((m, i) => (
                                <div
                                    key={m.name}
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
                                                ][i % 5],
                                            }}
                                        />
                                        <span className="text-gray-600">
                                            {m.name}
                                        </span>
                                    </div>
                                    <span className="font-semibold text-gray-900">
                                        {m.value} units
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
