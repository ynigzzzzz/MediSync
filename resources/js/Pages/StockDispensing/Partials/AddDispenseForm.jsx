
import { useState } from "react";
import { router, usePage } from "@inertiajs/react";
import { SearchableSelect } from "@/Components/ui/searchable-select";

const inputCls =
    "w-full rounded-xl border border-transparent bg-[#F2F2F7] px-3 py-2.5 text-[14px] text-gray-900 placeholder-gray-400 focus:border-gray-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-gray-100 transition-all";

const lockedCls =
    "w-full rounded-xl border border-transparent bg-gray-100 px-3 py-2.5 text-[14px] text-gray-500 cursor-not-allowed placeholder-gray-400";

export default function AddDispenseForm({ medicines, onClose }) {
    const { errors } = usePage().props;

    const [cart, setCart] = useState([]);
    const [medicineId, setMedicineId] = useState("");
    const [quantity, setQuantity] = useState("");
    const [dosage, setDosage] = useState("");
    const [price, setPrice] = useState("");
    const [patientName, setPatientName] = useState("");
    const [prescriptionNo, setPrescriptionNo] = useState("");
    const [processing, setProcessing] = useState(false);

    const medicineOptions = medicines.map((m) => ({
        value: String(m.medicine_id),
        label: `${m.generic_name}${m.brand_name ? ` (${m.brand_name})` : ""} — stock: ${Number(m.available_stock ?? 0)}`,
        data: m,
    }));

    // Fallback unique ID generator
    const generateId = () =>
        Math.random().toString(36).substring(2, 15) +
        Math.random().toString(36).substring(2, 15);

    function handleMedicineChange(val) {
        const med = medicines.find(
            (m) => String(m.medicine_id) === String(val),
        );

        setMedicineId(val);

        if (med) {
            setDosage(med.dosage || "");
            setPrice(med.price || "");
        } else {
            setDosage("");
            setPrice("");
        }
    }

    function addToCart() {
        if (!medicineId || !quantity) return;

        const med = medicines.find(
            (m) => String(m.medicine_id) === String(medicineId),
        );

        if (!med) return;

        setCart((prev) => [
            ...prev,
            {
                cart_id: generateId(),
                medicine_id: med.medicine_id,
                generic_name: med.generic_name,
                brand_name: med.brand_name,
                quantity: Number(quantity),
                dosage,
                price: price !== "" ? Number(price) : null,
            },
        ]);

        setMedicineId("");
        setQuantity("");
        setDosage("");
        setPrice("");
    }

    function removeFromCart(cartId) {
        setCart((prev) =>
            prev.filter((item) => item.cart_id !== cartId),
        );
    }

    function submitDispense() {
        if (cart.length === 0) return;

        setProcessing(true);

        router.post(
            "/dispensing",
            {
                patient_name: patientName,
                prescription_no: prescriptionNo,

                // Price is deliberately excluded.
                // The backend retrieves it from the database.

                items: cart.map(
                    ({ medicine_id, quantity, dosage }) => ({
                        medicine_id,
                        quantity,
                        dosage,
                    }),
                ),
            },
            {
                onSuccess: () => {
                    setCart([]);
                    setPatientName("");
                    setPrescriptionNo("");
                    onClose();
                },

                onFinish: () => setProcessing(false),
            },
        );
    }

    return (
        <div className="animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="bg-white rounded-[16px] shadow-sm border border-gray-100 p-6 mb-4">
                <h2 className="font-semibold text-gray-900 text-[15px] mb-5">
                    Add Item to Cart
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                    <div>
                        <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">
                            Medicine<span className="text-critical-red">*</span>
                        </label>

                        <SearchableSelect
                            value={medicineId}
                            onChange={handleMedicineChange}
                            options={medicineOptions}
                            placeholder="Search medicine..."
                        />
                    </div>

                    <div>
                        <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">
                            Quantity<span className="text-critical-red">*</span>
                        </label>

                        <input
                            type="number"
                            min="1"
                            className={inputCls}
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">
                            Dosage
                        </label>

                        <input
                            type="text"
                            readOnly
                            className={lockedCls}
                            value={dosage}
                            placeholder="Select a medicine first..."
                        />
                    </div>

                    <div>
                        <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">
                            Price (₱)
                        </label>

                        <input
                            type="number"
                            readOnly
                            className={lockedCls}
                            value={price}
                            placeholder="Select a medicine first..."
                        />
                    </div>
                </div>

                <div className="flex justify-end pt-4 mt-2">
                    <button
                        onClick={addToCart}
                        className="rounded-full bg-gray-900 text-white text-[13px] font-semibold px-6 py-2.5 hover:bg-black transition-colors shadow-sm"
                    >
                        Add to Cart
                    </button>
                </div>
            </div>

            {cart.length > 0 && (
                <div className="bg-white rounded-[16px] shadow-sm border border-gray-100 p-6 mb-4 animate-in fade-in slide-in-from-top-2">
                    <h2 className="font-semibold text-gray-900 text-[15px] mb-5">
                        Current Cart
                    </h2>

                    <div className="overflow-x-auto w-full">
                        <table className="w-full min-w-[600px] text-left text-[13px]">
                            <thead>
                                <tr className="border-b border-gray-100">
                                    <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                                        Medicine
                                    </th>

                                    <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                                        Qty
                                    </th>

                                    <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                                        Dosage
                                    </th>

                                    <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                                        Price
                                    </th>

                                    <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                                        Actions
                                    </th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-gray-50">
                                {cart.map((c) => (
                                    <tr
                                        key={c.cart_id}
                                        className="hover:bg-gray-50/50 transition-colors"
                                    >
                                        <td className="px-4 py-3 text-gray-900 font-medium">
                                            {c.generic_name} ({c.brand_name})
                                        </td>

                                        <td className="px-4 py-3 text-gray-600">
                                            {c.quantity}
                                        </td>

                                        <td className="px-4 py-3 text-gray-600">
                                            {c.dosage ? `${c.dosage}` : "—"}
                                        </td>

                                        <td className="px-4 py-3 text-gray-600">
                                            {c.price != null
                                                ? `₱${c.price.toFixed(2)}`
                                                : "—"}
                                        </td>

                                        <td className="px-4 py-3 text-right">
                                            <button
                                                onClick={() =>
                                                    removeFromCart(c.cart_id)
                                                }
                                                className="text-critical-red text-[13px] font-semibold hover:underline"
                                            >
                                                Remove
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>

                            <tfoot>
                                <tr className="border-t border-gray-200">
                                    <td
                                        colSpan={3}
                                        className="px-4 py-3 text-right font-semibold text-gray-900"
                                    >
                                        Total Amount:
                                    </td>

                                    <td className="px-4 py-3 text-gray-900 font-bold">
                                        ₱
                                        {cart
                                            .reduce(
                                                (total, item) =>
                                                    total +
                                                    item.quantity *
                                                        (item.price || 0),
                                                0,
                                            )
                                            .toFixed(2)}
                                    </td>

                                    <td></td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 mt-2 border-t border-gray-100">
                        <div>
                            <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">
                                Patient Name (Optional)
                            </label>

                            <input
                                type="text"
                                className={inputCls}
                                value={patientName}
                                onChange={(e) =>
                                    setPatientName(e.target.value)
                                }
                            />
                        </div>

                        <div>
                            <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">
                                Prescription No. (Optional)
                            </label>

                            <input
                                type="text"
                                className={inputCls}
                                value={prescriptionNo}
                                onChange={(e) =>
                                    setPrescriptionNo(e.target.value)
                                }
                            />
                        </div>
                    </div>

                    <div className="flex justify-end pt-4">
                        <button
                            onClick={submitDispense}
                            disabled={processing}
                            className="rounded-full bg-[#FF4D79] text-white text-[14px] font-semibold px-8 py-2.5 hover:bg-[#E63E66] transition-colors shadow-[0_4px_14px_rgba(255,77,121,0.3)] disabled:opacity-50 flex items-center gap-2"
                        >
                            {processing ? (
                                <>
                                    <i className="fas fa-circle-notch fa-spin" />{" "}
                                    Processing...
                                </>
                            ) : (
                                "Complete Dispense"
                            )}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
