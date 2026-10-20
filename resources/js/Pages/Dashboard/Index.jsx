import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import StatCard from '@/Components/StatCard';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/Components/ui/card';
import { StackedBarChart } from '@/Components/Charts/StackedBarChart';
import { DonutChart } from '@/Components/Charts/DonutChart';
import { RadialChart } from '@/Components/Charts/RadialChart';
import { cn } from '@/lib/utils';

const ATTENTION_TONES = {
    danger:  'bg-critical-red/10 text-critical-red',
    warning: 'bg-warning-orange/10 text-warning-orange',
    rose:    'bg-burnt-rose/10 text-burnt-rose',
    info:    'bg-gray-100 text-gray-600',
};

function computeTrend(trend) {
    if (!trend) return null;
    if (trend.current === 0 && trend.previous === 0) return null;
    const delta = trend.current - trend.previous;
    if (delta === 0) return { direction: 'flat', label: '— 0' };
    if (delta > 0)   return { direction: 'up',   label: `▲ +${delta}` };
    return { direction: 'down', label: `▼ ${Math.abs(delta)}` };
}

export default function Index({ stats, trends, attention, activity, recentActivity }) {
    const dispensedTrend = computeTrend(trends?.dispensed);
    const receivedTrend  = computeTrend(trends?.received);
    const [timeRange, setTimeRange] = useState('14d');

    return (
        <AuthenticatedLayout>
            <Head title="Dashboard" />

            <div className="mb-5 flex items-end justify-between">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Dashboard</h1>
                    <p className="text-[13px] text-gray-500">Overview of pharmacy operations and recent activity.</p>
                </div>
                <div className="flex bg-gray-100 p-1 rounded-lg">
                    {['7d', '14d', '30d'].map((range) => (
                        <button
                            key={range}
                            onClick={() => setTimeRange(range)}
                            className={cn(
                                "px-3 py-1 text-[11px] font-semibold rounded-md transition-all",
                                timeRange === range ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-900"
                            )}
                        >
                            {range.toUpperCase()}
                        </button>
                    ))}
                </div>
            </div>

            {/* Stat Cards Row (2 rows of 3) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                <StatCard icon="fa-capsules" label="Total Meds" value={stats.totalMedicines} onClick={() => router.get('/medicine-list')} />
                <StatCard icon="fa-triangle-exclamation" label="Low Stock" value={stats.lowStockCount} tone="warning" onClick={() => router.get('/medicine-list?filter=lowstock')} />
                <StatCard icon="fa-circle-xmark" label="Out of Stock" value={stats.outOfStockCount} tone="danger" onClick={() => router.get('/medicine-list?filter=outofstock')} />
                <StatCard icon="fa-hourglass-half" label="Expiring" value={stats.expiringSoonCount} tone="warning" onClick={() => router.get('/medicine-list?filter=expiring')} />
                <StatCard icon="fa-arrow-up" label="Dispensed" value={stats.dispensedToday} trend={dispensedTrend} />
                <StatCard icon="fa-arrow-down" label="Received" value={stats.receivedToday} trend={receivedTrend} />
            </div>

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                
                {/* 1. Needs Attention */}
                <Card className="flex flex-col">
                    <CardHeader className="pb-2">
                        <CardTitle>Needs Attention</CardTitle>
                        <CardDescription>Issues that require action.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0 flex-1 overflow-y-auto">
                        {attention.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-gray-400 pb-6">
                                <div className="w-10 h-10 rounded-full bg-success-green/10 flex items-center justify-center mb-2">
                                    <i className="fas fa-check-circle text-sm text-success-green" />
                                </div>
                                <p className="text-[13px] font-medium text-gray-900">All good ✨</p>
                            </div>
                        ) : (
                            <ul className="divide-y divide-gray-50">
                                {attention.map((item, i) => (
                                    <li key={i}>
                                        <Link href={item.link} className="flex flex-col gap-2 px-4 py-3 hover:bg-gray-50 transition-colors group">
                                            <div className="flex items-center gap-3">
                                                <div className={cn('w-8 h-8 shrink-0 rounded-full flex items-center justify-center', ATTENTION_TONES[item.type] || ATTENTION_TONES.info)}>
                                                    <i className={`fas ${item.icon} text-xs`} />
                                                </div>
                                                <span className="flex-1 text-[13px] font-medium text-gray-900">{item.message}</span>
                                                <i className="fas fa-chevron-right text-[10px] text-gray-300 group-hover:text-gray-600 transition-colors" />
                                            </div>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </CardContent>
                </Card>

                {/* 2. Stacked Bar Chart */}
                <Card className="lg:col-span-2">
                    <CardHeader className="pb-2">
                        <CardTitle>Daily Intake vs Outtake</CardTitle>
                        <CardDescription>Units received and dispensed per day.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <StackedBarChart data={activity} />
                    </CardContent>
                </Card>

                {/* 3. Category Breakdown (Donut) - Now on the Left */}
                <Card className="lg:col-span-2">
                    <CardHeader className="pb-2">
                        <CardTitle>Category Breakdown</CardTitle>
                    </CardHeader>
                    <CardContent className="flex items-center">
                        <div className="w-1/2">
                            <DonutChart 
                                data={[
                                    { name: 'Antibiotics', value: 400, fill: '#3B82F6' },
                                    { name: 'Vitamins', value: 300, fill: '#2E7D64' },
                                    { name: 'Painkillers', value: 300, fill: '#FF4D79' },
                                    { name: 'Allergies', value: 200, fill: '#E67E22' },
                                ]} 
                            />
                        </div>
                        <div className="w-1/2 space-y-3 pl-4">
                            {[
                                { label: 'Antibiotics', value: '40%', color: '#3B82F6' },
                                { label: 'Vitamins', value: '30%', color: '#2E7D64' },
                                { label: 'Painkillers', value: '30%', color: '#FF4D79' },
                                { label: 'Allergies', value: '20%', color: '#E67E22' },
                            ].map(item => (
                                <div key={item.label} className="flex items-center justify-between text-[13px]">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2.5 h-2.5 rounded-full" style={{ background: item.color }} />
                                        <span className="text-gray-600 font-medium">{item.label}</span>
                                    </div>
                                    <span className="font-bold text-gray-900">{item.value}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* 4. Inventory Health (Radial) - Now on the Right */}
                <Card className="lg:col-span-1">
                    <CardHeader className="pb-2">
                        <CardTitle>Inventory Health</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center justify-center pt-4">
                        <RadialChart 
                            data={[{ name: 'Health', value: 82, fill: '#2E7D64' }]} 
                            value="82%" 
                            label="Healthy" 
                        />
                    </CardContent>
                </Card>
            </div>

            {/* Recent Dispensing Table */}
            <Card className="mt-4">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <div>
                        <CardTitle>Recent Dispensing</CardTitle>
                    </div>
                    <Link href="/transaction-history" className="text-xs font-semibold text-[#FF4D79] hover:text-[#E63E66] transition-colors">
                        View all →
                    </Link>
                </CardHeader>
                <CardContent className="p-0 overflow-x-auto">
                    <table className="w-full text-xs min-w-[500px] text-left">
                        <thead>
                            <tr className="border-b border-gray-100">
                                <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-gray-500">Medicine</th>
                                <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-gray-500">Qty</th>
                                <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-gray-500">By</th>
                                <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-gray-500">When</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {recentActivity.length === 0 ? (
                                <tr><td colSpan={4} className="px-4 py-6 text-center text-gray-400">No activity yet.</td></tr>
                            ) : recentActivity.map((r) => (
                                <tr key={r.stock_out_id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-4 py-3 font-medium text-gray-900">{r.medicine?.generic_name}</td>
                                    <td className="px-4 py-3 text-gray-600">{r.quantity}</td>
                                    <td className="px-4 py-3 text-gray-600">{r.dispensed_by?.full_name}</td>
                                    <td className="px-4 py-3 text-gray-600">{new Date(r.dispensed_at).toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </CardContent>
            </Card>
        </AuthenticatedLayout>
    );
}