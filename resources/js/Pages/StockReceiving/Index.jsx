import { useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import StatCard from '@/Components/StatCard';
import ConfirmDialog from '@/Components/ConfirmDialog';
import ExpiryWarning from '@/Components/ExpiryWarning';
import Pagination from '@/Components/Pagination';

const inputCls = "w-full rounded-xl border border-transparent bg-[#F2F2F7] px-3 py-2 text-[14px] text-gray-900 placeholder-gray-400 focus:border-gray-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-gray-100 transition-all";
const lockedCls = "w-full rounded-xl border border-transparent bg-gray-100 px-3 py-2 text-[14px] text-gray-500 cursor-not-allowed";

export default function StockReceivingIndex({ medicines, suppliers, records, alerts, expiryWarning }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        medicine_id: '', quantity: '', batch_no: '', expiry_date: '', 
        cost_price: '', sell_price: '', dosage: '',
        supplier_id: '', supplier: '', delivery_date: '',
    });

    const [pendingDelete, setPendingDelete] = useState(null);
    const rows = records?.data ?? [];
    const freeTextSupplier = data.supplier_id === '';

    function handleMedicineChange(e) {
        const id = e.target.value;
        const med = medicines.find((m) => String(m.medicine_id) === id);
        setData({ 
            ...data, 
            medicine_id: id, 
            sell_price: med && med.price > 0 ? Number(med.price).toFixed(2) : '',
            dosage: med && med.dosage ? med.dosage : ''
        });
    }

    function handleSupplierChange(e) {
        const id = e.target.value;
        if (id === '') setData({ ...data, supplier_id: '', supplier: '' });
        else {
            const s = suppliers.find((x) => String(x.supplier_id) === id);
            setData({ ...data, supplier_id: id, supplier: s ? s.name : '' });
        }
    }

    function submit(e) {
        e.preventDefault();
        post(route('stock-receiving.store'), {
            onSuccess: () => reset('medicine_id', 'quantity', 'cost_price', 'sell_price', 'batch_no', 'expiry_date', 'supplier_id', 'supplier', 'delivery_date', 'dosage'),
        });
    }

    function confirmDelete() {
        router.delete(route('stock-receiving.destroy', pendingDelete.id), { onFinish: () => setPendingDelete(null) });
    }

    return (
        <AuthenticatedLayout>
            <Head title="Stock Receiving" />
            
            <div className="mb-5">
                <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Stock Receiving</h1>
                <p className="text-[13px] text-gray-500">Record incoming medicine batches, track suppliers, and manage inventory intake.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                <StatCard icon="fa-triangle-exclamation" label="Low Stock" value={alerts.lowStock} tone="warning" onClick={() => router.get('/medicine-list?filter=lowstock')} />
                <StatCard icon="fa-circle-xmark" label="Out of Stock" value={alerts.outOfStock} tone="danger" onClick={() => router.get('/medicine-list?filter=outofstock')} />
                <StatCard icon="fa-hourglass-half" label="Expiring (30d)" value={alerts.expiringSoon} tone="warning" onClick={() => router.get('/medicine-list?filter=expiring')} />
            </div>

            <ExpiryWarning data={expiryWarning} storageKey="expiry-warning-receiving" />

            <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white rounded-[16px] shadow-sm border border-gray-100 p-5 mb-4">
                {/* Most Important */}
                <div className="md:col-span-1">
                    <label className="block text-[12px] font-semibold text-gray-700 mb-1">Medicine<span className="text-critical-red">*</span></label>
                    <select className={inputCls} value={data.medicine_id} onChange={handleMedicineChange}>
                        <option value="" disabled>Select medicine...</option>
                        {medicines.map((m) => <option key={m.medicine_id} value={m.medicine_id} data-price={m.price}>{m.generic_name} {m.brand_name ? `(${m.brand_name})` : ''} — stock: {m.current_stock}</option>)}
                    </select>
                    {errors.medicine_id && <p className="text-critical-red text-[11px] mt-1">{errors.medicine_id}</p>}
                </div>

                <div>
                    <label className="block text-[12px] font-semibold text-gray-700 mb-1">Quantity<span className="text-critical-red">*</span></label>
                    <input type="number" min="1" className={inputCls} value={data.quantity} onChange={(e) => setData('quantity', e.target.value)} />
                    {errors.quantity && <p className="text-critical-red text-[11px] mt-1">{errors.quantity}</p>}
                </div>

                <div>
                    <label className="block text-[12px] font-semibold text-gray-700 mb-1">Batch No.<span className="text-critical-red">*</span></label>
                    <input type="text" className={inputCls} value={data.batch_no} onChange={(e) => setData('batch_no', e.target.value)} />
                    {errors.batch_no && <p className="text-critical-red text-[11px] mt-1">{errors.batch_no}</p>}
                </div>

                {/* Medium Importance */}
                <div>
                    <label className="block text-[12px] font-semibold text-gray-700 mb-1">Expiry Date<span className="text-critical-red">*</span></label>
                    <input type="date" className={inputCls} value={data.expiry_date} onChange={(e) => setData('expiry_date', e.target.value)} />
                    {errors.expiry_date && <p className="text-critical-red text-[11px] mt-1">{errors.expiry_date}</p>}
                </div>

                <div>
                    <label className="block text-[12px] font-semibold text-gray-700 mb-1">
                        Dosage <span className="text-gray-400 font-normal"></span>
                    </label>
                    <input type="text" readOnly className={lockedCls} value={data.dosage} placeholder="Select a medicine first..." />
                </div>

                <div>
                    <label className="block text-[12px] font-semibold text-gray-700 mb-1">Cost Price (₱)<span className="text-critical-red">*</span></label>
                    <input type="number" step="0.01" min="0.01" className={inputCls} value={data.cost_price} onChange={(e) => setData('cost_price', e.target.value)} />
                    {errors.cost_price && <p className="text-critical-red text-[11px] mt-1">{errors.cost_price}</p>}
                </div>

                {/* Least Important */}
                <div>
                    <label className="block text-[12px] font-semibold text-gray-700 mb-1">
                        Selling Price (₱) <span className="text-gray-400 font-normal"></span>
                    </label>
                    <input type="number" step="0.01" min="0" readOnly className={lockedCls} value={data.sell_price} placeholder="Select a medicine first..." />
                </div>

                <div>
                    <label className="block text-[12px] font-semibold text-gray-700 mb-1">Supplier<span className="text-critical-red">*</span></label>
                    <select className={inputCls} value={data.supplier_id} onChange={handleSupplierChange}>
                        <option value="">— Other / free text —</option>
                        {suppliers.map((s) => <option key={s.supplier_id} value={s.supplier_id}>{s.name}</option>)}
                    </select>
                    {freeTextSupplier && (
                        <input type="text" placeholder="Type supplier name" className={`${inputCls} mt-2`} value={data.supplier} onChange={(e) => setData('supplier', e.target.value)} />
                    )}
                    {(errors.supplier_id || errors.supplier) && <p className="text-critical-red text-[11px] mt-1">{errors.supplier_id || errors.supplier}</p>}
                </div>

                <div>
                    <label className="block text-[12px] font-semibold text-gray-700 mb-1">Delivery Date<span className="text-critical-red">*</span></label>
                    <input type="date" className={inputCls} value={data.delivery_date} onChange={(e) => setData('delivery_date', e.target.value)} />
                    {errors.delivery_date && <p className="text-critical-red text-[11px] mt-1">{errors.delivery_date}</p>}
                </div>

                <div className="md:col-span-3 flex justify-end pt-2">
                    <button type="submit" disabled={processing} className="rounded-full px-6 py-2.5 text-[14px] font-semibold bg-gray-900 text-white hover:bg-black transition-colors shadow-sm disabled:opacity-50">
                        {processing ? 'Saving...' : 'Record Stock-In'}
                    </button>
                </div>
            </form>

            <div className="bg-white rounded-[16px] shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto w-full">
                    <table className="w-full min-w-[800px] text-left text-[13px]">
                        <thead>
                            <tr className="border-b border-gray-100">
                                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">Medicine</th>
                                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">Qty</th>
                                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">Batch No.</th>
                                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">Expiry</th>
                                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">Supplier</th>
                                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">Received By</th>
                                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">Recorded At</th>
                                <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-gray-500">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {rows.map((r) => (
                                <tr key={r.stock_in_id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-4 py-3 text-gray-900 font-medium">{r.medicine?.generic_name}</td>
                                    <td className="px-4 py-3 text-gray-600">{r.quantity}</td>
                                    <td className="px-4 py-3 text-gray-600">{r.batch_no}</td>
                                    <td className="px-4 py-3 text-gray-600">{r.expiry_date}</td>
                                    <td className="px-4 py-3 text-gray-600">{r.supplier?.name ?? r.supplier ?? '—'}</td>
                                    <td className="px-4 py-3 text-gray-600">{r.received_by?.full_name ?? '—'}</td>
                                    <td className="px-4 py-3 text-gray-600">{r.recorded_at}</td>
                                    <td className="px-4 py-3 text-right">
                                        <button onClick={() => setPendingDelete({ id: r.stock_in_id, name: r.medicine?.generic_name })} className="text-critical-red hover:underline text-[13px] font-semibold">
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {rows.length === 0 && <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">No stock-in records yet.</td></tr>}
                        </tbody>
                    </table>
                </div>
                <Pagination meta={records} label="records" />
            </div>

            <ConfirmDialog
                open={!!pendingDelete}
                onOpenChange={(o) => !o && setPendingDelete(null)}
                title="Delete this stock-in record?"
                description={pendingDelete ? `The received units for "${pendingDelete.name}" will be removed from inventory.` : ''}
                confirmLabel="Delete"
                tone="danger"
                onConfirm={confirmDelete}
            />
        </AuthenticatedLayout>
    );
}