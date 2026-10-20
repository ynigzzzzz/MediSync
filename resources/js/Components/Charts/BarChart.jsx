import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { CHART_COLORS } from '@/lib/chart-palette';

export function BarChart({ data, xKey, yKey, label, color = '#3B82F6' }) {
    return (
        <div className="w-full h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
                <RechartsBarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                        <linearGradient id={`bar-gradient-${label.replace(/\s/g, '')}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={color} stopOpacity={1} />
                            <stop offset="100%" stopColor={color} stopOpacity={0.3} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis dataKey={xKey} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6B7280' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6B7280' }} />
                    <Tooltip 
                        cursor={{ fill: '#F9FAFB' }}
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                    />
                    <Bar 
                        dataKey={yKey} 
                        name={label} 
                        fill={`url(#bar-gradient-${label.replace(/\s/g, '')})`} 
                        radius={[6, 6, 0, 0]} 
                        barSize={40}
                    />
                </RechartsBarChart>
            </ResponsiveContainer>
        </div>
    );
}