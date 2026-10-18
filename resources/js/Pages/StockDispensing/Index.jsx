import { useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import StatCard from '@/Components/StatCard';
import ConfirmDialog from '@/Components/ConfirmDialog';
import Pagination from '@/Components/Pagination';

export default function Index({ medicines, stockOutRecords, expiredBatches, expiringBatches, alerts }) {
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

    function removeFromCart(i) { setCart(cart.filter((_, idx) => idx !== i)); }

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
        router.delete(`/dispensing/${pendingDelete}`, { onFinish: () => setPendingDelete(null) });
    }

    return (
        <AuthenticatedLayout>
            <Head title="Stock Dispensing" />
            <div>
    <h1 className="text-2xl font-semibold text-charcoal-blue mb-1">Stock Dispensing</h1>
    <p className="text-sm text-charcoal-blue opacity-70">Process patient transactions, manage the cart, and dispense medicines</p>
</div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard icon="fa-triangle-exclamation" label="Low Stock" value={alerts.lowStock} tone="warning" onClick={() => router.get('/medicine-list?filter=lowstock')} />
                <StatCard icon="fa-circle-xmark" label="Out of Stock" value={alerts.outOfStock} tone="danger" onClick={() => router.get('/medicine-list?filter=outofstock')} />
                <StatCard icon="fa-hourglass-half" label="Expiring (30d)" value={alerts.expiringSoon} tone="warning" onClick={() => router.get('/medicine-list?filter=expiring')} />
                <StatCard icon="fa-arrow-up" label="Recent Dispenses" value={stockOutRecords.total ?? 0} />
            </div>

            {flash?.success && <div className="bg-green-50 text-green-800 border border-green-200 rounded-lg p-3 text-sm">{flash.success}</div>}
            {errors?.dispense && <div className="bg-red-50 text-red-800 border border-red-200 rounded-lg p-3 text-sm whitespace-pre-line">{errors.dispense}</div>}

            <div className="bg-white rounded-[15px] border border-eggshell p-5 space-y-4">
                <h2 className="font-medium text-charcoal-blue text-lg">Add Item</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1 text-charcoal-blue">Medicine<span className="text-critical-red">*</span></label>
                        <select className="w-full rounded-lg border-gray-300 focus:border-cherry-blossom focus:ring-cherry-blossom" value={medicineId} onChange={(e) => setMedicineId(e.target.value)}>
                            <option value="" disabled>Select medicine...</option>
                            {medicines.map((m) => <option key={m.medicine_id} value={m.medicine_id}>{m.generic_name} ({m.brand_name}) — stock {m.current_stock}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1 text-charcoal-blue">Quantity<span className="text-critical-red">*</span></label>
                        <input type="number" min="1" className="w-full rounded-lg border-gray-300 focus:border-cherry-blossom focus:ring-cherry-blossom" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1 text-charcoal-blue">Dosage (Optional)</label>
                        <input type="text" className="w-full rounded-lg border-gray-300 focus:border-cherry-blossom focus:ring-cherry-blossom" value={dosage} onChange={(e) => setDosage(e.target.value)} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1 text-charcoal-blue">Price (Optional)</label>
                        <input type="number" step="0.01" className="w-full rounded-lg border-gray-300 focus:border-cherry-blossom focus:ring-cherry-blossom" value={price} onChange={(e) => setPrice(e.target.value)} />
                    </div>
                </div>
                <div className="flex justify-end">
                    <button onClick={addToCart} className="rounded-lg bg-cherry-blossom text-charcoal-blue text-sm font-medium px-4 py-2 hover:bg-burnt-rose hover:text-white transition-colors">
                        Add to Cart
                    </button>
                </div>
            </div>

            {cart.length > 0 && (
                <div className="bg-white rounded-[15px] border border-eggshell p-5 space-y-4">
                    <h2 className="font-medium text-charcoal-blue text-lg">Cart</h2>
                    <div className="overflow-x-auto w-full">
                        <table className="w-full min-w-[600px] text-sm">
                            <thead>
                                <tr className="text-left border-b border-eggshell text-charcoal-blue">
                                    <th className="p-3 whitespace-nowrap">Medicine</th>
                                    <th className="p-3 whitespace-nowrap">Qty</th>
                                    <th className="p-3 whitespace-nowrap">Dosage</th>
                                    <th className="p-3 whitespace-nowrap">Price</th>
                                    <th className="p-3 text-right whitespace-nowrap">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {cart.map((c, i) => (
                                    <tr key={i} className="border-b border-eggshell last:border-0 hover:bg-eggshell/30">
                                        <td className="p-3 text-charcoal-blue font-medium">{c.generic_name} ({c.brand_name})</td>
                                        <td className="p-3 text-charcoal-blue">{c.quantity}</td>
                                        <td className="p-3 text-charcoal-blue">{c.dosage || '—'}</td>
                                        <td className="p-3 text-charcoal-blue">{c.price != null ? `₱${c.price.toFixed(2)}` : '—'}</td>
                                        <td className="p-3 text-right">
                                            <button onClick={() => removeFromCart(i)} className="text-critical-red text-sm font-medium hover:underline">Remove</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <div>
                            <label className="block text-sm font-medium mb-1 text-charcoal-blue">Patient Name</label>
                            <input type="text" className="w-full rounded-lg border-gray-300 focus:border-cherry-blossom focus:ring-cherry-blossom" value={patientName} onChange={(e) => setPatientName(e.target.value)} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1 text-charcoal-blue">Prescription No.</label>
                            <input type="text" className="w-full rounded-lg border-gray-300 focus:border-cherry-blossom focus:ring-cherry-blossom" value={prescriptionNo} onChange={(e) => setPrescriptionNo(e.target.value)} />
                        </div>
                    </div>
                    <div className="flex justify-end pt-2">
                        <button onClick={submitDispense} disabled={processing} className="rounded-lg px-6 py-2 text-sm font-medium bg-success-green text-white hover:opacity-90 disabled:opacity-50">
                            {processing ? 'Dispensing...' : 'Dispense'}
                        </button>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-[15px] border border-eggshell w-full overflow-hidden">
                <div className="p-4 border-b border-eggshell">
                    <h2 className="font-medium text-charcoal-blue text-lg">Recent Dispense Records</h2>
                </div>
                <div className="overflow-x-auto w-full">
                    <table className="w-full min-w-[800px] text-sm">
                        <thead>
                            <tr className="text-left border-b border-eggshell text-charcoal-blue">
                                <th className="p-4 whitespace-nowrap">Medicine</th>
                                <th className="p-4 whitespace-nowrap">Qty</th>
                                <th className="p-4 whitespace-nowrap">Patient</th>
                                <th className="p-4 whitespace-nowrap">Prescription</th>
                                <th className="p-4 whitespace-nowrap">Batch</th>
                                <th className="p-4 whitespace-nowrap">By</th>
                                {canDelete && <th className="p-4 text-right whitespace-nowrap">Actions</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((r) => (
                                <tr key={r.stock_out_id} className="border-b border-eggshell last:border-0 hover:bg-eggshell/30">
                                    <td className="p-4 text-charcoal-blue font-medium">{r.medicine?.generic_name}</td>
                                    <td className="p-4 text-charcoal-blue">{r.quantity}</td>
                                    <td className="p-4 text-charcoal-blue">{r.patient_name || '—'}</td>
                                    <td className="p-4 text-charcoal-blue">{r.prescription_no}</td>
                                    <td className="p-4 text-charcoal-blue">{r.stock_in?.batch_no}</td>
                                    <td className="p-4 text-charcoal-blue">{r.dispensed_by?.full_name}</td>
                                    {canDelete && (
                                        <td className="p-4 text-right">
                                            <button className="text-critical-red hover:underline text-sm font-medium" onClick={() => setPendingDelete(r.stock_out_id)}>Delete</button>
                                        </td>
                                    )}
                                </tr>
                            ))}
                            {rows.length === 0 && <tr><td colSpan={canDelete ? 7 : 6} className="p-8 text-center text-gray-400">No dispensing records yet.</td></tr>}
                        </tbody>
                    </table>
                </div>
                <Pagination meta={stockOutRecords} label="dispenses" />
            </div>

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