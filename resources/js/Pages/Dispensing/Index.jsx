import { useState } from 'react';
import { useForm, usePage, router, Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

export default function Index({ medicines, stockOutRecords, expiredBatches, expiringBatches }) {
    const { auth, errors, flash } = usePage().props;
    const role = auth.user.role;
    const canDelete = role === 'admin';

    const [cart, setCart] = useState([]);
    const [medicineId, setMedicineId] = useState('');
    const [quantity, setQuantity] = useState('');
    const [dosage, setDosage] = useState('');
    const [unexpiredStock, setUnexpiredStock] = useState(null);
    const [patientName, setPatientName] = useState('');
    const [prescriptionNo, setPrescriptionNo] = useState('');

    const { post, processing } = useForm();

    function onMedicineChange(id) {
        setMedicineId(id);
        setUnexpiredStock(null);
        if (!id) return;
        fetch(`/dispensing/unexpired-stock?medicine_id=${id}`)
            .then((r) => r.json())
            .then((d) => setUnexpiredStock(d.unexpiredStock));
    }

    function addToCart() {
        const med = medicines.find((m) => String(m.medicine_id) === String(medicineId));
        if (!med || !quantity || quantity <= 0) return;
        setCart([...cart, {
            medicine_id: med.medicine_id,
            name: `${med.generic_name} (${med.brand_name})`,
            quantity: parseInt(quantity, 10),
            price: med.price,
            dosage,
        }]);
        setMedicineId('');
        setQuantity('');
        setDosage('');
        setUnexpiredStock(null);
    }

    function removeFromCart(i) {
        setCart(cart.filter((_, idx) => idx !== i));
    }

    function submitDispense() {
        if (cart.length === 0) return;
        router.post('/dispensing', {
            patient_name: patientName,
            prescription_no: prescriptionNo,
            items: cart.map(({ medicine_id, quantity, price, dosage }) => ({ medicine_id, quantity, price, dosage })),
        }, {
            onSuccess: () => setCart([]),
        });
    }

    function deleteRecord(id) {
        if (!confirm('Delete this record and restore stock?')) return;
        router.delete(`/dispensing/${id}`);
    }

    return (
        <AuthenticatedLayout>
            <Head title="Stock Dispensing" />
            <>
                <h1 className="text-2xl font-semibold text-charcoal-blue">Stock Dispensing (FEFO)</h1>

                {flash?.success && <div className="bg-green-100 text-green-800 p-3 rounded">{flash.success}</div>}
                {errors?.dispense && <div className="bg-red-100 text-red-800 p-3 rounded whitespace-pre-line">{errors.dispense}</div>}

                {(expiredBatches.length > 0 || expiringBatches.length > 0) && (
                    <div className="bg-amber-50 border border-amber-300 text-amber-800 p-3 rounded text-sm">
                        {expiredBatches.length > 0 && <p>{expiredBatches.length} expired batch(es) still in stock — dispose before dispensing.</p>}
                        {expiringBatches.length > 0 && <p>{expiringBatches.length} batch(es) expiring within 30 days.</p>}
                    </div>
                )}

                <div className="border rounded-lg p-4 space-y-3">
                    <h2 className="font-medium text-charcoal-blue">Add Item</h2>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                        <select
                            className="border rounded p-2 text-charcoal-blue"
                            value={medicineId}
                            onChange={(e) => onMedicineChange(e.target.value)}
                        >
                            <option value="">Select medicine</option>
                            {medicines.map((m) => (
                                <option key={m.medicine_id} value={m.medicine_id}>
                                    {m.generic_name} ({m.brand_name}) — stock {m.current_stock}
                                </option>
                            ))}
                        </select>
                        <input
                            className="border rounded p-2 text-charcoal-blue"
                            type="number"
                            min="1"
                            placeholder="Quantity"
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                        />
                        <input
                            className="border rounded p-2 text-charcoal-blue"
                            placeholder="Dosage instructions"
                            value={dosage}
                            onChange={(e) => setDosage(e.target.value)}
                        />
                        <button
                            className="bg-blue-600 text-white rounded p-2"
                            onClick={addToCart}
                            disabled={!medicineId || !quantity || quantity < 1}
                        >
                            Add to cart
                        </button>
                    </div>
                    {unexpiredStock !== null && (
                        <p className="text-sm text-charcoal-blue">Available unexpired stock: {unexpiredStock} units.</p>
                    )}
                    {medicines.length === 0 && (
                        <p className="text-sm text-amber-600">No medicines with stock available. Please add stock via Stock Receiving.</p>
                    )}
                </div>

                {cart.length > 0 && (
                    <div className="border rounded-lg p-4 space-y-3">
                        <h2 className="font-medium text-charcoal-blue">Cart</h2>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-left border-b">
                                        <th className="py-2 text-charcoal-blue">Medicine</th>
                                        <th className="py-2 text-charcoal-blue">Qty</th>
                                        <th className="py-2 text-charcoal-blue">Dosage</th>
                                        <th className="py-2"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {cart.map((item, i) => (
                                        <tr key={i} className="border-b">
                                            <td className="py-2 text-charcoal-blue">{item.name}</td>
                                            <td className="py-2 text-charcoal-blue">{item.quantity}</td>
                                            <td className="py-2 text-charcoal-blue">{item.dosage}</td>
                                            <td className="py-2">
                                                <button className="text-red-600" onClick={() => removeFromCart(i)}>Remove</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <input
                                className="border rounded p-2 text-charcoal-blue"
                                placeholder="Patient name (optional)"
                                value={patientName}
                                onChange={(e) => setPatientName(e.target.value)}
                            />
                            <input
                                className="border rounded p-2 text-charcoal-blue"
                                placeholder="Prescription no. (optional)"
                                value={prescriptionNo}
                                onChange={(e) => setPrescriptionNo(e.target.value)}
                            />
                        </div>
                        <button
                            className="bg-green-600 text-white rounded p-2 px-4"
                            disabled={processing}
                            onClick={submitDispense}
                        >
                            Dispense
                        </button>
                    </div>
                )}

                <div className="border rounded-lg p-4">
                    <h2 className="font-medium mb-2 text-charcoal-blue">Recent Dispense Records</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-left border-b">
                                    <th className="py-2 text-charcoal-blue">Medicine</th>
                                    <th className="py-2 text-charcoal-blue">Qty</th>
                                    <th className="py-2 text-charcoal-blue">Patient</th>
                                    <th className="py-2 text-charcoal-blue">Prescription</th>
                                    <th className="py-2 text-charcoal-blue">Batch</th>
                                    <th className="py-2 text-charcoal-blue">By</th>
                                    {canDelete && <th className="py-2"></th>}
                                </tr>
                            </thead>
                            <tbody>
                                {stockOutRecords.map((r) => (
                                    <tr key={r.stock_out_id} className="border-b">
                                        <td className="py-2 text-charcoal-blue">{r.medicine?.generic_name}</td>
                                        <td className="py-2 text-charcoal-blue">{r.quantity}</td>
                                        <td className="py-2 text-charcoal-blue">{r.patient_name || 'Walk-in'}</td>
                                        <td className="py-2 text-charcoal-blue">{r.prescription_no}</td>
                                        <td className="py-2 text-charcoal-blue">{r.stock_in?.batch_no}</td>
                                        <td className="py-2 text-charcoal-blue">{r.dispensed_by?.full_name}</td>
                                        {canDelete && (
                                            <td className="py-2">
                                                <button
                                                    className="text-red-600"
                                                    onClick={() => deleteRecord(r.stock_out_id)}
                                                >
                                                    Delete
                                                </button>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                                {stockOutRecords.length === 0 && (
                                    <tr>
                                        <td colSpan={canDelete ? 7 : 6} className="py-4 text-center text-gray-400">
                                            No dispensing records yet.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </>
        </AuthenticatedLayout>
    );
}