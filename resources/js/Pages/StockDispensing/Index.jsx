import { useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import StatCard from '@/Components/StatCard';
import ConfirmDialog from '@/Components/ConfirmDialog';
import Pagination from '@/Components/Pagination';

const inputCls = "w-full rounded-xl border border-transparent bg-[#F2F2F7] px-3 py-2 text-[14px] text-gray-900 placeholder-gray-400 focus:border-gray-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-gray-100 transition-all";
const lockedCls = "w-full rounded-xl border border-transparent bg-gray-100 px-3 py-2 text-[14px] text-gray-500 cursor-not-allowed";

export default function Index({ medicines, stockOutRecords, expiredBatches = [], expiringBatches = [], alerts }) {
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

    // Auto-fill Dosage and Price when selecting a medicine
    function handleMedicineChange(e) {
        const id = e.target.value;
        const med = medicines.find((m) => String(m.medicine_id) === id);
        setMedicineId(id);
        if (med) {
            setDosage(med.dosage || '');
            setPrice(med.price || '');
        } else {
            setDosage('');
            setPrice('');
        }
    }

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
            onSuccess: () => { 
                setCart([]); 
                setPatientName(''); 
                setPrescriptionNo(''); 
            },
            onFinish: () => setProcessing(false),
        });
    }

    function confirmDelete() {
        router.delete(`/dispensing/${pendingDelete}`, { 
            onFinish: () => setPendingDelete(null) 
        });
    }

    return (
        <AuthenticatedLayout>
            <Head title="Stock Dispensing" />
            
            <div className="mb-5">
                <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Stock Dispensing</h1>
                <p className="text-[13px] text-gray-500">Process patient transactions, manage the cart, and dispense medicines</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <StatCard icon="fa-triangle-exclamation" label="Low Stock" value={alerts?.lowStock ?? 0} tone="warning" onClick={() => router.get('/medicine-list?filter=lowstock')} />
                <StatCard icon="fa-circle-xmark" label="Out of Stock" value={alerts?.outOfStock ?? 0} tone="danger" onClick={() => router.get('/medicine-list?filter=outofstock')} />
                <StatCard icon="fa-hourglass-half" label="Expiring (30d)" value={alerts?.expiringSoon ?? 0} tone="warning" onClick={() => router.get('/medicine-list?filter=expiring')} />
                <StatCard icon="fa-arrow-up" label="Recent Dispenses" value={stockOutRecords.total ?? 0} />
            </div>

            {flash?.success && (
                <div className="mb-4 bg-green-50 text-green-700 border border-green-200 rounded-xl p-3 text-[13px] font-medium flex items-center gap-2">
                    <i className="fas fa-check-circle" /> {flash.success}
                </div>
            )}
            {errors?.dispense && (
                <div className="mb-4 bg-red-50 text-red-700 border border-red-200 rounded-xl p-3 text-[13px] font-medium flex items-start gap-2">
                    <i className="fas fa-exclamation-circle mt-0.5" />
                    <span className="whitespace-pre-line">{errors.dispense}</span>
                </div>
            )}
            
            {(expiredBatches.length > 0 || expiringBatches.length > 0) && (
                <div className="mb-4 bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-[16px] text-[13px] shadow-sm">
                    <h4 className="font-semibold mb-1"><i className="fas fa-triangle-exclamation mr-2" />Attention Required</h4>
                    {expiredBatches.length > 0 && <p>{expiredBatches.length} expired batch(es) still in stock — dispose before dispensing.</p>}
                    {expiringBatches.length > 0 && <p>{expiringBatches.length} batch(es) expiring within 30 days.</p>}
                </div>
            )}

            <div className="bg-white rounded-[16px] shadow-sm border border-gray-100 p-5 space-y-4 mb-4">
                <h2 className="font-semibold text-gray-900 text-[15px]">Add Item to Cart</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-[12px] font-semibold text-gray-700 mb-1">Medicine<span className="text-critical-red">*</span></label>
                        <select className={inputCls} value={medicineId} onChange={handleMedicineChange}>
                            <option value="" disabled>Select medicine...</option>
                            {medicines.map((m) => (
                                <option key={m.medicine_id} value={m.medicine_id}>
                                    {m.generic_name} ({m.brand_name}) — stock {m.current_stock}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-[12px] font-semibold text-gray-700 mb-1">Quantity<span className="text-critical-red">*</span></label>
                        <input type="number" min="1" className={inputCls} value={quantity} onChange={(e) => setQuantity(e.target.value)} />
                    </div>
                    <div>
                        <label className="block text-[12px] font-semibold text-gray-700 mb-1">Dosage</label>
                        <input type="text" readOnly className={lockedCls} value={dosage}/>
                    </div>
                    <div>
                        <label className="block text-[12px] font-semibold text-gray-700 mb-1">Price (₱)</label>
                        <input type="number" readOnly className={lockedCls} value={price}/>
                    </div>
                </div>
                <div className="flex justify-end pt-1">
                    <button onClick={addToCart} className="rounded-full bg-gray-900 text-white text-[13px] font-semibold px-5 py-2 hover:bg-black transition-colors shadow-sm">
                        Add to Cart
                    </button>
                </div>
            </div>

            {cart.length > 0 && (
                <div className="bg-white rounded-[16px] shadow-sm border border-gray-100 p-5 space-y-4 mb-4">
                    <h2 className="font-semibold text-gray-900 text-[15px]">Current Cart</h2>
                    <div className="overflow-x-auto w-full">
                        <table className="w-full min-w-[600px] text-left text-[13px]">
                            <thead>
                                <tr className="border-b border-gray-100">
                                    <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">Medicine</th>
                                    <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">Qty</th>
                                    <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">Dosage</th>
                                    <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">Price</th>
                                    <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-gray-500">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {cart.map((c, i) => (
                                    <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-4 py-3 text-gray-900 font-medium">{c.generic_name} ({c.brand_name})</td>
                                        <td className="px-4 py-3 text-gray-600">{c.quantity}</td>
                                        <td className="px-4 py-3 text-gray-600">{c.dosage || '—'}</td>
                                        <td className="px-4 py-3 text-gray-600">{c.price != null ? `₱${c.price.toFixed(2)}` : '—'}</td>
                                        <td className="px-4 py-3 text-right">
                                            <button onClick={() => removeFromCart(i)} className="text-critical-red text-[13px] font-semibold hover:underline">Remove</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                        <div>
                            <label className="block text-[12px] font-semibold text-gray-700 mb-1">Patient Name (Optional)</label>
                            <input type="text" className={inputCls} value={patientName} onChange={(e) => setPatientName(e.target.value)} />
                        </div>
                        <div>
                            <label className="block text-[12px] font-semibold text-gray-700 mb-1">Prescription No. (Optional)</label>
                            <input type="text" className={inputCls} value={prescriptionNo} onChange={(e) => setPrescriptionNo(e.target.value)} />
                        </div>
                    </div>
                    <div className="flex justify-end pt-2">
                        <button onClick={submitDispense} disabled={processing} className="rounded-full bg-[#FF4D79] text-white text-[14px] font-semibold px-6 py-2.5 hover:bg-[#E63E66] transition-colors shadow-[0_4px_14px_rgba(255,77,121,0.3)] disabled:opacity-50 flex items-center gap-2">
                            {processing ? <><i className="fas fa-circle-notch fa-spin" /> Processing...</> : 'Complete Dispense'}
                        </button>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-[16px] shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100">
                    <h2 className="font-semibold text-gray-900 text-[15px]">Recent Dispense Records</h2>
                </div>
                <div className="overflow-x-auto w-full">
                    <table className="w-full min-w-[800px] text-left text-[13px]">
                        <thead>
                            <tr className="border-b border-gray-100">
                                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">Medicine</th>
                                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">Qty</th>
                                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">Patient</th>
                                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">Prescription</th>
                                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">Batch</th>
                                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">By</th>
                                {canDelete && <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-gray-500">Actions</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {rows.map((r) => (
                                <tr key={r.stock_out_id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-4 py-3 text-gray-900 font-medium">{r.medicine?.generic_name}</td>
                                    <td className="px-4 py-3 text-gray-600">{r.quantity}</td>
                                    <td className="px-4 py-3 text-gray-600">{r.patient_name || '—'}</td>
                                    <td className="px-4 py-3 text-gray-600">{r.prescription_no || '—'}</td>
                                    <td className="px-4 py-3 text-gray-600">{r.stock_in?.batch_no}</td>
                                    <td className="px-4 py-3 text-gray-600">{r.dispensed_by?.full_name}</td>
                                    {canDelete && (
                                        <td className="px-4 py-3 text-right">
                                            <button className="text-critical-red hover:underline text-[13px] font-semibold" onClick={() => setPendingDelete(r.stock_out_id)}>
                                                Delete
                                            </button>
                                        </td>
                                    )}
                                </tr>
                            ))}
                            {rows.length === 0 && <tr><td colSpan={canDelete ? 7 : 6} className="px-4 py-8 text-center text-gray-400">No dispensing records yet.</td></tr>}
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