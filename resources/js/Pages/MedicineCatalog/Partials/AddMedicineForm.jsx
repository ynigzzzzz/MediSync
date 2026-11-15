import { useForm } from "@inertiajs/react";
import { SearchableSelect } from "@/Components/ui/searchable-select";

const inputCls =
    "w-full rounded-xl border border-transparent bg-[#F2F2F7] px-3 py-2 text-[14px] text-gray-900 focus:border-[#FF4D79] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF4D79]/20 transition-all";
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

export default function AddMedicineForm({
    onClose,
    types = [],
    categories = [],
}) {
    const { data, setData, post, processing, errors, reset } = useForm({
        generic_name: "",
        brand_name: "",
        type: "",
        category: "",
        dosage: "",
        price: "",
    });

    const allTypes = [...new Set([...DEFAULT_TYPES, ...types])];
    const allCategories = [...new Set([...DEFAULT_CATEGORIES, ...categories])];

    function submit(e) {
        e.preventDefault();
        post("/medicine-list", {
            onSuccess: () => {
                reset();
                onClose();
            },
        });
    }

    return (
        <div className="bg-white rounded-[16px] shadow-sm border border-gray-100 p-6 mb-4 animate-in fade-in slide-in-from-top-4">
            <h2 className="font-semibold text-gray-900 text-[15px] mb-5">
                Add New Medicine
            </h2>
            <form
                onSubmit={submit}
                className="grid grid-cols-1 md:grid-cols-3 gap-5"
            >
                <div>
                    <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">
                        Generic Name<span className="text-critical-red">*</span>
                    </label>
                    <input
                        className={inputCls}
                        value={data.generic_name}
                        onChange={(e) =>
                            setData("generic_name", e.target.value)
                        }
                        required
                    />
                </div>
                <div>
                    <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">
                        Brand Name<span className="text-critical-red">*</span>
                    </label>
                    <input
                        className={inputCls}
                        value={data.brand_name}
                        onChange={(e) => setData("brand_name", e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">
                        Dosage<span className="text-critical-red">*</span>
                    </label>
                    <input
                        className={inputCls}
                        value={data.dosage}
                        onChange={(e) => setData("dosage", e.target.value)}
                        required
                        placeholder="e.g. 500mg"
                    />
                </div>
                <div>
                    <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">
                        Type<span className="text-critical-red">*</span>
                    </label>
                    <SearchableSelect
                        value={data.type}
                        onChange={(val) => setData("type", val)}
                        options={allTypes}
                        placeholder="Select type..."
                        allowCustom={true}
                    />
                </div>
                <div>
                    <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">
                        Category<span className="text-critical-red">*</span>
                    </label>
                    <SearchableSelect
                        value={data.category}
                        onChange={(val) => setData("category", val)}
                        options={allCategories}
                        placeholder="Select category..."
                        allowCustom={true}
                    />
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
                        value={data.price}
                        onChange={(e) => setData("price", e.target.value)}
                        required
                    />
                </div>
                <div className="md:col-span-3 flex justify-end mt-2">
                    <button
                        type="submit"
                        disabled={processing}
                        className="rounded-full bg-[#FF4D79] text-white text-[14px] font-semibold px-8 py-2.5 hover:bg-[#E63E66] transition-colors shadow-sm"
                    >
                        {processing ? "Saving..." : "Save Medicine"}
                    </button>
                </div>
            </form>
        </div>
    );
}
