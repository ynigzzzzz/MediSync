import { Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import StatCard from '@/Components/StatCard';

export default function Index({ stats, recentActivity }) {
    const cards = [
        { icon: 'fa-capsules', label: 'Total Medicines', value: stats.totalMedicines },
        { icon: 'fa-triangle-exclamation', label: 'Low Stock', value: stats.lowStockCount, color: '#E67E22' },
        { icon: 'fa-circle-xmark', label: 'Out of Stock', value: stats.outOfStockCount, color: '#DC3545' },
        { icon: 'fa-hourglass-half', label: 'Expiring Within 30 Days', value: stats.expiringSoonCount, color: '#E67E22' },
        { icon: 'fa-arrow-up', label: 'Dispensed Today', value: stats.dispensedToday },
        { icon: 'fa-arrow-down', label: 'Received Today', value: stats.receivedToday },
    ];

    return (
        <AuthenticatedLayout>
            <Head title="Dashboard" />

            <h1 className="text-2xl font-semibold text-charcoal-blue">Dashboard</h1>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {cards.map((c) => <StatCard key={c.label} {...c} />)}
            </div>

            <div className="bg-white rounded-[15px] border border-eggshell overflow-hidden">
                <h2 className="font-semibold text-charcoal-blue p-4 border-b border-eggshell">Recent Dispensing Activity</h2>
                <table className="w-full text-sm">
                    <thead>
                        <tr className="text-left border-b border-eggshell text-charcoal-blue">
                            <th className="p-3">Medicine</th>
                            <th className="p-3">Qty</th>
                            <th className="p-3">By</th>
                            <th className="p-3">When</th>
                        </tr>
                    </thead>
                    <tbody>
                        {recentActivity.map((r) => (
                            <tr key={r.stock_out_id} className="border-b border-eggshell last:border-0 hover:bg-[rgba(223,226,207,0.3)]">
                                <td className="p-3 text-charcoal-blue">{r.medicine?.generic_name}</td>
                                <td className="p-3 text-charcoal-blue">{r.quantity}</td>
                                <td className="p-3 text-charcoal-blue">{r.dispensed_by?.full_name}</td>
                                <td className="p-3 text-charcoal-blue">{new Date(r.dispensed_at).toLocaleString()}</td>
                            </tr>
                        ))}
                        {recentActivity.length === 0 && (
                            <tr><td colSpan={4} className="p-4 text-center text-gray-400">No activity yet.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </AuthenticatedLayout>
    );
}
