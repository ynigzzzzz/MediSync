import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/Components/ui/card';
import Badge from '@/Components/Badge';

function peso(n) { return '₱' + Number(n || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }

export default function SuppliersTab({ supplierSummary }) {
    return (
        <div className="mt-0 grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
            <Card className="lg:col-span-2">
                <CardHeader><CardTitle>Supplier Directory</CardTitle></CardHeader>
                <CardContent className="p-0 overflow-x-auto">
                    <table className="w-full text-left text-[13px]">
                        <thead>
                            <tr className="border-b border-gray-100">
                                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">Name</th>
                                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">Contact</th>
                                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">Status</th>
                                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">Batches</th>
                                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">Cost</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {supplierSummary.length === 0 ? (
                                <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">No suppliers yet.</td></tr>
                            ) : supplierSummary.map((s) => (
                                <tr key={s.supplier_id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-4 py-3 text-gray-900 font-medium">{s.name}</td>
                                    <td className="px-4 py-3 text-gray-600">{s.contact_person || '—'}</td>
                                    <td className="px-4 py-3">
                                        <Badge tone={s.status === 'active' ? 'success' : 'warning'} outline>{s.status}</Badge>
                                    </td>
                                    <td className="px-4 py-3 text-gray-600">{s.batches}</td>
                                    <td className="px-4 py-3 text-gray-600">{peso(s.cost)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </CardContent>
            </Card>
            
            <Card>
                <CardHeader>
                    <CardTitle>Supplier Checklist</CardTitle>
                    <CardDescription>Pending actions for your vendors.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {[
                        { title: 'Update inactive suppliers', desc: '2 suppliers are currently marked inactive.', done: false },
                        { title: 'Verify contact info', desc: '3 suppliers are missing phone numbers.', done: false },
                        { title: 'Quarterly review', desc: 'All active suppliers reviewed for Q3.', done: true },
                        { title: 'Tax documents', desc: 'W-9 forms collected for all vendors.', done: true },
                    ].map((task, i) => (
                        <div key={i} className="flex items-start gap-3">
                            <div className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center shrink-0 border ${task.done ? 'bg-success-green border-success-green text-white' : 'border-gray-300 text-transparent'}`}>
                                <i className="fas fa-check text-[10px]" />
                            </div>
                            <div>
                                <p className={`text-[13px] font-semibold ${task.done ? 'text-gray-400 line-through' : 'text-gray-900'}`}>{task.title}</p>
                                <p className="text-[12px] text-gray-500">{task.desc}</p>
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>
    );
}