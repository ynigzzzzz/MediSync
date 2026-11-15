import Badge from '@/Components/Badge';
import Pagination from '@/Components/Pagination';

const inputCls = "rounded-xl border border-transparent bg-[#F2F2F7] px-3 py-1.5 text-[13px] text-gray-900 focus:border-[#FF4D79] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF4D79]/20 transition-all";

export default function HistoryTable({ 
    transactions, users,
    search, setSearch, type, setType, dateFrom, setDateFrom, dateTo, setDateTo, user, setUser, applyFilters, clearFilters
}) {
    const rows = transactions?.data ?? [];

    return (
        <div className="bg-white rounded-[16px] shadow-sm border border-gray-100 overflow-hidden mb-4">
            {/* Integrated Filter Header */}
            <div className="p-4 border-b border-gray-100 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                <h2 className="font-semibold text-gray-900 text-[15px] whitespace-nowrap">Transactions</h2>
                
                <form onSubmit={applyFilters} className="flex flex-wrap items-center gap-2 w-full xl:w-auto">
                    <input type="text" className={`${inputCls} w-full sm:w-40`} value={search} onChange={e => setSearch(e.target.value)} placeholder="Search meds, patient..." />
                    <select className={`${inputCls} w-full sm:w-32`} value={type} onChange={e => setType(e.target.value)}>
                        <option value="all">All Types</option>
                        <option value="Stock-In">Stock-In</option>
                        <option value="Stock-Out">Stock-Out</option>
                    </select>
                    <input type="date" className={`${inputCls} w-full sm:w-36`} value={dateFrom} onChange={e => setDateFrom(e.target.value)} title="Date From" />
                    <input type="date" className={`${inputCls} w-full sm:w-36`} value={dateTo} onChange={e => setDateTo(e.target.value)} title="Date To" />
                    <select className={`${inputCls} w-full sm:w-32`} value={user} onChange={e => setUser(e.target.value)}>
                        <option value="all">All Users</option>
                        {users.map((u, i) => <option key={i} value={u}>{u}</option>)}
                    </select>
                    <div className="flex gap-2 w-full sm:w-auto">
                        <button type="button" onClick={clearFilters} className="px-3 py-1.5 text-[12px] font-semibold text-gray-500 hover:text-gray-900">Clear</button>
                        <button type="submit" className="rounded-full bg-gray-900 text-white text-[12px] font-semibold px-4 py-1.5 hover:bg-black transition-colors shadow-sm">Filter</button>
                    </div>
                </form>
            </div>

            <div className="overflow-x-auto w-full">
                <table className="w-full min-w-[1000px] text-left text-[13px]">
                    <thead>
                        <tr className="border-b border-gray-100">
                            <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">Date & Time</th>
                            <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">Type</th>
                            <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">Medicine</th>
                            <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">Qty</th>
                            <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">Price</th>
                            <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">Batch / Ref</th>
                            <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">Party</th>
                            <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">User</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {rows.map((r) => {
                            const isStockIn = r.transaction_type === 'Stock-In';
                            return (
                                <tr key={`${r.source_table}-${r.record_id}`} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                                        {new Date(r.date_time).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}
                                    </td>
                                    <td className="px-4 py-3">
                                        <Badge tone={isStockIn ? 'success' : 'rose'}>{r.transaction_type}</Badge>
                                    </td>
                                    <td className="px-4 py-3 text-gray-900 font-medium whitespace-nowrap">
                                        {r.generic_name} {r.brand_name && <span className="text-gray-400 text-[11px]">({r.brand_name})</span>}
                                    </td>
                                    <td className={`px-4 py-3 font-bold ${isStockIn ? 'text-success-green' : 'text-critical-red'}`}>
                                        {isStockIn ? '+' : '-'}{r.quantity}
                                    </td>
                                    <td className="px-4 py-3 text-gray-600">₱{r.selling_price}</td>
                                    <td className="px-4 py-3 text-gray-600">
                                        <div>{r.batch_reference || '—'}</div>
                                        <div className="text-[11px] text-gray-400">{r.expiry_date ? `Exp: ${r.expiry_date}` : ''}</div>
                                    </td>
                                    <td className="px-4 py-3 text-gray-600">{isStockIn ? (r.supplier || '—') : (r.patient_name || 'Walk-in')}</td>
                                    <td className="px-4 py-3 text-gray-600">{r.user_name || 'System'}</td>
                                </tr>
                            );
                        })}
                        {rows.length === 0 && <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">No transactions found matching your filters.</td></tr>}
                    </tbody>
                </table>
            </div>
            <Pagination meta={transactions} label="transactions" />
        </div>
    );
}