import { useState } from "react";
import { Head, router } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/Components/ui/tabs";
import { DateRangePicker } from "@/Components/ui/date-range-picker";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/Components/ui/dropdown-menu";

// Import the Partials
import SummaryTab from "./Partials/SummaryTab";
import DeletionsTab from "./Partials/DeletionsTab";
import InventoryTab from "./Partials/InventoryTab"; // Assuming you created this
import ReceivingTab from "./Partials/ReceivingTab"; // Assuming you created this
import DispensingTab from "./Partials/DispensingTab"; // Assuming you created this
import SuppliersTab from "./Partials/SuppliersTab"; // Assuming you created this

export default function Index({
    inventory,
    receiving,
    dispensing,
    supplierSummary,
    deletions,
    overall,
    range,
    filters,
}) {
    const [tab, setTab] = useState("summary");
    const [dateRange, setDateRange] = useState({
        from: new Date(range.from),
        to: new Date(range.to),
    });

    function applyFilters(overrides = {}) {
        const fmt = (d) =>
            `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
        const params = {
            from: dateRange?.from ? fmt(dateRange.from) : range.from,
            to: dateRange?.to ? fmt(dateRange.to) : range.to,
            category: "all",
            supplier_id: "all",
            user_id: "all",
            ...overrides,
        };
        router.get("/reports", params, {
            preserveState: true,
            preserveScroll: true,
        });
    }

    function openPrint() {
        window.open(
            `/reports/print?${new URLSearchParams({ tab, from: range.from, to: range.to }).toString()}`,
            "_blank",
        );
    }

    return (
        <AuthenticatedLayout>
            <Head title="Reports" />

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
                        Reports
                    </h1>
                    <p className="text-[13px] text-gray-500">
                        Read-only summaries — inventory, receiving, dispensing
                        and suppliers.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {(tab === "receiving" ||
                        tab === "dispensing" ||
                        tab === "deletions") && (
                        <DateRangePicker
                            dateRange={dateRange}
                            onChange={(r) => {
                                setDateRange(r);
                                applyFilters({ from: r.from, to: r.to });
                            }}
                        />
                    )}
                    {tab !== "summary" && tab !== "deletions" && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button className="rounded-full bg-gray-900 text-white text-[13px] font-semibold px-4 py-2 hover:bg-black transition-colors shadow-sm flex items-center gap-2">
                                    Export{" "}
                                    <i className="fas fa-chevron-down text-[10px] opacity-70" />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem onClick={openPrint}>
                                    <i className="fas fa-print mr-2 text-gray-400" />{" "}
                                    Print / Save PDF
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>
            </div>

            <Tabs value={tab} onValueChange={setTab}>
                <TabsList className="border-b-0 mb-5 bg-gray-100 p-1 rounded-xl inline-flex flex-wrap w-full md:w-auto">
                    <TabsTrigger
                        value="summary"
                        className="rounded-lg px-4 py-1.5 text-[13px] font-semibold text-gray-500 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm transition-all"
                    >
                        <i className="fas fa-chart-pie mr-2 opacity-50" />{" "}
                        Summary
                    </TabsTrigger>
                    <TabsTrigger
                        value="inventory"
                        className="rounded-lg px-4 py-1.5 text-[13px] font-semibold text-gray-500 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm transition-all"
                    >
                        <i className="fas fa-capsules mr-2 opacity-50" />{" "}
                        Inventory
                    </TabsTrigger>
                    <TabsTrigger
                        value="receiving"
                        className="rounded-lg px-4 py-1.5 text-[13px] font-semibold text-gray-500 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm transition-all"
                    >
                        <i className="fas fa-arrow-down mr-2 opacity-50" />{" "}
                        Receiving
                    </TabsTrigger>
                    <TabsTrigger
                        value="dispensing"
                        className="rounded-lg px-4 py-1.5 text-[13px] font-semibold text-gray-500 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm transition-all"
                    >
                        <i className="fas fa-arrow-up mr-2 opacity-50" />{" "}
                        Dispensing
                    </TabsTrigger>
                    <TabsTrigger
                        value="suppliers"
                        className="rounded-lg px-4 py-1.5 text-[13px] font-semibold text-gray-500 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm transition-all"
                    >
                        <i className="fas fa-truck mr-2 opacity-50" /> Suppliers
                    </TabsTrigger>
                    <TabsTrigger
                        value="deletions"
                        className="rounded-lg px-4 py-1.5 text-[13px] font-semibold text-gray-500 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm transition-all"
                    >
                        <i className="fas fa-trash-can mr-2 opacity-50" />{" "}
                        Deletions
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="summary" className="mt-0">
                    <SummaryTab overall={overall} />
                </TabsContent>
                <TabsContent value="inventory" className="mt-0">
                    <InventoryTab inventory={inventory} />
                </TabsContent>
                <TabsContent value="receiving" className="mt-0">
                    <ReceivingTab receiving={receiving} />
                </TabsContent>
                <TabsContent value="dispensing" className="mt-0">
                    <DispensingTab dispensing={dispensing} />
                </TabsContent>
                <TabsContent value="suppliers" className="mt-0">
                    <SuppliersTab supplierSummary={supplierSummary} />
                </TabsContent>
                <TabsContent value="deletions" className="mt-0">
                    <DeletionsTab deletions={deletions} />
                </TabsContent>
            </Tabs>
        </AuthenticatedLayout>
    );
}
