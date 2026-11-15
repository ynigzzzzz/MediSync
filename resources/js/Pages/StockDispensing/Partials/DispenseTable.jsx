import Pagination from '@/Components/Pagination';

const inputCls = "rounded-xl border border-transparent bg-[#F2F2F7] px-3 py-1.5 text-[13px] text-gray-900 focus:border-[#FF4D79] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF4D79]/20 transition-all";

export default function DispenseTable({ 
    records, canDelete, onDelete,
    search, setSearch, dateFrom, setDateFrom, dateTo, setDateTo, applyFilters, clearFilters
}) {
    const rows = records?.data ?? [];

    return (
        <div className="bg-white rounded-[16px] shadow-sm border border-gray-100 overflow-hidden">
            {/* Table Header with integrated search */}
            <div className="p-4 border-b border-gray-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <h2 className="font-semibold text-gray-900 text-[15px] whitespace-nowrap">Recent Dispense Records</h2>
                
                <form onSubmit={applyFilters} className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
                    <input type="text" className={`${inputCls} w-full sm:w-48`} value={search} onChange={e => setSearch(e.target.value)} placeholder="Search patient, Rx, meds..." />
                    <input type="date" className={`${inputCls} w-full sm:w-36`} value={dateFrom} onChange={e => setDateFrom(e.target.value)} title="From Date" />
                    <input type="date" className={`${inputCls} w-full sm:w-36`} value={dateTo} onChange={e => setDateTo(e.target.value)} title="To Date" />
                    <div className="flex gap-2 w-full sm:w-auto">
                        <button type="button" onClick={clearFilters} className="px-3 py-1.5 text-[12px] font-semibold text-gray-500 hover:text-gray-900">Clear</button>
                        <button type="submit" className="rounded-full bg-gray-900 text-white text-[12px] font-semibold px-4 py-1.5 hover:bg-black transition-colors shadow-sm">Filter</button>
                    </div>
                </form>
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
                                        <button className="text-critical-red hover:underline text-[13px] font-semibold" onClick={() => onDelete(r.stock_out_id)}>
                                            Delete
                                        </button>
                                    </td>
                                )}
                            </tr>
                        ))}
                        {rows.length === 0 && <tr><td colSpan={canDelete ? 7 : 6} className="px-4 py-8 text-center text-gray-400">No dispensing records found.</td></tr>}
                    </tbody>
                </table>
            </div>
            <Pagination meta={records} label="dispenses" />
        </div>
    );
}