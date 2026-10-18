import { useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import StatCard from '@/Components/StatCard';
import ConfirmDialog from '@/Components/ConfirmDialog';
import ExpiryWarning from '@/Components/ExpiryWarning';
import Pagination from '@/Components/Pagination';

export default function StockReceivingIndex({ medicines, suppliers, records, expiringBatches, alerts, expiryWarning }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        medicine_id: '',
        quantity: '',
        cost_price: '',
        sell_price: '',
        batch_no: '',
        expiry_date: '',
        supplier_id: '',
        supplier: '',
        invoice_no: '',
        delivery_date: '',
    });

    const [selectedBatches, setSelectedBatches] = useState([]);
    const [showDispose, setShowDispose] = useState(false);
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
        });
    }

    function handleSupplierChange(e) {
        const id = e.target.value;
        if (id === '') {
            setData({ ...data, supplier_id: '', supplier: '' });
        } else {
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
        router.delete(route('stock-receiving.destroy', pendingDelete.id), {
            onFinish: () => setPendingDelete(null),
        });
    }

    function toggleBatch(id) {
        setSelectedBatches((prev) => (prev.includes(id) ? prev.filter((b) => b !== id) : [...prev, id]));
    }

    function confirmDispose() {
        if (selectedBatches.length === 0) return;
        router.post(
            route('stock-receiving.dispose'),
            { batch_ids: selectedBatches },
            { onSuccess: () => { setSelectedBatches([]); setShowDispose(false); } }
        );
    }

    return (
        <AuthenticatedLayout>
            <Head title="Stock Receiving" />

            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-semibold text-charcoal-blue">Stock Receiving</h1>
                <button
                    onClick={() => setShowDispose(true)}
                    className="rounded-lg px-4 py-1.5 text-sm font-medium bg-critical-red text-white hover:opacity-90"
                >
                    Dispose Expired/Expiring Batches
                </button>
            </div>

            <div className="grid grid-cols-3 gap-4">
                <StatCard icon="fa-triangle-exclamation" label="Low Stock" value={alerts.lowStock} color="#E67E22" />
                <StatCard icon="fa-circle-xmark" label="Out of Stock" value={alerts.outOfStock} color="#DC3545" />
                <StatCard icon="fa-hourglass-half" label="Expiring Soon" value={alerts.expiringSoon} color="#E67E22" />
            </div>

            <ExpiryWarning data={expiryWarning} storageKey="expiry-warning-receiving" />

            <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white rounded-[15px] border border-eggshell p-5">
                <div className="md:col-span-1">
                    <label className="block text-sm font-medium mb-1 text-charcoal-blue">Medicine*</label>
                    <select
                        className="w-full rounded-lg border-gray-300 focus:border-cherry-blossom focus:ring-cherry-blossom"
                        value={data.medicine_id}
                        onChange={handleMedicineChange}
                    >
                        <option value="">Select medicine...</option>
                        {medicines.map((m) => (
                            <option key={m.medicine_id} value={m.medicine_id} data-price={m.price}>
                                {m.generic_name} {m.brand_name ? `(${m.brand_name})` : ''} — stock: {m.current_stock}
                            </option>
                        ))}
                    </select>
                    {errors.medicine_id && <p className="text-critical-red text-xs mt-1">{errors.medicine_id}</p>}
                </div>

                <Field label="Quantity*" error={errors.quantity}>
                    <input type="number" min="1" className="w-full rounded-lg border-gray-300 focus:border-cherry-blossom focus:ring-cherry-blossom"
                        value={data.quantity} onChange={(e) => setData('quantity', e.target.value)} />
                </Field>

                <Field label="Batch No.*" error={errors.batch_no}>
                    <input type="text" className="w-full rounded-lg border-gray-300 focus:border-cherry-blossom focus:ring-cherry-blossom"
                        value={data.batch_no} onChange={(e) => setData('batch_no', e.target.value)} />
                </Field>

                <Field label="Expiry Date*" error={errors.expiry_date}>
                    <input type="date" className="w-full rounded-lg border-gray-300 focus:border-cherry-blossom focus:ring-cherry-blossom"
                        value={data.expiry_date} onChange={(e) => setData('expiry_date', e.target.value)} />
                </Field>

                <Field label="Cost Price (₱)*" error={errors.cost_price}>
                    <input type="number" step="0.01" min="0.01" className="w-full rounded-lg border-gray-300 focus:border-cherry-blossom focus:ring-cherry-blossom"
                        value={data.cost_price} onChange={(e) => setData('cost_price', e.target.value)} />
                </Field>

                <Field label="Selling Price (₱)" error={errors.sell_price}>
                    <input type="number" step="0.01" min="0" className="w-full rounded-lg border-gray-300 focus:border-cherry-blossom focus:ring-cherry-blossom"
                        value={data.sell_price} onChange={(e) => setData('sell_price', e.target.value)} />
                </Field>

                <Field label="Supplier*" error={errors.supplier_id || errors.supplier}>
                    <select
                        className="w-full rounded-lg border-gray-300 focus:border-cherry-blossom focus:ring-cherry-blossom"
                        value={data.supplier_id}
                        onChange={handleSupplierChange}
                    >
                        <option value="">— Other / free text —</option>
                        {suppliers.map((s) => (
                            <option key={s.supplier_id} value={s.supplier_id}>{s.name}</option>
                        ))}
                    </select>
                    {freeTextSupplier && (
                        <input
                            type="text"
                            placeholder="Type supplier name"
                            className="mt-2 w-full rounded-lg border-gray-300 focus:border-cherry-blossom focus:ring-cherry-blossom"
                            value={data.supplier}
                            onChange={(e) => setData('supplier', e.target.value)}
                        />
                    )}
                </Field>

                <Field label="Invoice No.*" error={errors.invoice_no}>
                    <input type="text" className="w-full rounded-lg border-gray-300 focus:border-cherry-blossom focus:ring-cherry-blossom"
                        value={data.invoice_no} onChange={(e) => setData('invoice_no', e.target.value)} />
                </Field>

                <Field label="Delivery Date*" error={errors.delivery_date}>
                    <input type="date" className="w-full rounded-lg border-gray-300 focus:border-cherry-blossom focus:ring-cherry-blossom"
                        value={data.delivery_date} onChange={(e) => setData('delivery_date', e.target.value)} />
                </Field>

                <div className="md:col-span-3 flex justify-end">
                    <button
                        type="submit"
                        disabled={processing}
                        className="rounded-lg px-5 py-2 text-sm font-medium bg-cherry-blossom text-charcoal-blue transition-colors hover:bg-burnt-rose hover:text-white disabled:opacity-50"
                    >
                        {processing ? 'Saving...' : 'Record Stock-In'}
                    </button>
                </div>
            </form>

            <div className="overflow-x-auto bg-white rounded-[15px] border border-eggshell">
                <table className="min-w-full text-sm">
                    <thead>
                        <tr className="text-left border-b border-eggshell">
                            <th className="p-3 text-charcoal-blue">Medicine</th>
                            <th className="p-3 text-charcoal-blue">Qty</th>
                            <th className="p-3 text-charcoal-blue">Batch No.</th>
                            <th className="p-3 text-charcoal-blue">Expiry</th>
                            <th className="p-3 text-charcoal-blue">Supplier</th>
                            <th className="p-3 text-charcoal-blue">Received By</th>
                            <th className="p-3 text-charcoal-blue">Recorded At</th>
                            <th className="p-3"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((r) => (
                            <tr key={r.stock_in_id} className="border-b border-eggshell last:border-0 hover:bg-[rgba(223,226,207,0.3)]">
                                <td className="p-3 text-charcoal-blue">{r.medicine?.generic_name}</td>
                                <td className="p-3 text-charcoal-blue">{r.quantity}</td>
                                <td className="p-3 text-charcoal-blue">{r.batch_no}</td>
                                <td className="p-3 text-charcoal-blue">{r.expiry_date}</td>
                                <td className="p-3 text-charcoal-blue">
                                    {r.supplier?.name ?? r.supplier ?? '—'}
                                </td>
                                <td className="p-3 text-charcoal-blue">{r.received_by?.full_name ?? '—'}</td>
                                <td className="p-3 text-charcoal-blue">{r.recorded_at}</td>
                                <td className="p-3 text-right">
                                    <button
                                        onClick={() => setPendingDelete({ id: r.stock_in_id, name: r.medicine?.generic_name })}
                                        className="text-critical-red hover:underline text-xs font-medium"
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {rows.length === 0 && (
                            <tr><td colSpan={8} className="p-4 text-center text-gray-400">No stock-in records yet.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            <Pagination meta={records} label="records" />

            {showDispose && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-2xl space-y-4">
                        <h2 className="text-lg font-semibold text-charcoal-blue">Dispose Expiring/Expired Batches</h2>
                        <div className="max-h-72 overflow-y-auto border border-eggshell rounded-lg">
                            <table className="min-w-full text-sm">
                                <thead>
                                    <tr className="text-left border-b border-eggshell">
                                        <th className="p-2"></th>
                                        <th className="p-2 text-charcoal-blue">Medicine</th>
                                        <th className="p-2 text-charcoal-blue">Batch</th>
                                        <th className="p-2 text-charcoal-blue">Expiry</th>
                                        <th className="p-2 text-charcoal-blue">Days left</th>
                                        <th className="p-2 text-charcoal-blue">Qty</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {expiringBatches.map((b) => (
                                        <tr key={b.stock_in_id} className="border-b border-eggshell last:border-0">
                                            <td className="p-2">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedBatches.includes(b.stock_in_id)}
                                                    onChange={() => toggleBatch(b.stock_in_id)}
                                                />
                                            </td>
                                            <td className="p-2 text-charcoal-blue">{b.generic_name}</td>
                                            <td className="p-2 text-charcoal-blue">{b.batch_no}</td>
                                            <td className="p-2 text-charcoal-blue">{b.expiry_date}</td>
                                            <td className="p-2 text-charcoal-blue">{b.days_left}</td>
                                            <td className="p-2 text-charcoal-blue">{b.remaining_quantity}</td>
                                        </tr>
                                    ))}
                                    {expiringBatches.length === 0 && (
                                        <tr><td colSpan={6} className="p-4 text-center text-gray-400">No expiring batches.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <div className="flex justify-end gap-3">
                            <button onClick={() => setShowDispose(false)} className="px-4 py-2 text-sm rounded-lg border border-gray-300">Cancel</button>
                            <button
                                onClick={confirmDispose}
                                disabled={selectedBatches.length === 0}
                                className="px-4 py-2 text-sm rounded-lg bg-critical-red text-white disabled:opacity-50"
                            >
                                Dispose {selectedBatches.length > 0 ? `(${selectedBatches.length})` : ''}
                            </button>
                        </div>
                    </div>
                </div>
            )}

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

function Field({ label, error, children }) {
    return (
        <div>
            <label className="block text-sm font-medium mb-1 text-charcoal-blue">{label}</label>
            {children}
            {error && <p className="text-critical-red text-xs mt-1">{error}</p>}
        </div>
    );
}