
import { useState } from "react";
import { router } from "@inertiajs/react";

import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
} from "@/Components/ui/card";

import Badge from "@/Components/Badge";

function formatDate(value) {
    if (!value) return "—";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "—";

    return date.toLocaleString();
}

export default function DeletionsTab({
    deletions = { total: 0, rows: [] },
    deletedMedicines = [],
}) {
    const [restoringId, setRestoringId] = useState(null);

    const deletionRows = deletions?.rows ?? [];
    const medicines = Array.isArray(deletedMedicines)
        ? deletedMedicines
        : [];

    function handleRestore(medicine) {
        const medicineId = medicine.medicine_id;

        if (!medicineId || restoringId !== null) return;

        const confirmed = window.confirm(
            `Are you sure you want to restore ${medicine.generic_name}?`
        );

        if (!confirmed) return;

        router.post(
            `/reports/deleted-medicines/${medicineId}/restore`,
            {},
            {
                preserveScroll: true,

                onStart: () => {
                    setRestoringId(medicineId);
                },

                onFinish: () => {
                    setRestoringId(null);
                },
            }
        );
    }

    return (
        <div className="mt-0 space-y-4">

            {/* CURRENTLY DELETED MEDICINES */}

            <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div>
                            <CardTitle>
                                Deleted Medicines
                            </CardTitle>

                            <CardDescription>
                                Medicines that have been deleted and
                                are available for restoration.
                            </CardDescription>
                        </div>

                        <span className="inline-flex items-center rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                            {medicines.length} deleted
                        </span>
                    </div>
                </CardHeader>

                <CardContent className="p-0 overflow-x-auto">
                    <table className="w-full min-w-[1100px] text-left text-[13px]">

                        <thead>
                            <tr className="border-b border-gray-100">
                                {[
                                    "Date Deleted",
                                    "Medicine",
                                    "Brand",
                                    "Category",
                                    "Dosage",
                                    "Deleted By",
                                    "Reason",
                                    "Action",
                                ].map((heading) => (
                                    <th
                                        key={heading}
                                        className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500"
                                    >
                                        {heading}
                                    </th>
                                ))}
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-gray-50">
                            {medicines.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={8}
                                        className="px-4 py-10 text-center text-gray-400"
                                    >
                                        <div className="flex flex-col items-center gap-2">
                                            <i className="fas fa-trash-can text-2xl opacity-30" />

                                            <span>
                                                No deleted medicines available for restoration.
                                            </span>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                medicines.map((medicine) => (
                                    <tr
                                        key={medicine.medicine_id}
                                        className="hover:bg-gray-50/50 transition-colors"
                                    >
                                        <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                                            {formatDate(medicine.deleted_at)}
                                        </td>

                                        <td className="px-4 py-3 font-semibold text-gray-900">
                                            {medicine.generic_name}
                                        </td>

                                        <td className="px-4 py-3 text-gray-600">
                                            {medicine.brand_name || "—"}
                                        </td>

                                        <td className="px-4 py-3 text-gray-600">
                                            {medicine.category || "—"}
                                        </td>

                                        <td className="px-4 py-3 text-gray-600">
                                            {medicine.dosage || "—"}
                                        </td>

                                        <td className="px-4 py-3 text-gray-600">
                                            {medicine.deleted_by || "Unknown"}
                                        </td>

                                        <td className="px-4 py-3 text-gray-600 italic">
                                            {medicine.reason || "—"}
                                        </td>

                                        <td className="px-4 py-3">
                                            <button
                                                type="button"
                                                disabled={restoringId !== null}
                                                onClick={() =>
                                                    handleRestore(medicine)
                                                }
                                                className="inline-flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
                                            >
                                                <i className="fas fa-rotate-left" />

                                                {restoringId === medicine.medicine_id
                                                    ? "Restoring..."
                                                    : "Restore"}
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </CardContent>
            </Card>

            {/* ORIGINAL DELETION HISTORY */}

            <Card>
                <CardHeader>
                    <CardTitle>
                        Deletion History
                    </CardTitle>

                    <CardDescription>
                        {deletions.total} deletion(s) recorded in this period.
                    </CardDescription>
                </CardHeader>

                <CardContent className="p-0 overflow-x-auto">
                    <table className="w-full min-w-[800px] text-left text-[13px]">

                        <thead>
                            <tr className="border-b border-gray-100">
                                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                                    Date
                                </th>

                                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                                    Type
                                </th>

                                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                                    Description
                                </th>

                                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                                    Reason
                                </th>

                                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                                    Deleted By
                                </th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-gray-50">
                            {deletionRows.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={5}
                                        className="px-4 py-8 text-center text-gray-400"
                                    >
                                        No deletions in this period.
                                    </td>
                                </tr>
                            ) : (
                                deletionRows.map((d) => (
                                    <tr
                                        key={d.log_id}
                                        className="hover:bg-gray-50/50 transition-colors"
                                    >
                                        <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                                            {formatDate(d.created_at)}
                                        </td>

                                        <td className="px-4 py-3">
                                            <Badge
                                                tone={
                                                    d.type === "Stock-In"
                                                        ? "success"
                                                        : d.type === "Stock-Out"
                                                          ? "warning"
                                                          : d.type === "Medicine"
                                                            ? "rose"
                                                            : d.type === "Supplier"
                                                              ? "neutral"
                                                              : "danger"
                                                }
                                                outline
                                            >
                                                {d.type}
                                            </Badge>
                                        </td>

                                        <td className="px-4 py-3 text-gray-900">
                                            {d.description}
                                        </td>

                                        <td className="px-4 py-3 text-gray-600 italic">
                                            {d.reason}
                                        </td>

                                        <td className="px-4 py-3 text-gray-600">
                                            {d.user_name}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </CardContent>
            </Card>
        </div>
    );
}
