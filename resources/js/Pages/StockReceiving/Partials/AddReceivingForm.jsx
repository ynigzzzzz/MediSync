import { useForm, usePage } from "@inertiajs/react";
import { SearchableSelect } from "@/Components/ui/searchable-select";

const inputCls =
    "w-full rounded-xl border border-transparent bg-[#F2F2F7] px-3 py-2.5 text-[14px] text-gray-900 placeholder-gray-400 focus:border-[#FF4D79] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF4D79]/20 transition-all";
const lockedCls =
    "w-full rounded-xl border border-transparent bg-gray-100 px-3 py-2.5 text-[14px] text-gray-500 cursor-not-allowed";

export default function AddReceivingForm({ medicines, suppliers, onClose }) {
    const { errors } = usePage().props;

    const { data, setData, post, processing, reset } = useForm({
        medicine_id: "",
        supplier_id: "",
        batch_no: "",
        dosage: "",
        expiry_date: "",
        delivery_date: "",
        quantity: "",
        sell_price: "",
        cost_price: "",
    });

    function handleMedicineChange(val) {
        const med = medicines.find(
            (m) => String(m.medicine_id) === String(val),
        );
        setData((prevData) => ({
            ...prevData,
            medicine_id: val,
            dosage: med ? med.dosage : "",
            sell_price: med ? med.price : "",
        }));
    }

    function submit(e) {
        e.preventDefault();
        post("/stock-receiving", {
            onSuccess: () => {
                reset();
                onClose();
            },
        });
    }

    return (
        <div className="bg-white rounded-[16px] shadow-sm border border-gray-100 p-6 mb-4 animate-in fade-in slide-in-from-top-4">
            <h2 className="font-semibold text-gray-900 text-[15px] mb-5">
                Record New Batch
            </h2>
            <form
                onSubmit={submit}
                className="grid grid-cols-1 md:grid-cols-3 gap-5"
            >
                <div>
                    <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">
                        Medicine<span className="text-critical-red">*</span>
                    </label>
                    <SearchableSelect
                        value={data.medicine_id}
                        onChange={handleMedicineChange}
                        options={medicines.map((m) => ({
                            value: m.medicine_id,
                            label: `${m.generic_name} (${m.brand_name})`,
                        }))}
                        placeholder="Search medicine..."
                    />
                    {errors.medicine_id && (
                        <p className="text-red-500 text-[11px] mt-1">
                            {errors.medicine_id}
                        </p>
                    )}
                </div>
                <div>
                    <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">
                        Supplier<span className="text-critical-red">*</span>
                    </label>
                    <SearchableSelect
                        value={data.supplier_id}
                        onChange={(val) => setData("supplier_id", val)}
                        options={suppliers.map((s) => ({
                            value: s.supplier_id,
                            label: s.name,
                        }))}
                        placeholder="Select supplier..."
                    />
                    {errors.supplier_id && (
                        <p className="text-red-500 text-[11px] mt-1">
                            {errors.supplier_id}
                        </p>
                    )}
                </div>
                <div>
                    <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">
                        Batch No.<span className="text-critical-red">*</span>
                    </label>
                    <input
                        type="text"
                        className={inputCls}
                        value={data.batch_no}
                        onChange={(e) => setData("batch_no", e.target.value)}
                        placeholder="e.g. BATCH-123"
                    />
                    {errors.batch_no && (
                        <p className="text-red-500 text-[11px] mt-1">
                            {errors.batch_no}
                        </p>
                    )}
                </div>

                <div>
                    <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">
                        Dosage
                    </label>
                    <input
                        type="text"
                        className={lockedCls}
                        value={data.dosage}
                        readOnly
                        placeholder="Select a medicine first..."
                    />
                </div>
                <div>
                    <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">
                        Expiry Date<span className="text-critical-red">*</span>
                    </label>
                    <input
                        type="date"
                        className={inputCls}
                        value={data.expiry_date}
                        onChange={(e) => setData("expiry_date", e.target.value)}
                    />
                    {errors.expiry_date && (
                        <p className="text-red-500 text-[11px] mt-1">
                            {errors.expiry_date}
                        </p>
                    )}
                </div>
                <div>
                    <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">
                        Delivery Date
                        <span className="text-critical-red">*</span>
                    </label>
                    <input
                        type="date"
                        className={inputCls}
                        value={data.delivery_date}
                        onChange={(e) =>
                            setData("delivery_date", e.target.value)
                        }
                    />
                    {errors.delivery_date && (
                        <p className="text-red-500 text-[11px] mt-1">
                            {errors.delivery_date}
                        </p>
                    )}
                </div>

                <div>
                    <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">
                        Quantity<span className="text-critical-red">*</span>
                    </label>
                    <input
                        type="number"
                        min="1"
                        className={inputCls}
                        value={data.quantity}
                        onChange={(e) => setData("quantity", e.target.value)}
                        placeholder="0"
                    />
                    {errors.quantity && (
                        <p className="text-red-500 text-[11px] mt-1">
                            {errors.quantity}
                        </p>
                    )}
                </div>
                <div>
                    <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">
                        Selling Price (₱)
                    </label>
                    <input
                        type="number"
                        step="0.01"
                        className={lockedCls}
                        value={data.sell_price}
                        readOnly
                        placeholder="Select a medicine first..."
                    />
                </div>
                <div>
                    <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">
                        Cost Price (₱)
                        <span className="text-critical-red">*</span>
                    </label>
                    <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        className={inputCls}
                        value={data.cost_price}
                        onChange={(e) => setData("cost_price", e.target.value)}
                        placeholder="0.00"
                    />
                    {errors.cost_price && (
                        <p className="text-red-500 text-[11px] mt-1">
                            {errors.cost_price}
                        </p>
                    )}
                </div>

                <div className="md:col-span-3 flex justify-end mt-2">
                    <button
                        type="submit"
                        disabled={processing}
                        className="rounded-full bg-[#FF4D79] text-white text-[14px] font-semibold px-8 py-2.5 hover:bg-[#E63E66] disabled:opacity-50 transition-colors shadow-sm"
                    >
                        {processing ? (
                            <>
                                <i className="fas fa-circle-notch fa-spin mr-2" />{" "}
                                Recording...
                            </>
                        ) : (
                            "Submit Stock-In"
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
