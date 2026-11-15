import { useForm } from "@inertiajs/react";

const inputCls =
    "w-full rounded-xl border border-transparent bg-[#F2F2F7] px-3 py-2 text-[14px] text-gray-900 focus:border-[#FF4D79] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF4D79]/20 transition-all";

export default function AddMedicineForm({ onClose }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        generic_name: "",
        brand_name: "",
        type: "",
        category: "",
        dosage: "",
        price: "",
    });

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
                    {errors.generic_name && (
                        <p className="text-red-500 text-[11px] mt-1">
                            {errors.generic_name}
                        </p>
                    )}
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
                    {errors.brand_name && (
                        <p className="text-red-500 text-[11px] mt-1">
                            {errors.brand_name}
                        </p>
                    )}
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
                    {errors.dosage && (
                        <p className="text-red-500 text-[11px] mt-1">
                            {errors.dosage}
                        </p>
                    )}
                </div>
                <div>
                    <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">
                        Type<span className="text-critical-red">*</span>
                    </label>
                    <input
                        className={inputCls}
                        value={data.type}
                        onChange={(e) => setData("type", e.target.value)}
                        required
                        placeholder="e.g. Tablet"
                    />
                    {errors.type && (
                        <p className="text-red-500 text-[11px] mt-1">
                            {errors.type}
                        </p>
                    )}
                </div>
                <div>
                    <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">
                        Category<span className="text-critical-red">*</span>
                    </label>
                    <input
                        className={inputCls}
                        value={data.category}
                        onChange={(e) => setData("category", e.target.value)}
                        required
                        placeholder="e.g. Antibiotic"
                    />
                    {errors.category && (
                        <p className="text-red-500 text-[11px] mt-1">
                            {errors.category}
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
                        value={data.price}
                        onChange={(e) => setData("price", e.target.value)}
                        required
                    />
                    {errors.price && (
                        <p className="text-red-500 text-[11px] mt-1">
                            {errors.price}
                        </p>
                    )}
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
