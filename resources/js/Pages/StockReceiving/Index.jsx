import { useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import StatCard from '@/Components/StatCard';
import ConfirmDialog from '@/Components/ConfirmDialog';
import ExpiryWarning from '@/Components/ExpiryWarning';
import Pagination from '@/Components/Pagination';

export default function StockReceivingIndex({ medicines, suppliers, records, alerts, expiryWarning }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        medicine_id: '', quantity: '', cost_price: '', sell_price: '',
        batch_no: '', expiry_date: '', supplier_id: '', supplier: '', invoice_no: '', delivery_date: '',
    });

    const [pendingDelete, setPendingDelete] = useState(null);
    const rows = records?.data ?? [];
    const freeTextSupplier = data.supplier_id === '';

    function handleMedicineChange(e) {
        const id = e.target.value;
        const med = medicines.find((m) => String(m.medicine_id) === id);
        setData({ ...data, medicine_id: id, sell_price: med && med.price > 0 ? Number(med.price).toFixed(2) : '' });
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
            onSuccess: () => reset('medicine_id', 'quantity', 'cost_price', 'sell_price', 'batch_no', 'expiry_date', 'supplier_id', 'supplier', 'invoice_no', 'delivery_date'),
        });
    }

    function confirmDelete() {
        router.delete(route('stock-receiving.destroy', pendingDelete.id), { onFinish: () => setPendingDelete(null) });
    }

    return (
        <AuthenticatedLayout>
            <Head title="Stock Receiving" />
            <div>
    <h1 className="text-2xl font-semibold text-charcoal-blue mb-1">Stock Receiving</h1>
    <p className="text-sm text-charcoal-blue opacity-70">Record incoming medicine batches, track suppliers, and manage inventory intake.</p>
</div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <StatCard icon="fa-triangle-exclamation" label="Low Stock" value={alerts.lowStock} tone="warning" onClick={() => router.get('/medicine-list?filter=lowstock')} />
                <StatCard icon="fa-circle-xmark" label="Out of Stock" value={alerts.outOfStock} tone="danger" onClick={() => router.get('/medicine-list?filter=outofstock')} />
                <StatCard icon="fa-hourglass-half" label="Expiring (30d)" value={alerts.expiringSoon} tone="warning" onClick={() => router.get('/medicine-list?filter=expiring')} />
            </div>

            <ExpiryWarning data={expiryWarning} storageKey="expiry-warning-receiving" />

            <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white rounded-[15px] border border-eggshell p-5">
                <div className="md:col-span-1">
                    <label className="block text-sm font-medium mb-1 text-charcoal-blue">Medicine<span className="text-critical-red">*</span></label>
                    <select className="w-full rounded-lg border-gray-300 focus:border-cherry-blossom focus:ring-cherry-blossom" value={data.medicine_id} onChange={handleMedicineChange}>
                        <option value="" disabled>Select medicine...</option>
                        {medicines.map((m) => <option key={m.medicine_id} value={m.medicine_id} data-price={m.price}>{m.generic_name} {m.brand_name ? `(${m.brand_name})` : ''} — stock: {m.current_stock}</option>)}
                    </select>
                    {errors.medicine_id && <p className="text-critical-red text-xs mt-1">{errors.medicine_id}</p>}
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1 text-charcoal-blue">Quantity<span className="text-critical-red">*</span></label>
                    <input type="number" min="1" className="w-full rounded-lg border-gray-300 focus:border-cherry-blossom focus:ring-cherry-blossom" value={data.quantity} onChange={(e) => setData('quantity', e.target.value)} />
                    {errors.quantity && <p className="text-critical-red text-xs mt-1">{errors.quantity}</p>}
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1 text-charcoal-blue">Batch No.<span className="text-critical-red">*</span></label>
                    <input type="text" className="w-full rounded-lg border-gray-300 focus:border-cherry-blossom focus:ring-cherry-blossom" value={data.batch_no} onChange={(e) => setData('batch_no', e.target.value)} />
                    {errors.batch_no && <p className="text-critical-red text-xs mt-1">{errors.batch_no}</p>}
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1 text-charcoal-blue">Expiry Date<span className="text-critical-red">*</span></label>
                    <input type="date" className="w-full rounded-lg border-gray-300 focus:border-cherry-blossom focus:ring-cherry-blossom" value={data.expiry_date} onChange={(e) => setData('expiry_date', e.target.value)} />
                    {errors.expiry_date && <p className="text-critical-red text-xs mt-1">{errors.expiry_date}</p>}
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1 text-charcoal-blue">Cost Price (₱)<span className="text-critical-red">*</span></label>
                    <input type="number" step="0.01" min="0.01" className="w-full rounded-lg border-gray-300 focus:border-cherry-blossom focus:ring-cherry-blossom" value={data.cost_price} onChange={(e) => setData('cost_price', e.target.value)} />
                    {errors.cost_price && <p className="text-critical-red text-xs mt-1">{errors.cost_price}</p>}
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1 text-charcoal-blue">Selling Price (₱)</label>
                    <input type="number" step="0.01" min="0" className="w-full rounded-lg border-gray-300 focus:border-cherry-blossom focus:ring-cherry-blossom" value={data.sell_price} onChange={(e) => setData('sell_price', e.target.value)} />
                    {errors.sell_price && <p className="text-critical-red text-xs mt-1">{errors.sell_price}</p>}
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1 text-charcoal-blue">Supplier<span className="text-critical-red">*</span></label>
                    <select className="w-full rounded-lg border-gray-300 focus:border-cherry-blossom focus:ring-cherry-blossom" value={data.supplier_id} onChange={handleSupplierChange}>
                        <option value="">— Other / free text —</option>
                        {suppliers.map((s) => <option key={s.supplier_id} value={s.supplier_id}>{s.name}</option>)}
                    </select>
                    {freeTextSupplier && (
                        <input type="text" placeholder="Type supplier name" className="mt-2 w-full rounded-lg border-gray-300 focus:border-cherry-blossom focus:ring-cherry-blossom" value={data.supplier} onChange={(e) => setData('supplier', e.target.value)} />
                    )}
                    {(errors.supplier_id || errors.supplier) && <p className="text-critical-red text-xs mt-1">{errors.supplier_id || errors.supplier}</p>}
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1 text-charcoal-blue">Invoice No.<span className="text-critical-red">*</span></label>
                    <input type="text" className="w-full rounded-lg border-gray-300 focus:border-cherry-blossom focus:ring-cherry-blossom" value={data.invoice_no} onChange={(e) => setData('invoice_no', e.target.value)} />
                    {errors.invoice_no && <p className="text-critical-red text-xs mt-1">{errors.invoice_no}</p>}
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1 text-charcoal-blue">Delivery Date<span className="text-critical-red">*</span></label>
                    <input type="date" className="w-full rounded-lg border-gray-300 focus:border-cherry-blossom focus:ring-cherry-blossom" value={data.delivery_date} onChange={(e) => setData('delivery_date', e.target.value)} />
                    {errors.delivery_date && <p className="text-critical-red text-xs mt-1">{errors.delivery_date}</p>}
                </div>

                <div className="md:col-span-3 flex justify-end">
                    <button type="submit" disabled={processing} className="rounded-lg px-5 py-2 text-sm font-medium bg-cherry-blossom text-charcoal-blue transition-colors hover:bg-burnt-rose hover:text-white disabled:opacity-50">
                        {processing ? 'Saving...' : 'Record Stock-In'}
                    </button>
                </div>
            </form>

            <div className="bg-white rounded-[15px] border border-eggshell w-full overflow-hidden">
                <div className="overflow-x-auto w-full">
                    <table className="w-full min-w-[800px] text-sm">
                        <thead>
                            <tr className="text-left border-b border-eggshell text-charcoal-blue">
                                <th className="p-4 whitespace-nowrap">Medicine</th>
                                <th className="p-4 whitespace-nowrap">Qty</th>
                                <th className="p-4 whitespace-nowrap">Batch No.</th>
                                <th className="p-4 whitespace-nowrap">Expiry</th>
                                <th className="p-4 whitespace-nowrap">Supplier</th>
                                <th className="p-4 whitespace-nowrap">Received By</th>
                                <th className="p-4 whitespace-nowrap">Recorded At</th>
                                <th className="p-4 text-right whitespace-nowrap">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((r) => (
                                <tr key={r.stock_in_id} className="border-b border-eggshell last:border-0 hover:bg-eggshell/30">
                                    <td className="p-4 text-charcoal-blue font-medium">{r.medicine?.generic_name}</td>
                                    <td className="p-4 text-charcoal-blue">{r.quantity}</td>
                                    <td className="p-4 text-charcoal-blue">{r.batch_no}</td>
                                    <td className="p-4 text-charcoal-blue">{r.expiry_date}</td>
                                    <td className="p-4 text-charcoal-blue">{r.supplier?.name ?? r.supplier ?? '—'}</td>
                                    <td className="p-4 text-charcoal-blue">{r.received_by?.full_name ?? '—'}</td>
                                    <td className="p-4 text-charcoal-blue">{r.recorded_at}</td>
                                    <td className="p-4 text-right">
                                        <button onClick={() => setPendingDelete({ id: r.stock_in_id, name: r.medicine?.generic_name })} className="text-critical-red hover:underline text-sm font-medium">
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {rows.length === 0 && <tr><td colSpan={8} className="p-8 text-center text-gray-400">No stock-in records yet.</td></tr>}
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