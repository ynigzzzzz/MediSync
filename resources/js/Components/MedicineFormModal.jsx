import { useEffect } from "react";
import { useForm } from "@inertiajs/react";
import Modal from "@/Components/Modal";
import { SearchableSelect } from "@/Components/ui/searchable-select";

const inputCls =
    "w-full rounded-xl border border-transparent bg-[#F2F2F7] px-3 py-2.5 text-[14px] text-gray-900 placeholder-gray-400 focus:border-[#FF4D79] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF4D79]/20 transition-all";

const DEFAULT_TYPES = [
    "Tablet",
    "Capsule",
    "Syrup",
    "Suspension",
    "Injection",
    "Ointment",
    "Drops",
];
const DEFAULT_CATEGORIES = [
    "Allergies",
    "Stomach Pain",
    "Headache",
    "Fever",
    "Cough",
    "Antibiotic",
    "Vitamins",
];

export default function MedicineFormModal({
    open,
    onOpenChange,
    medicine = null,
    types = [],
    categories = [],
}) {
    const form = useForm({
        generic_name: "",
        brand_name: "",
        type: "",
        category: "",
        dosage: "",
        price: "",
    });

    const allTypes = [...new Set([...DEFAULT_TYPES, ...types])];
    const allCategories = [...new Set([...DEFAULT_CATEGORIES, ...categories])];

    useEffect(() => {
        if (open && medicine) {
            form.setData({
                generic_name: medicine.generic_name ?? "",
                brand_name: medicine.brand_name ?? "",
                type: medicine.type ?? "",
                category: medicine.category ?? "",
                dosage: medicine.dosage ?? "",
                price: medicine.price ?? "",
            });
            form.clearErrors();
        }
    }, [open, medicine]);

    function submit(e) {
        e.preventDefault();
        if (!medicine) return;

        form.put(`/medicine-list/${medicine.medicine_id}`, {
            preserveScroll: true,
            onSuccess: () => onOpenChange(false),
        });
    }

    return (
        <Modal show={open} onClose={() => onOpenChange(false)} maxWidth="md">
            <div className="p-6">
                <h2 className="text-lg font-semibold mb-4 text-gray-900">
                    Edit Medicine
                </h2>

                <form onSubmit={submit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">
                                Generic Name
                                <span className="text-critical-red">*</span>
                            </label>
                            <input
                                className={inputCls}
                                value={form.data.generic_name}
                                onChange={(e) =>
                                    form.setData("generic_name", e.target.value)
                                }
                                required
                            />
                            {form.errors.generic_name && (
                                <p className="text-red-500 text-[11px] mt-1">
                                    {form.errors.generic_name}
                                </p>
                            )}
                        </div>
                        <div>
                            <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">
                                Brand Name
                                <span className="text-critical-red">*</span>
                            </label>
                            <input
                                className={inputCls}
                                value={form.data.brand_name}
                                onChange={(e) =>
                                    form.setData("brand_name", e.target.value)
                                }
                                required
                            />
                            {form.errors.brand_name && (
                                <p className="text-red-500 text-[11px] mt-1">
                                    {form.errors.brand_name}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">
                                Type<span className="text-critical-red">*</span>
                            </label>
                            <SearchableSelect
                                value={form.data.type}
                                onChange={(val) => form.setData("type", val)}
                                options={allTypes}
                                placeholder="Select type..."
                                allowCustom={true}
                            />
                            {form.errors.type && (
                                <p className="text-red-500 text-[11px] mt-1">
                                    {form.errors.type}
                                </p>
                            )}
                        </div>
                        <div>
                            <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">
                                Category
                                <span className="text-critical-red">*</span>
                            </label>
                            <SearchableSelect
                                value={form.data.category}
                                onChange={(val) =>
                                    form.setData("category", val)
                                }
                                options={allCategories}
                                placeholder="Select category..."
                                allowCustom={true}
                            />
                            {form.errors.category && (
                                <p className="text-red-500 text-[11px] mt-1">
                                    {form.errors.category}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">
                                Dosage
                                <span className="text-critical-red">*</span>
                            </label>
                            <input
                                className={inputCls}
                                value={form.data.dosage}
                                onChange={(e) =>
                                    form.setData("dosage", e.target.value)
                                }
                                required
                                placeholder="e.g. 500mg"
                            />
                            {form.errors.dosage && (
                                <p className="text-red-500 text-[11px] mt-1">
                                    {form.errors.dosage}
                                </p>
                            )}
                        </div>
                        <div>
                            <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">
                                Selling Price (₱)
                                <span className="text-critical-red">*</span>
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                className={inputCls}
                                value={form.data.price}
                                onChange={(e) =>
                                    form.setData("price", e.target.value)
                                }
                                required
                            />
                            {form.errors.price && (
                                <p className="text-red-500 text-[11px] mt-1">
                                    {form.errors.price}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="flex justify-end pt-4 mt-6 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={() => onOpenChange(false)}
                            className="mr-3 px-5 py-2 rounded-full text-[13px] font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={form.processing}
                            className="rounded-full bg-gray-900 text-white px-6 py-2 text-[13px] font-semibold hover:bg-black transition-colors disabled:opacity-50"
                        >
                            {form.processing ? "Saving..." : "Save Changes"}
                        </button>
                    </div>
                </form>
            </div>
        </Modal>
    );
}
