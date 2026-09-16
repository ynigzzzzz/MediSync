import { Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

const STAT_ICONS = {
    totalMedicines: 'fa-capsules',
    lowStockCount: 'fa-triangle-exclamation',
    outOfStockCount: 'fa-circle-xmark',
    expiringSoonCount: 'fa-hourglass-half',
    dispensedToday: 'fa-arrow-up',
    receivedToday: 'fa-arrow-down',
};

export default function Index({ stats, recentActivity }) {
    const cards = [
        { key: 'totalMedicines', label: 'Total Medicines', value: stats.totalMedicines },
        { key: 'lowStockCount', label: 'Low Stock', value: stats.lowStockCount, color: '#E67E22' },
        { key: 'outOfStockCount', label: 'Out of Stock', value: stats.outOfStockCount, color: '#DC3545' },
        { key: 'expiringSoonCount', label: 'Expiring Within 30 Days', value: stats.expiringSoonCount, color: '#E67E22' },
        { key: 'dispensedToday', label: 'Dispensed Today', value: stats.dispensedToday },
        { key: 'receivedToday', label: 'Received Today', value: stats.receivedToday },
    ];

    return (
        <AuthenticatedLayout>
            <Head title="Dashboard" />

            <h1 className="text-2xl font-semibold text-charcoal-blue">Dashboard</h1>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {cards.map((c) => (
                    <StatCard key={c.key} icon={STAT_ICONS[c.key]} label={c.label} value={c.value} color={c.color} />
                ))}
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
                            <tr key={r.stock_out_id} className="border-b border-eggshell last:border-0">
                                <td className="p-3">{r.medicine?.generic_name}</td>
                                <td className="p-3">{r.quantity}</td>
                                <td className="p-3">{r.dispensed_by?.full_name}</td>
                                <td className="p-3">{new Date(r.dispensed_at).toLocaleString()}</td>
                            </tr>
                        ))}
                        {recentActivity.length === 0 && (
                            <tr><td colSpan={4} className="p-4 text-center text-gray-500">No activity yet.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </AuthenticatedLayout>
    );
}

function StatCard({ icon, label, value, color }) {
    return (
        <div className="relative overflow-hidden bg-white border border-eggshell rounded-[15px] p-5 transition-all duration-300 hover:shadow-[0_5px_15px_rgba(0,0,0,0.05)] hover:-translate-y-0.5">
            <i className={`fas ${icon} absolute right-5 top-5 text-3xl text-charcoal-blue opacity-20`} />
            <div className="text-[0.7rem] uppercase tracking-wide text-charcoal-blue mb-2">{label}</div>
            <div className="text-2xl font-bold" style={{ color: color ?? '#2C3E50' }}>{value}</div>
        </div>
    );
}
