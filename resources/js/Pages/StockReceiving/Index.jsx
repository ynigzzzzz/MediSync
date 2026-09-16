import { useState, useMemo } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

export default function StockReceivingIndex({ medicines, records, expiringBatches, alerts }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        medicine_id: '',
        quantity: '',
        cost_price: '',
        sell_price: '',
        batch_no: '',
        expiry_date: '',
        supplier: '',
        invoice_no: '',
        delivery_date: '',
    });

    const [search, setSearch] = useState({ medicine: '', batch: '', expiry: '', supplier: '' });
    const [selectedBatches, setSelectedBatches] = useState([]);
    const [showDispose, setShowDispose] = useState(false);
    const [showExpiryAlert, setShowExpiryAlert] = useState(alerts.hasExpired || alerts.expiringSoon > 0);

    const selectedMedicine = medicines.find((m) => String(m.medicine_id) === String(data.medicine_id));

    function handleMedicineChange(e) {
        const id = e.target.value;
        const med = medicines.find((m) => String(m.medicine_id) === id);
        setData({
            ...data,
            medicine_id: id,
            sell_price: med && med.price > 0 ? Number(med.price).toFixed(2) : '',
        });
    }

    function submit(e) {
        e.preventDefault();
        post(route('stock-receiving.store'), { onSuccess: () => reset() });
    }

    function deleteRecord(id, name) {
        if (!confirm(`Delete stock-in record for "${name}"?`)) return;
        router.delete(route('stock-receiving.destroy', id));
    }

    function toggleBatch(id) {
        setSelectedBatches((prev) =>
            prev.includes(id) ? prev.filter((b) => b !== id) : [...prev, id]
        );
    }

    function confirmDispose() {
        if (selectedBatches.length === 0) return;
        router.post(
            route('stock-receiving.dispose'),
            { batch_ids: selectedBatches },
            { onSuccess: () => { setSelectedBatches([]); setShowDispose(false); } }
        );
    }

    const filteredRecords = useMemo(() => {
        return records.filter((r) => {
            if (search.medicine && !r.medicine.generic_name.toLowerCase().includes(search.medicine.toLowerCase())) return false;
            if (search.batch && !r.batch_no.toLowerCase().includes(search.batch.toLowerCase())) return false;
            if (search.expiry && r.expiry_date !== search.expiry) return false;
            if (search.supplier && !(r.supplier ?? '').toLowerCase().includes(search.supplier.toLowerCase())) return false;
            return true;
        });
    }, [records, search]);

    return (
        <AuthenticatedLayout>
            <Head title="Stock Receiving" />
            <>
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-semibold text-charcoal-blue">Stock Receiving</h1>
                    <button
                        onClick={() => setShowDispose(true)}
                        className="px-4 py-2 rounded-md bg-red-600 text-white text-sm hover:bg-red-700"
                    >
                        Dispose Expired/Expiring Batches
                    </button>
                </div>

                {showExpiryAlert && (alerts.hasExpired || alerts.expiringSoon > 0) && (
                    <div className="rounded-md border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800 flex justify-between">
                        <span>
                            {alerts.hasExpired && 'Some batches have already expired. '}
                            {alerts.expiringSoon > 0 && `${alerts.expiringSoon} medicine(s) have batches expiring within 30 days.`}
                        </span>
                        <button onClick={() => setShowExpiryAlert(false)} className="font-medium">Dismiss</button>
                    </div>
                )}

                <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white rounded-lg border p-5">
                    <div className="md:col-span-1">
                        <label className="block text-sm font-medium mb-1 text-charcoal-blue">Medicine</label>
                        <select
                            className="w-full rounded-md border-gray-300"
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
                        {errors.medicine_id && <p className="text-red-600 text-xs mt-1">{errors.medicine_id}</p>}
                    </div>

                    <Field label="Quantity" error={errors.quantity}>
                        <input type="number" min="1" className="w-full rounded-md border-gray-300"
                            value={data.quantity} onChange={(e) => setData('quantity', e.target.value)} />
                    </Field>

                    <Field label="Batch No." error={errors.batch_no}>
                        <input type="text" className="w-full rounded-md border-gray-300"
                            value={data.batch_no} onChange={(e) => setData('batch_no', e.target.value)} />
                    </Field>

                    <Field label="Expiry Date" error={errors.expiry_date}>
                        <input type="date" className="w-full rounded-md border-gray-300"
                            value={data.expiry_date} onChange={(e) => setData('expiry_date', e.target.value)} />
                    </Field>

                    <Field label="Cost Price (₱)" error={errors.cost_price}>
                        <input type="number" step="0.01" min="0.01" className="w-full rounded-md border-gray-300"
                            value={data.cost_price} onChange={(e) => setData('cost_price', e.target.value)} />
                    </Field>

                    <Field label="Selling Price (₱)" error={errors.sell_price}>
                        <input type="number" step="0.01" min="0" className="w-full rounded-md border-gray-300"
                            value={data.sell_price} onChange={(e) => setData('sell_price', e.target.value)} />
                    </Field>

                    <Field label="Supplier" error={errors.supplier}>
                        <input type="text" className="w-full rounded-md border-gray-300"
                            value={data.supplier} onChange={(e) => setData('supplier', e.target.value)} />
                    </Field>

                    <Field label="Invoice No." error={errors.invoice_no}>
                        <input type="text" className="w-full rounded-md border-gray-300"
                            value={data.invoice_no} onChange={(e) => setData('invoice_no', e.target.value)} />
                    </Field>

                    <Field label="Delivery Date" error={errors.delivery_date}>
                        <input type="date" className="w-full rounded-md border-gray-300"
                            value={data.delivery_date} onChange={(e) => setData('delivery_date', e.target.value)} />
                    </Field>

                    <div className="md:col-span-3 flex justify-end">
                        <button
                            type="submit"
                            disabled={processing}
                            className="px-5 py-2 rounded-md bg-blue-600 text-white text-sm hover:bg-blue-700 disabled:opacity-50"
                        >
                            {processing ? 'Saving...' : 'Record Stock-In'}
                        </button>
                    </div>
                </form>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <input placeholder="Search medicine" className="rounded-md border-gray-300 text-sm"
                        value={search.medicine} onChange={(e) => setSearch({ ...search, medicine: e.target.value })} />
                    <input placeholder="Search batch no." className="rounded-md border-gray-300 text-sm"
                        value={search.batch} onChange={(e) => setSearch({ ...search, batch: e.target.value })} />
                    <input type="date" className="rounded-md border-gray-300 text-sm"
                        value={search.expiry} onChange={(e) => setSearch({ ...search, expiry: e.target.value })} />
                    <input placeholder="Search supplier" className="rounded-md border-gray-300 text-sm"
                        value={search.supplier} onChange={(e) => setSearch({ ...search, supplier: e.target.value })} />
                </div>

                <div className="overflow-x-auto bg-white rounded-lg border">
                    <table className="min-w-full text-sm">
                        <thead className="bg-gray-50 text-left">
                            <tr>
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
                            {filteredRecords.map((r) => (
                                <tr key={r.stock_in_id} className="border-t">
                                    <td className="p-3 text-charcoal-blue">{r.medicine.generic_name}</td>
                                    <td className="p-3 text-charcoal-blue">{r.quantity}</td>
                                    <td className="p-3 text-charcoal-blue">{r.batch_no}</td>
                                    <td className="p-3 text-charcoal-blue">{r.expiry_date}</td>
                                    <td className="p-3 text-charcoal-blue">{r.supplier}</td>
                                    <td className="p-3 text-charcoal-blue">{r.received_by?.full_name ?? '—'}</td>
                                    <td className="p-3 text-charcoal-blue">{r.recorded_at}</td>
                                    <td className="p-3 text-right">
                                        <button
                                            onClick={() => deleteRecord(r.stock_in_id, r.medicine.generic_name)}
                                            className="text-red-600 hover:underline text-xs"
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {filteredRecords.length === 0 && (
                                <tr><td colSpan={8} className="p-4 text-center text-gray-400">No matching records.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </>

            {showDispose && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-2xl space-y-4">
                        <h2 className="text-lg font-semibold text-charcoal-blue">Dispose Expiring/Expired Batches</h2>
                        <div className="max-h-72 overflow-y-auto border rounded-md">
                            <table className="min-w-full text-sm">
                                <thead className="bg-gray-50 text-left">
                                    <tr>
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
                                        <tr key={b.stock_in_id} className="border-t">
                                            <td className="p-2">
                                                <input type="checkbox"
                                                    checked={selectedBatches.includes(b.stock_in_id)}
                                                    onChange={() => toggleBatch(b.stock_in_id)} />
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
                            <button onClick={() => setShowDispose(false)} className="px-4 py-2 text-sm rounded-md border">
                                Cancel
                            </button>
                            <button
                                onClick={confirmDispose}
                                disabled={selectedBatches.length === 0}
                                className="px-4 py-2 text-sm rounded-md bg-red-600 text-white disabled:opacity-50"
                            >
                                Dispose {selectedBatches.length > 0 ? `(${selectedBatches.length})` : ''}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}

function Field({ label, error, children }) {
    return (
        <div>
            <label className="block text-sm font-medium mb-1 text-charcoal-blue">{label}</label>
            {children}
            {error && <p className="text-red-600 text-xs mt-1">{error}</p>}
        </div>
    );
}