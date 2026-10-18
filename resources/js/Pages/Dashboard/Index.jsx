import { Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import StatCard from '@/Components/StatCard';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/Components/ui/card';
import { ActivityAreaChart } from '@/Components/Charts/AreaChart';
import { cn } from '@/lib/utils';

const ATTENTION_TONES = {
    danger:  'bg-critical-red/10 text-critical-red',
    warning: 'bg-warning-orange/10 text-warning-orange',
    rose:    'bg-burnt-rose/10 text-burnt-rose',
    info:    'bg-charcoal-blue/10 text-charcoal-blue',
};

function computeTrend(trend) {
    if (!trend) return null;
    
    // Option A: Hide the trend pill if both today and yesterday are 0.
    if (trend.current === 0 && trend.previous === 0) return null;
    
    const delta = trend.current - trend.previous;
    if (delta === 0) return { direction: 'flat', label: '— 0' };
    if (delta > 0)   return { direction: 'up',   label: `▲ +${delta}` };
    return { direction: 'down', label: `▼ ${Math.abs(delta)}` };
}

export default function Index({ stats, trends, attention, activity, recentActivity }) {
    const dispensedTrend = computeTrend(trends?.dispensed);
    const receivedTrend  = computeTrend(trends?.received);

    const cards = [
        { icon: 'fa-capsules',            label: 'Total Medicines',  value: stats.totalMedicines },
        { icon: 'fa-triangle-exclamation', label: 'Low Stock',       value: stats.lowStockCount, tone: 'warning' },
        { icon: 'fa-circle-xmark',        label: 'Out of Stock',     value: stats.outOfStockCount, tone: 'danger' },
        { icon: 'fa-hourglass-half',      label: 'Expiring (30d)',   value: stats.expiringSoonCount, tone: 'warning' },
        { icon: 'fa-arrow-up',            label: 'Dispensed Today',  value: stats.dispensedToday, trend: dispensedTrend },
        { icon: 'fa-arrow-down',          label: 'Received Today',   value: stats.receivedToday, trend: receivedTrend },
    ];

    return (
        <AuthenticatedLayout>
            <Head title="Dashboard" />

            <div>
    <h1 className="text-2xl font-semibold text-charcoal-blue mb-1">Dashboard</h1>
    <p className="text-sm text-charcoal-blue opacity-70">Overview of pharmacy operations, stock alerts, and recent activity.</p>
</div>

            {/* Stat cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {cards.map((c) => <StatCard key={c.label} {...c} />)}
            </div>

            {/* Needs Attention + Activity chart */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Needs Attention</CardTitle>
                        <CardDescription>Issues that need action.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        {attention.length === 0 ? (
                            <div className="p-6 text-center text-sm text-gray-400">
                                <i className="fas fa-check-circle text-2xl mb-2 block text-success-green opacity-60" />
                                All good ✨
                            </div>
                        ) : (
                            <ul>
                                {attention.map((item, i) => (
                                    <li key={i} className="border-b border-eggshell last:border-0">
                                        <Link
                                            href={item.link}
                                            className="flex items-center gap-3 px-4 py-3 hover:bg-eggshell/30 transition-colors"
                                        >
                                            <div className={cn(
                                                'w-9 h-9 shrink-0 rounded-full flex items-center justify-center',
                                                ATTENTION_TONES[item.type] || ATTENTION_TONES.info,
                                            )}>
                                                <i className={`fas ${item.icon} text-sm`} />
                                            </div>
                                            <span className="flex-1 text-sm text-charcoal-blue">{item.message}</span>
                                            <i className="fas fa-chevron-right text-xs text-charcoal-blue opacity-40" />
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </CardContent>
                </Card>

                <Card className="lg:col-span-3">
                    <CardHeader>
                        <CardTitle>Last 14 Days Activity</CardTitle>
                        <CardDescription>Received vs dispensed units per day.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ActivityAreaChart data={activity} />
                    </CardContent>
                </Card>
            </div>

            {/* Recent dispensing table */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Recent Dispensing</CardTitle>
                        <CardDescription>Latest 5 dispenses across the system.</CardDescription>
                    </div>
                    <Link href="/transaction-history" className="text-sm text-burnt-rose hover:underline">
                        View all →
                    </Link>
                </CardHeader>
                <CardContent className="p-0">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-left border-b border-eggshell text-charcoal-blue">
                                <th className="p-3 text-xs uppercase tracking-wide font-medium">Medicine</th>
                                <th className="p-3 text-xs uppercase tracking-wide font-medium">Qty</th>
                                <th className="p-3 text-xs uppercase tracking-wide font-medium">By</th>
                                <th className="p-3 text-xs uppercase tracking-wide font-medium">When</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentActivity.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="p-6 text-center text-gray-400">No activity yet.</td>
                                </tr>
                            ) : recentActivity.map((r) => (
                                <tr key={r.stock_out_id} className="border-b border-eggshell last:border-0 hover:bg-eggshell/30">
                                    <td className="p-3 text-charcoal-blue">{r.medicine?.generic_name}</td>
                                    <td className="p-3 text-charcoal-blue">{r.quantity}</td>
                                    <td className="p-3 text-charcoal-blue">{r.dispensed_by?.full_name}</td>
                                    <td className="p-3 text-charcoal-blue">{new Date(r.dispensed_at).toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </CardContent>
            </Card>
        </AuthenticatedLayout>
    );
}