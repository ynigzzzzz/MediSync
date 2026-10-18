import { useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import StatCard from '@/Components/StatCard';
import ConfirmDialog from '@/Components/ConfirmDialog';
import Pagination from '@/Components/Pagination';

export default function Index({ medicines, stockOutRecords, expiredBatches, expiringBatches, hasExpired, hasExpiringSoon }) {
    const { auth, flash, errors } = usePage().props;
    const role = auth.user.role;
    const canDelete = role === 'admin';

    const [cart, setCart] = useState([]);
    const [medicineId, setMedicineId] = useState('');
    const [quantity, setQuantity] = useState('');
    const [dosage, setDosage] = useState('');
    const [price, setPrice] = useState('');
    const [patientName, setPatientName] = useState('');
    const [prescriptionNo, setPrescriptionNo] = useState('');
    const [processing, setProcessing] = useState(false);
    const [pendingDelete, setPendingDelete] = useState(null);

    const rows = stockOutRecords?.data ?? [];

    function addToCart() {
        if (!medicineId || !quantity) return;
        const med = medicines.find((m) => String(m.medicine_id) === String(medicineId));
        if (!med) return;
        setCart([...cart, {
            medicine_id: med.medicine_id,
            generic_name: med.generic_name,
            brand_name: med.brand_name,
            quantity: Number(quantity),
            dosage,
            price: price !== '' ? Number(price) : null,
        }]);
        setMedicineId(''); setQuantity(''); setDosage(''); setPrice('');
    }

    function removeFromCart(i) {
        setCart(cart.filter((_, idx) => idx !== i));
    }

    function submitDispense() {
        if (cart.length === 0) return;
        setProcessing(true);
        router.post('/dispensing', {
            patient_name: patientName,
            prescription_no: prescriptionNo,
            items: cart.map(({ medicine_id, quantity, price, dosage }) => ({ medicine_id, quantity, price, dosage })),
        }, {
            onSuccess: () => { setCart([]); setPatientName(''); setPrescriptionNo(''); },
            onFinish: () => setProcessing(false),
        });
    }

    function confirmDelete() {
        router.delete(`/dispensing/${pendingDelete}`, {
            onFinish: () => setPendingDelete(null),
        });
    }

    return (
        <AuthenticatedLayout>
            <Head title="Stock Dispensing" />

            <h1 className="text-2xl font-semibold text-charcoal-blue">Stock Dispensing (FEFO)</h1>

            <div className="grid grid-cols-3 gap-4">
                <StatCard icon="fa-circle-xmark" label="Expired Batches" value={expiredBatches.length} color="#DC3545" />
                <StatCard icon="fa-hourglass-half" label="Expiring Soon" value={expiringBatches.length} color="#E67E22" />
                <StatCard icon="fa-arrow-up" label="Recent Dispenses" value={stockOutRecords.total ?? 0} />
            </div>

            {flash?.success && <div className="bg-green-50 text-green-800 border border-green-200 rounded-lg p-3 text-sm">{flash.success}</div>}
            {errors?.dispense && <div className="bg-red-50 text-red-800 border border-red-200 rounded-lg p-3 text-sm whitespace-pre-line">{errors.dispense}</div>}

            {(expiredBatches.length > 0 || expiringBatches.length > 0) && (
                <div className="bg-amber-50 border border-amber-300 text-amber-800 p-3 rounded-lg text-sm">
                    {expiredBatches.length > 0 && <p>{expiredBatches.length} expired batch(es) still in stock — dispose before dispensing.</p>}
                    {expiringBatches.length > 0 && <p>{expiringBatches.length} batch(es) expiring within 30 days.</p>}
                </div>
            )}

            <div className="bg-white rounded-[15px] border border-eggshell p-4 space-y-3">
                <h2 className="font-medium text-charcoal-blue">Add Item</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <select className="rounded-lg border-gray-300 text-charcoal-blue focus:border-cherry-blossom focus:ring-cherry-blossom"
                        value={medicineId} onChange={(e) => setMedicineId(e.target.value)}>
                        <option value="">Select medicine</option>
                        {medicines.map((m) => (
                            <option key={m.medicine_id} value={m.medicine_id}>
                                {m.generic_name} ({m.brand_name}) — stock {m.current_stock}
                            </option>
                        ))}
                    </select>
                    <input className="rounded-lg border-gray-300 text-charcoal-blue focus:border-cherry-blossom focus:ring-cherry-blossom"
                        type="number" min="1" placeholder="Quantity" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
                    <input className="rounded-lg border-gray-300 text-charcoal-blue focus:border-cherry-blossom focus:ring-cherry-blossom"
                        placeholder="Dosage (optional)" value={dosage} onChange={(e) => setDosage(e.target.value)} />
                    <input className="rounded-lg border-gray-300 text-charcoal-blue focus:border-cherry-blossom focus:ring-cherry-blossom"
                        type="number" step="0.01" placeholder="Price (optional)" value={price} onChange={(e) => setPrice(e.target.value)} />
                </div>
                <div className="flex justify-end">
                    <button onClick={addToCart} className="rounded-lg bg-cherry-blossom text-charcoal-blue text-sm font-medium px-4 py-2 hover:bg-burnt-rose hover:text-white">
                        Add to Cart
                    </button>
                </div>
            </div>

            {cart.length > 0 && (
                <div className="bg-white rounded-[15px] border border-eggshell p-4 space-y-3">
                    <h2 className="font-medium text-charcoal-blue">Cart</h2>
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-left border-b border-eggshell">
                                <th className="p-2 text-charcoal-blue">Medicine</th>
                                <th className="p-2 text-charcoal-blue">Qty</th>
                                <th className="p-2 text-charcoal-blue">Dosage</th>
                                <th className="p-2 text-charcoal-blue">Price</th>
                                <th className="p-2"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {cart.map((c, i) => (
                                <tr key={i} className="border-b border-eggshell last:border-0">
                                    <td className="p-2 text-charcoal-blue">{c.generic_name} ({c.brand_name})</td>
                                    <td className="p-2 text-charcoal-blue">{c.quantity}</td>
                                    <td className="p-2 text-charcoal-blue">{c.dosage || '—'}</td>
                                    <td className="p-2 text-charcoal-blue">{c.price != null ? `₱${c.price.toFixed(2)}` : '—'}</td>
                                    <td className="p-2 text-right">
                                        <button onClick={() => removeFromCart(i)} className="text-critical-red text-xs font-medium hover:underline">Remove</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <input className="rounded-lg border-gray-300 text-charcoal-blue focus:border-cherry-blossom focus:ring-cherry-blossom"
                            placeholder="Patient name" value={patientName} onChange={(e) => setPatientName(e.target.value)} />
                        <input className="rounded-lg border-gray-300 text-charcoal-blue focus:border-cherry-blossom focus:ring-cherry-blossom"
                            placeholder="Prescription no." value={prescriptionNo} onChange={(e) => setPrescriptionNo(e.target.value)} />
                    </div>

                    <button onClick={submitDispense} disabled={processing}
                        className="rounded-lg px-4 py-2 text-sm font-medium bg-success-green text-white hover:opacity-90 disabled:opacity-50">
                        {processing ? 'Dispensing...' : 'Dispense'}
                    </button>
                </div>
            )}

            <div className="bg-white rounded-[15px] border border-eggshell p-4">
                <h2 className="font-medium mb-2 text-charcoal-blue">Recent Dispense Records</h2>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-left border-b border-eggshell">
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
                            {rows.map((r) => (
                                <tr key={r.stock_out_id} className="border-b border-eggshell last:border-0 hover:bg-[rgba(223,226,207,0.3)]">
                                    <td className="py-2 text-charcoal-blue">{r.medicine?.generic_name}</td>
                                    <td className="py-2 text-charcoal-blue">{r.quantity}</td>
                                    <td className="py-2 text-charcoal-blue">{r.patient_name || '—'}</td>
                                    <td className="py-2 text-charcoal-blue">{r.prescription_no}</td>
                                    <td className="py-2 text-charcoal-blue">{r.stock_in?.batch_no}</td>
                                    <td className="py-2 text-charcoal-blue">{r.dispensed_by?.full_name}</td>
                                    {canDelete && (
                                        <td className="py-2">
                                            <button className="text-critical-red hover:underline text-xs font-medium"
                                                onClick={() => setPendingDelete(r.stock_out_id)}>
                                                Delete
                                            </button>
                                        </td>
                                    )}
                                </tr>
                            ))}
                            {rows.length === 0 && (
                                <tr><td colSpan={canDelete ? 7 : 6} className="py-4 text-center text-gray-400">No dispensing records yet.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <Pagination meta={stockOutRecords} label="dispenses" />

            <ConfirmDialog
                open={pendingDelete !== null}
                onOpenChange={(o) => !o && setPendingDelete(null)}
                title="Delete this dispense record?"
                description="The dispensed quantity will be restored to stock."
                confirmLabel="Delete"
                tone="danger"
                onConfirm={confirmDelete}
            />
        </AuthenticatedLayout>
    );
}